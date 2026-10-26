import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import ArtistApplication from "../models/ArtistApplication.js";
import VerificationSong from "../models/VerificationSong.js";
import User from "../models/User.js";
import Artist from "../models/Artist.js";

import {
  IMAGE_EXTENSIONS,
  AUDIO_EXTENSIONS,
  AUDIO_MIME_TYPES,
  validateActualImage,
  validateActualAudio,
} from "../utils/fileSecurity.js";

// ============================================================
// PATHS AND CONSTANTS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, "..");

const MAX_VERIFICATION_SIZE = 50 * 1024 * 1024;

// ============================================================
// GENERAL HELPERS
// ============================================================

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getUserId(req) {
  return (
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.user?.user_id ||
    null
  );
}

function isValidObjectId(value) {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

function getFileFromRequest(req, fieldNames = []) {
  for (const fieldName of fieldNames) {
    const file = req.files?.[fieldName];

    if (Array.isArray(file) && file.length > 0) {
      return file[0];
    }

    if (file && !Array.isArray(file)) {
      return file;
    }
  }

  return null;
}

function getOriginalFilename(file) {
  return path.basename(
    file?.originalname ||
      file?.filename ||
      file?.path ||
      "upload"
  );
}

function getFileExtension(file) {
  return path.extname(getOriginalFilename(file)).toLowerCase();
}

function getMimeType(file) {
  return normalizeString(file?.mimetype).toLowerCase();
}

/**
 * Converts a Multer file path into a backend-relative path.
 * Rejects files outside the backend directory.
 */
function getStoredFilePath(file) {
  if (!file) {
    return "";
  }

  if (file.path) {
    const absolutePath = path.resolve(file.path);

    const relativePath = path.relative(
      BACKEND_ROOT,
      absolutePath
    );

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(
        "Uploaded file is outside the backend directory."
      );
    }

    return relativePath.split(path.sep).join("/");
  }

  if (file.filename) {
    const destination = file.destination || "";

    if (destination) {
      const absoluteDestination = path.resolve(destination);

      const relativeDestination = path.relative(
        BACKEND_ROOT,
        absoluteDestination
      );

      if (
        relativeDestination.startsWith("..") ||
        path.isAbsolute(relativeDestination)
      ) {
        throw new Error(
          "Upload destination is outside the backend directory."
        );
      }

      return path.posix.join(
        relativeDestination.split(path.sep).join("/"),
        path.basename(file.filename)
      );
    }

    throw new Error(
      "Uploaded file has no usable storage path."
    );
  }

  throw new Error("Uploaded file path is missing.");
}

/**
 * Safely resolves a backend-relative path.
 */
function resolveBackendFile(storedPath) {
  if (
    typeof storedPath !== "string" ||
    !storedPath.trim()
  ) {
    throw new Error("File path is missing.");
  }

  const normalized = storedPath
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  const absolutePath = path.resolve(
    BACKEND_ROOT,
    normalized
  );

  const relativePath = path.relative(
    BACKEND_ROOT,
    absolutePath
  );

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Invalid file path.");
  }

  return absolutePath;
}

function validateSocialUrl(value) {
  const url = normalizeString(value);

  if (!url) {
    return {
      valid: false,
      value: "",
      message:
        "A social profile or portfolio URL is required.",
    };
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return {
        valid: false,
        value: url,
        message:
          "The profile URL must use HTTP or HTTPS.",
      };
    }

    return {
      valid: true,
      value: url,
      message: "",
    };
  } catch {
    return {
      valid: false,
      value: url,
      message:
        "Please provide a valid social profile or portfolio URL.",
    };
  }
}

function getApplicationResponse(application) {
  if (!application) {
    return null;
  }

  return {
    _id: application._id,
    user_id: application.user_id,
    artist_name: application.artist_name,
    genre: application.genre,
    description: application.description,
    image_url: application.image_url,
    social_profile_url: application.social_profile_url,
    verification_song_id: application.verification_song_id,
    status: application.status,
    admin_note: application.admin_note || "",
    reviewed_by: application.reviewed_by || null,
    reviewed_at: application.reviewed_at || null,
    created_at: application.created_at,
    updated_at: application.updated_at,
  };
}

function getApplicationResponseWithSong(application) {
  if (!application) {
    return null;
  }

  const response = getApplicationResponse(application);
  const song = application.verification_song_id;

  if (song && typeof song === "object") {
    response.verification_song = {
      _id: song._id,
      title: song.title,
      original_filename: song.original_filename,
      duration: song.duration,
      status: song.status,
      createdAt: song.createdAt,
    };
  } else {
    response.verification_song = song || null;
  }

  return response;
}

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({
    success: false,
    message,
    ...extra,
  });
}

// ============================================================
// FILE CLEANUP HELPERS
// ============================================================

function removeFileIfExists(filePath) {
  if (!filePath) {
    return;
  }

  try {
    const absolutePath = path.resolve(filePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error(
      "FILE CLEANUP ERROR:",
      error.message
    );
  }
}

function cleanupUploadedFile(file) {
  if (file?.path) {
    removeFileIfExists(file.path);
  }
}

async function cleanupVerificationSong(
  verificationSong,
  verificationFile
) {
  try {
    if (verificationSong?._id) {
      await VerificationSong.deleteOne({
        _id: verificationSong._id,
      });
    }
  } catch (error) {
    console.error(
      "VERIFICATION SONG RECORD CLEANUP ERROR:",
      error.message
    );
  }

  cleanupUploadedFile(verificationFile);
}

async function cleanupApplication(application, imageFile) {
  try {
    if (application?._id) {
      await ArtistApplication.deleteOne({
        _id: application._id,
      });
    }
  } catch (error) {
    console.error(
      "APPLICATION RECORD CLEANUP ERROR:",
      error.message
    );
  }

  cleanupUploadedFile(imageFile);
}

// ============================================================
// ACCESS CONTROL HELPERS
// ============================================================

function isSuperAdmin(req) {
  const role = normalizeString(
    req.user?.role
  ).toLowerCase();

  return (
    role === "superadmin" ||
    role === "super_admin"
  );
}

// Retained for compatibility with the original controller.
function isAdmin(req) {
  const role = normalizeString(
    req.user?.role
  ).toLowerCase();

  return (
    role === "admin" ||
    role === "superadmin" ||
    role === "super_admin"
  );
}

// ============================================================
// 1. SUBMIT ARTIST APPLICATION
// POST /api/artist-applications
// ============================================================

export const submitArtistApplication = async (req, res) => {
  const userId = getUserId(req);

  let createdVerificationSong = null;
  let createdApplication = null;

  const imageFile = getFileFromRequest(req, [
    "image",
    "artistImage",
    "artist_image",
  ]);

  const verificationFile = getFileFromRequest(req, [
    "verificationSong",
    "verification_song",
    "verification_song_file",
  ]);

  try {
    if (!userId || !isValidObjectId(String(userId))) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        401,
        "Please sign in before applying to become an artist."
      );
    }

    const artistName = normalizeString(
      req.body?.artistName ||
        req.body?.artist_name
    );

    const genre = normalizeString(req.body?.genre);

    const description = normalizeString(
      req.body?.description ||
        req.body?.bio
    );

    const rawSocialUrl = normalizeString(
      req.body?.social_profile_url ||
        req.body?.socialProfileUrl ||
        req.body?.portfolioUrl ||
        req.body?.portfolio_url
    );

    const verificationSongTitle = normalizeString(
      req.body?.verificationSongTitle ||
        req.body?.verification_song_title
    );

    const rawDuration =
      req.body?.verificationSongDuration ??
      req.body?.verification_song_duration ??
      req.body?.duration ??
      0;

    const verificationSongDuration =
      rawDuration === "" || rawDuration === null
        ? 0
        : Number(rawDuration);

    if (
      !Number.isFinite(verificationSongDuration) ||
      verificationSongDuration < 0
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Verification song duration must be a valid non-negative number."
      );
    }

    if (
      artistName.length < 2 ||
      artistName.length > 100
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Artist name must contain between 2 and 100 characters."
      );
    }

    if (!genre || genre.length > 80) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Please provide a valid genre."
      );
    }

    if (
      description.length < 20 ||
      description.length > 2000
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Description must contain between 20 and 2000 characters."
      );
    }

    const socialUrlValidation =
      validateSocialUrl(rawSocialUrl);

    if (!socialUrlValidation.valid) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        socialUrlValidation.message
      );
    }

    if (!imageFile) {
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Please upload an artist profile image."
      );
    }

    if (!verificationFile) {
      cleanupUploadedFile(imageFile);

      return sendError(
        res,
        400,
        "Please upload a verification song."
      );
    }

    const imageExtension = getFileExtension(imageFile);

    if (!IMAGE_EXTENSIONS.has(imageExtension)) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "The artist image must be JPG, JPEG, PNG, or WEBP."
      );
    }

    const audioExtension =
      getFileExtension(verificationFile);

    const audioMimeType =
      getMimeType(verificationFile);

    const audioFileSize = Number(
      verificationFile.size || 0
    );

    if (!AUDIO_EXTENSIONS.has(audioExtension)) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Unsupported verification audio format."
      );
    }

    if (
      audioMimeType &&
      !AUDIO_MIME_TYPES.has(audioMimeType)
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "The uploaded verification file has an unsupported MIME type."
      );
    }

    if (
      audioFileSize <= 0 ||
      audioFileSize > MAX_VERIFICATION_SIZE
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Verification audio must be greater than zero bytes and no larger than 50 MB."
      );
    }

    if (verificationSongTitle.length > 200) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Verification song title cannot exceed 200 characters."
      );
    }

    // Validate file signatures, not only client-supplied metadata.
    try {
      await validateActualImage(imageFile);
      await validateActualAudio(verificationFile);
    } catch (validationError) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        validationError.message ||
          "Uploaded file content is invalid."
      );
    }

    const imagePath = getStoredFilePath(imageFile);

    const verificationPath =
      getStoredFilePath(verificationFile);

    if (
      !verificationPath.startsWith(
        "private_uploads/verification-songs/"
      )
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        400,
        "Verification audio must be uploaded to the private verification-songs directory."
      );
    }

    const originalFilename =
      getOriginalFilename(verificationFile);

    const user = await User.findById(userId);

    if (!user) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        404,
        "User account not found."
      );
    }

    if (
      normalizeString(user.role).toLowerCase() === "artist"
    ) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        409,
        "Your account is already registered as an artist."
      );
    }

    const existingApplication =
      await ArtistApplication.findOne({
        user_id: userId,
        status: {
          $in: ["pending", "approved"],
        },
      });

    if (existingApplication) {
      cleanupUploadedFile(imageFile);
      cleanupUploadedFile(verificationFile);

      return sendError(
        res,
        409,
        existingApplication.status === "approved"
          ? "Your artist application has already been approved."
          : "You already have a pending artist application."
      );
    }

    createdVerificationSong =
      await VerificationSong.create({
        user_id: userId,
        application_id: null,
        title:
          verificationSongTitle ||
          originalFilename,
        original_filename: originalFilename,
        duration: verificationSongDuration,
        audio_path: verificationPath,
        mime_type:
          audioMimeType ||
          "application/octet-stream",
        file_size: audioFileSize,
        status: "pending",
      });

    createdApplication =
      await ArtistApplication.create({
        user_id: userId,
        artist_name: artistName,
        genre,
        description,
        image_url: imagePath,
        social_profile_url:
          socialUrlValidation.value,
        verification_song_id:
          createdVerificationSong._id,
        status: "pending",
        admin_note: "",
      });

    createdVerificationSong.application_id =
      createdApplication._id;

    await createdVerificationSong.save();

    // Keep the User schema's nested application information synchronized.
    user.artistApplication = {
      ...(typeof user.artistApplication?.toObject === "function"
        ? user.artistApplication.toObject()
        : user.artistApplication || {}),
      status: "pending",
      artistName,
      bio: description,
      genre,
      image: imagePath,
      portfolioUrl: socialUrlValidation.value,
      rejectionReason: "",
      submittedAt: new Date(),
      reviewedAt: null,
    };

    await user.save();

    const populatedApplication =
      await ArtistApplication.findById(
        createdApplication._id
      ).populate("verification_song_id");

    return res.status(201).json({
      success: true,
      message:
        "Artist application submitted successfully. It is waiting for SuperAdmin review.",
      application:
        getApplicationResponseWithSong(
          populatedApplication
        ),
    });
  } catch (error) {
    console.error(
      "SUBMIT ARTIST APPLICATION ERROR:",
      error
    );

    try {
      if (createdApplication?._id) {
        await ArtistApplication.deleteOne({
          _id: createdApplication._id,
        });
      }
    } catch (cleanupError) {
      console.error(
        "APPLICATION ROLLBACK ERROR:",
        cleanupError.message
      );
    }

    await cleanupVerificationSong(
      createdVerificationSong,
      verificationFile
    );

    cleanupUploadedFile(imageFile);

    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "An application already exists for this user."
      );
    }

    if (
      error instanceof mongoose.Error.ValidationError
    ) {
      return sendError(
        res,
        400,
        "Application validation failed.",
        {
          errors: Object.values(error.errors).map(
            (item) => item.message
          ),
        }
      );
    }

    return sendError(
      res,
      500,
      "Unable to submit artist application."
    );
  }
};

// ============================================================
// 2. GET MY ARTIST APPLICATION
// ============================================================

export const getMyArtistApplication = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !isValidObjectId(String(userId))) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const application =
      await ArtistApplication.findOne({
        user_id: userId,
      })
        .sort({ created_at: -1 })
        .populate("verification_song_id");

    if (!application) {
      return res.status(200).json({
        success: true,
        application: null,
        message:
          "You have not submitted an artist application.",
      });
    }

    return res.status(200).json({
      success: true,
      application:
        getApplicationResponseWithSong(application),
    });
  } catch (error) {
    console.error(
      "GET MY ARTIST APPLICATION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve your artist application."
    );
  }
};

// ============================================================
// 3. GET ARTIST APPLICATIONS FOR SUPERADMIN
// GET /api/artist-applications/superadmin
// ============================================================

export const getArtistApplicationsForSuperAdmin = async (
  req,
  res
) => {
  try {
    if (!isSuperAdmin(req)) {
      return sendError(
        res,
        403,
        "SuperAdmin access is required."
      );
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query?.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query?.limit, 10) || 20
      )
    );

    const requestedStatus = normalizeString(
      req.query?.status
    ).toLowerCase();

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
    ];

    const filter = {};

    if (
      requestedStatus &&
      allowedStatuses.includes(requestedStatus)
    ) {
      filter.status = requestedStatus;
    }

    const search = normalizeString(
      req.query?.search
    );

    if (search) {
      filter.$or = [
        {
          artist_name: {
            $regex: search.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            ),
            $options: "i",
          },
        },
        {
          genre: {
            $regex: search.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            ),
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      ArtistApplication.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "user_id",
          "name email role profileImage status"
        )
        .populate("verification_song_id")
        .populate(
          "reviewed_by",
          "name email role"
        )
        .lean(),

      ArtistApplication.countDocuments(filter),
    ]);

    const formattedApplications = applications.map(
      (application) => {
        const formatted = {
          ...application,
          user:
            application.user_id &&
            typeof application.user_id === "object"
              ? {
                  _id: application.user_id._id,
                  name: application.user_id.name,
                  email: application.user_id.email,
                  role: application.user_id.role,
                  profileImage:
                    application.user_id.profileImage,
                  status: application.user_id.status,
                }
              : null,

          verification_song:
            application.verification_song_id &&
            typeof application.verification_song_id ===
              "object"
              ? {
                  _id:
                    application.verification_song_id._id,
                  title:
                    application.verification_song_id.title,
                  original_filename:
                    application.verification_song_id
                      .original_filename,
                  duration:
                    application.verification_song_id
                      .duration,
                  status:
                    application.verification_song_id.status,
                  createdAt:
                    application.verification_song_id
                      .createdAt,
                }
              : null,

          reviewer:
            application.reviewed_by &&
            typeof application.reviewed_by === "object"
              ? {
                  _id: application.reviewed_by._id,
                  name: application.reviewed_by.name,
                  email: application.reviewed_by.email,
                  role: application.reviewed_by.role,
                }
              : null,
        };

        return formatted;
      }
    );

    return res.status(200).json({
      success: true,
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "GET ARTIST APPLICATIONS FOR SUPERADMIN ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve artist applications."
    );
  }
};

// ============================================================
// 4. GET SINGLE ARTIST APPLICATION FOR SUPERADMIN
// GET /api/artist-applications/superadmin/:id
// ============================================================

export const getArtistApplicationForSuperAdmin = async (
  req,
  res
) => {
  try {
    if (!isSuperAdmin(req)) {
      return sendError(
        res,
        403,
        "SuperAdmin access is required."
      );
    }

    const applicationId = req.params?.id;

    if (!isValidObjectId(applicationId)) {
      return sendError(
        res,
        400,
        "Invalid artist application ID."
      );
    }

    const application =
      await ArtistApplication.findById(applicationId)
        .populate(
          "user_id",
          "name email role profileImage status createdAt"
        )
        .populate("verification_song_id")
        .populate(
          "reviewed_by",
          "name email role"
        );

    if (!application) {
      return sendError(
        res,
        404,
        "Artist application not found."
      );
    }

    const applicant = application.user_id;
    const verificationSong =
      application.verification_song_id;
    const reviewer = application.reviewed_by;

    return res.status(200).json({
      success: true,

      application: {
        ...getApplicationResponse(application),

        user:
          applicant && typeof applicant === "object"
            ? {
                _id: applicant._id,
                name: applicant.name,
                email: applicant.email,
                role: applicant.role,
                profileImage: applicant.profileImage,
                status: applicant.status,
                createdAt: applicant.createdAt,
              }
            : null,

        verification_song:
          verificationSong &&
          typeof verificationSong === "object"
            ? {
                _id: verificationSong._id,
                title: verificationSong.title,
                original_filename:
                  verificationSong.original_filename,
                duration: verificationSong.duration,
                status: verificationSong.status,
                file_size: verificationSong.file_size,
                mime_type: verificationSong.mime_type,
                createdAt: verificationSong.createdAt,
              }
            : null,

        reviewer:
          reviewer && typeof reviewer === "object"
            ? {
                _id: reviewer._id,
                name: reviewer.name,
                email: reviewer.email,
                role: reviewer.role,
              }
            : null,
      },
    });
  } catch (error) {
    console.error(
      "GET SINGLE ARTIST APPLICATION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve the artist application."
    );
  }
};

// ============================================================
// 5. REVIEW ARTIST APPLICATION
// PATCH /api/artist-applications/superadmin/:id/review
// ============================================================

export const reviewArtistApplication = async (
  req,
  res
) => {
  try {
    if (!isSuperAdmin(req)) {
      return sendError(
        res,
        403,
        "SuperAdmin access is required."
      );
    }

    const applicationId = req.params?.id;

    if (!isValidObjectId(applicationId)) {
      return sendError(
        res,
        400,
        "Invalid artist application ID."
      );
    }

    const requestedStatus = normalizeString(
      req.body?.status
    ).toLowerCase();

    if (
      !["approved", "rejected"].includes(
        requestedStatus
      )
    ) {
      return sendError(
        res,
        400,
        "Review status must be either approved or rejected."
      );
    }

    const adminNote = normalizeString(
      req.body?.admin_note ||
        req.body?.adminNote ||
        req.body?.rejectionReason ||
        req.body?.rejection_reason
    );

    if (
      requestedStatus === "rejected" &&
      adminNote.length < 5
    ) {
      return sendError(
        res,
        400,
        "Please provide a rejection reason of at least 5 characters."
      );
    }

    if (adminNote.length > 2000) {
      return sendError(
        res,
        400,
        "The review note cannot exceed 2000 characters."
      );
    }

    const reviewerId = getUserId(req);

    if (
      !reviewerId ||
      !isValidObjectId(String(reviewerId))
    ) {
      return sendError(
        res,
        401,
        "Authenticated SuperAdmin ID is missing."
      );
    }

    const application =
      await ArtistApplication.findById(applicationId);

    if (!application) {
      return sendError(
        res,
        404,
        "Artist application not found."
      );
    }

    if (application.status !== "pending") {
      return sendError(
        res,
        409,
        `This application has already been ${application.status}.`
      );
    }

    const user = await User.findById(
      application.user_id
    );

    if (!user) {
      return sendError(
        res,
        404,
        "The applicant's user account could not be found."
      );
    }

    const now = new Date();

    // --------------------------------------------------------
    // REJECT APPLICATION
    // --------------------------------------------------------

    if (requestedStatus === "rejected") {
      application.status = "rejected";
      application.admin_note = adminNote;
      application.reviewed_by = reviewerId;
      application.reviewed_at = now;

      await application.save();

      const currentArtistApplication =
        typeof user.artistApplication?.toObject ===
        "function"
          ? user.artistApplication.toObject()
          : user.artistApplication || {};

      user.artistApplication = {
        ...currentArtistApplication,
        status: "rejected",
        artistName: application.artist_name,
        bio: application.description,
        genre: application.genre,
        image: application.image_url,
        portfolioUrl:
          application.social_profile_url,
        rejectionReason: adminNote,
        reviewedAt: now,
      };

      // Do not change the user's role when rejecting.
      await user.save();

      const updatedApplication =
        await ArtistApplication.findById(
          application._id
        )
          .populate(
            "user_id",
            "name email role profileImage status"
          )
          .populate("verification_song_id")
          .populate(
            "reviewed_by",
            "name email role"
          );

      return res.status(200).json({
        success: true,
        message: "Artist application rejected.",
        application:
          getApplicationResponseWithSong(
            updatedApplication
          ),
      });
    }

    // --------------------------------------------------------
    // APPROVE APPLICATION
    // --------------------------------------------------------

    const verificationSong =
      await VerificationSong.findOne({
        _id: application.verification_song_id,
        user_id: application.user_id,
        application_id: application._id,
      });

    if (!verificationSong) {
      return sendError(
        res,
        400,
        "The application's verification song could not be verified."
      );
    }

    if (verificationSong.status === "rejected") {
      return sendError(
        res,
        400,
        "This verification song has already been rejected."
      );
    }

    const existingArtist =
      await Artist.findOne({
        $or: [
          { user_id: user._id },
          { userId: user._id },
        ],
      });

    let artist = existingArtist;

    if (!artist) {
      artist = new Artist({
        user_id: user._id,
        name: application.artist_name,
        artistName: application.artist_name,
        bio: application.description,
        genre: application.genre,
        image: application.image_url,
        imageUrl: application.image_url,
        portfolioUrl:
          application.social_profile_url,
        verified: true,
        followers: 0,
      });
    } else {
      artist.name = application.artist_name;
      artist.artistName = application.artist_name;
      artist.bio = application.description;
      artist.genre = application.genre;
      artist.image = application.image_url;
      artist.imageUrl = application.image_url;
      artist.portfolioUrl =
        application.social_profile_url;
      artist.verified = true;
    }

    // Set only fields that are present in the Artist schema.
    await artist.save();

    application.status = "approved";
    application.admin_note = adminNote;
    application.reviewed_by = reviewerId;
    application.reviewed_at = now;

    await application.save();

    verificationSong.status = "approved";
    await verificationSong.save();

    const currentArtistApplication =
      typeof user.artistApplication?.toObject ===
      "function"
        ? user.artistApplication.toObject()
        : user.artistApplication || {};

    user.artistApplication = {
      ...currentArtistApplication,
      status: "approved",
      artistName: application.artist_name,
      bio: application.description,
      genre: application.genre,
      image: application.image_url,
      portfolioUrl:
        application.social_profile_url,
      rejectionReason: "",
      reviewedAt: now,
    };

    user.role = "artist";

    await user.save();

    const updatedApplication =
      await ArtistApplication.findById(
        application._id
      )
        .populate(
          "user_id",
          "name email role profileImage status"
        )
        .populate("verification_song_id")
        .populate(
          "reviewed_by",
          "name email role"
        );

    return res.status(200).json({
      success: true,
      message: "Artist application approved successfully.",
      artist: {
        _id: artist._id,
        name: artist.name,
        verified: artist.verified,
      },
      application:
        getApplicationResponseWithSong(
          updatedApplication
        ),
    });
  } catch (error) {
    console.error(
      "REVIEW ARTIST APPLICATION ERROR:",
      error
    );

    if (
      error instanceof mongoose.Error.ValidationError
    ) {
      return sendError(
        res,
        400,
        "Artist application review validation failed.",
        {
          errors: Object.values(error.errors).map(
            (item) => item.message
          ),
        }
      );
    }

    return sendError(
      res,
      500,
      "Unable to review artist application."
    );
  }
};

// ============================================================
// 6. STREAM VERIFICATION SONG
// GET /api/artist-applications/:id/verification-song
//
// Route must use authentication middleware.
// Only the applicant or a SuperAdmin can access the file.
// ============================================================

export const streamVerificationSong = async (req, res) => {
  let stream = null;

  try {
    const userId = getUserId(req);

    if (!userId || !isValidObjectId(String(userId))) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const applicationId = req.params?.id;

    if (!isValidObjectId(applicationId)) {
      return sendError(
        res,
        400,
        "Invalid application ID."
      );
    }

    const application =
      await ArtistApplication.findById(applicationId);

    if (!application) {
      return sendError(
        res,
        404,
        "Artist application not found."
      );
    }

    const ownsApplication =
      String(application.user_id) === String(userId);

    if (!ownsApplication && !isSuperAdmin(req)) {
      return sendError(
        res,
        403,
        "You are not allowed to access this verification song."
      );
    }

    const verificationSong =
      await VerificationSong.findById(
        application.verification_song_id
      );

    if (!verificationSong) {
      return sendError(
        res,
        404,
        "Verification song not found."
      );
    }

    const absolutePath = resolveBackendFile(
      verificationSong.audio_path
    );

    if (!fs.existsSync(absolutePath)) {
      return sendError(
        res,
        404,
        "Verification audio file not found on the server."
      );
    }

    const stat = fs.statSync(absolutePath);

    if (!stat.isFile()) {
      return sendError(
        res,
        404,
        "Verification audio file is unavailable."
      );
    }

    const fileSize = stat.size;
    const mimeType =
      verificationSong.mime_type ||
      "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const rangeHeader = req.headers.range;

    // Send the complete file when no byte range is requested.
    if (!rangeHeader) {
      res.status(200);
      res.setHeader("Content-Length", fileSize);

      stream = fs.createReadStream(absolutePath);

      stream.on("error", (error) => {
        console.error(
          "VERIFICATION AUDIO STREAM ERROR:",
          error
        );

        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.destroy(error);
        }
      });

      return stream.pipe(res);
    }

    // Support a single byte range.
    const match = rangeHeader.match(
      /^bytes=(\d*)-(\d*)$/
    );

    if (!match || fileSize === 0) {
      res.setHeader(
        "Content-Range",
        `bytes */${fileSize}`
      );

      return res.status(416).end();
    }

    let start;
    let end;

    // Suffix range, e.g. bytes=-500
    if (match[1] === "" && match[2] !== "") {
      const suffixLength = Number(match[2]);

      if (
        !Number.isSafeInteger(suffixLength) ||
        suffixLength <= 0
      ) {
        res.setHeader(
          "Content-Range",
          `bytes */${fileSize}`
        );

        return res.status(416).end();
      }

      start = Math.max(
        fileSize - suffixLength,
        0
      );

      end = fileSize - 1;
    } else {
      start = Number(match[1]);

      end =
        match[2] === ""
          ? fileSize - 1
          : Number(match[2]);
    }

    if (
      match[1] === "" ||
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start >= fileSize ||
      end < start
    ) {
      res.setHeader(
        "Content-Range",
        `bytes */${fileSize}`
      );

      return res.status(416).end();
    }

    end = Math.min(end, fileSize - 1);

    res.status(206);

    res.setHeader(
      "Content-Range",
      `bytes ${start}-${end}/${fileSize}`
    );

    res.setHeader(
      "Content-Length",
      end - start + 1
    );

    stream = fs.createReadStream(
      absolutePath,
      { start, end }
    );

    stream.on("error", (error) => {
      console.error(
        "VERIFICATION AUDIO RANGE STREAM ERROR:",
        error
      );

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(error);
      }
    });

    return stream.pipe(res);
  } catch (error) {
    console.error(
      "STREAM VERIFICATION SONG ERROR:",
      error
    );

    if (!res.headersSent) {
      return sendError(
        res,
        500,
        "Unable to stream verification audio."
      );
    }

    return res.end();
  }
};