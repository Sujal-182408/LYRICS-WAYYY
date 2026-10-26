import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// ES MODULE DIRECTORY SUPPORT
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// ROOT DIRECTORIES
// ============================================================

const UPLOAD_ROOT = path.resolve(
  __dirname,
  "..",
  "uploads"
);

const COVER_DIR = path.join(
  UPLOAD_ROOT,
  "covers"
);

const SONG_DIR = path.join(
  UPLOAD_ROOT,
  "songs"
);

const ARTIST_DIR = path.join(
  UPLOAD_ROOT,
  "artists"
);

const ALBUM_DIR = path.join(
  UPLOAD_ROOT,
  "albums"
);

// ============================================================
// ALLOWED IMAGE TYPES
// ============================================================

const IMAGE_MIME_TYPES = Object.freeze({
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
});

// ============================================================
// ALLOWED AUDIO TYPES
// ============================================================

const AUDIO_MIME_TYPES = Object.freeze({
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
});

// ============================================================
// SIZE LIMITS
// ============================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

// ============================================================
// CREATE DIRECTORIES
// ============================================================

[
  UPLOAD_ROOT,
  COVER_DIR,
  SONG_DIR,
  ARTIST_DIR,
  ALBUM_DIR,
].forEach((directory) => {
  fs.mkdirSync(directory, {
    recursive: true,
  });
});

// ============================================================
// HELPERS
// ============================================================

const getExtension = (filename = "") => {
  return path.extname(filename).toLowerCase();
};

// ============================================================
// SAFE ORIGINAL FILENAME
// ============================================================

const isSafeOriginalFilename = (filename = "") => {
  if (
    typeof filename !== "string" ||
    !filename.trim()
  ) {
    return false;
  }

  if (filename.includes("\0")) {
    return false;
  }

  if (
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return false;
  }

  const normalized = filename
    .toLowerCase()
    .replace(/\\/g, "/");

  if (
    normalized.includes("..") ||
    normalized.includes("%2e") ||
    normalized.includes("%2f") ||
    normalized.includes("%5c")
  ) {
    return false;
  }

  return true;
};

// ============================================================
// SECURE RANDOM FILENAME
// ============================================================

const createSecureFilename = (originalFilename) => {
  const extension = getExtension(originalFilename);

  const randomName = crypto
    .randomBytes(32)
    .toString("hex");

  return `${randomName}${extension}`;
};

// ============================================================
// IMAGE METADATA VALIDATION
// ============================================================

const validateImageMetadata = (file) => {
  if (!file) {
    throw new Error("Cover image is required.");
  }

  if (!isSafeOriginalFilename(file.originalname)) {
    throw new Error("Invalid image filename.");
  }

  const extension = getExtension(file.originalname);

  const expectedMime = IMAGE_MIME_TYPES[extension];

  if (!expectedMime) {
    throw new Error("Unsupported image file type.");
  }

  if (file.mimetype !== expectedMime) {
    throw new Error(
      "Image MIME type does not match file extension."
    );
  }

  return true;
};

// ============================================================
// AUDIO METADATA VALIDATION
// ============================================================

const validateAudioMetadata = (file) => {
  if (!file) {
    throw new Error("Audio file is required.");
  }

  if (!isSafeOriginalFilename(file.originalname)) {
    throw new Error("Invalid audio filename.");
  }

  const extension = getExtension(file.originalname);

  const expectedMime = AUDIO_MIME_TYPES[extension];

  if (!expectedMime) {
    throw new Error("Unsupported audio file type.");
  }

  if (file.mimetype !== expectedMime) {
    throw new Error(
      "Audio MIME type does not match file extension."
    );
  }

  return true;
};

// ============================================================
// READ FILE HEADER
// ============================================================

const readFileHeader = async (
  filePath,
  length = 64
) => {
  const handle = await fs.promises.open(
    filePath,
    "r"
  );

  try {
    const buffer = Buffer.alloc(length);

    const { bytesRead } = await handle.read(
      buffer,
      0,
      length,
      0
    );

    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

// ============================================================
// IMAGE MAGIC-BYTE DETECTION
// ============================================================

const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  // ----------------------------------------------------------
  // JPEG
  // ----------------------------------------------------------

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      extension: ".jpg",
      mime: "image/jpeg",
    };
  }

  // ----------------------------------------------------------
  // PNG
  // ----------------------------------------------------------

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      extension: ".png",
      mime: "image/png",
    };
  }

  // ----------------------------------------------------------
  // WEBP
  // ----------------------------------------------------------

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return {
      extension: ".webp",
      mime: "image/webp",
    };
  }

  return null;
};

// ============================================================
// AUDIO MAGIC-BYTE DETECTION
// ============================================================

const detectAudioType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  // ----------------------------------------------------------
  // MP3 - ID3
  // ----------------------------------------------------------

  if (
    buffer.length >= 3 &&
    buffer.toString("ascii", 0, 3) === "ID3"
  ) {
    return {
      extension: ".mp3",
      mime: "audio/mpeg",
    };
  }

  // ----------------------------------------------------------
  // MP3 - MPEG FRAME SYNC
  // ----------------------------------------------------------

  if (
    buffer.length >= 2 &&
    buffer[0] === 0xff &&
    (buffer[1] & 0xe0) === 0xe0
  ) {
    return {
      extension: ".mp3",
      mime: "audio/mpeg",
    };
  }

  // ----------------------------------------------------------
  // WAV
  // ----------------------------------------------------------

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  ) {
    return {
      extension: ".wav",
      mime: "audio/wav",
    };
  }

  // ----------------------------------------------------------
  // OGG
  // ----------------------------------------------------------

  if (
    buffer.length >= 4 &&
    buffer.toString("ascii", 0, 4) === "OggS"
  ) {
    return {
      extension: ".ogg",
      mime: "audio/ogg",
    };
  }

  // ----------------------------------------------------------
  // FLAC
  // ----------------------------------------------------------

  if (
    buffer.length >= 4 &&
    buffer.toString("ascii", 0, 4) === "fLaC"
  ) {
    return {
      extension: ".flac",
      mime: "audio/flac",
    };
  }

  // ----------------------------------------------------------
  // AAC / ADTS
  // ----------------------------------------------------------

  if (
    buffer.length >= 2 &&
    buffer[0] === 0xff &&
    (
      buffer[1] === 0xf1 ||
      buffer[1] === 0xf9 ||
      (buffer[1] & 0xf6) === 0xf0
    )
  ) {
    return {
      extension: ".aac",
      mime: "audio/aac",
    };
  }

  // ----------------------------------------------------------
  // M4A / ISO BASE MEDIA
  // ----------------------------------------------------------

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp"
  ) {
    const majorBrand = buffer.toString(
      "ascii",
      8,
      12
    );

    const compatibleBrands = [];

    for (
      let offset = 16;
      offset + 4 <= buffer.length;
      offset += 4
    ) {
      compatibleBrands.push(
        buffer.toString(
          "ascii",
          offset,
          offset + 4
        )
      );
    }

    const m4aBrands = new Set([
      "M4A ",
      "M4B ",
      "M4P ",
      "mp41",
      "mp42",
      "isom",
      "iso2",
      "iso5",
      "iso6",
      "dash",
    ]);

    if (
      m4aBrands.has(majorBrand) ||
      compatibleBrands.some((brand) =>
        m4aBrands.has(brand)
      )
    ) {
      return {
        extension: ".m4a",
        mime: "audio/mp4",
      };
    }
  }

  return null;
};

// ============================================================
// EXTENSION MATCHING
// ============================================================

const extensionsMatch = (
  detectedExtension,
  originalExtension
) => {
  if (detectedExtension === originalExtension) {
    return true;
  }

  // JPEG has two valid extensions.
  if (
    detectedExtension === ".jpg" &&
    originalExtension === ".jpeg"
  ) {
    return true;
  }

  return false;
};

// ============================================================
// ACTUAL IMAGE VALIDATION
// ============================================================

const validateActualImage = async (file) => {
  validateImageMetadata(file);

  const detected = detectImageType(
    await readFileHeader(file.path, 64)
  );

  if (!detected) {
    throw new Error(
      "The uploaded image content is invalid."
    );
  }

  const extension = getExtension(file.originalname);

  if (
    !extensionsMatch(
      detected.extension,
      extension
    )
  ) {
    throw new Error(
      "The image extension does not match the actual file content."
    );
  }

  if (detected.mime !== file.mimetype) {
    throw new Error(
      "The image content does not match the declared MIME type."
    );
  }

  return detected;
};

// ============================================================
// ACTUAL AUDIO VALIDATION
// ============================================================

const validateActualAudio = async (file) => {
  validateAudioMetadata(file);

  const detected = detectAudioType(
    await readFileHeader(file.path, 64)
  );

  if (!detected) {
    throw new Error(
      "The uploaded audio content is invalid."
    );
  }

  const extension = getExtension(file.originalname);

  if (detected.extension !== extension) {
    throw new Error(
      "The audio extension does not match the actual file content."
    );
  }

  if (detected.mime !== file.mimetype) {
    throw new Error(
      "The audio content does not match the declared MIME type."
    );
  }

  return detected;
};

// ============================================================
// DELETE FILE
// ============================================================

const deleteUploadedFile = async (file) => {
  if (!file?.path) {
    return;
  }

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "UPLOAD CLEANUP ERROR:",
        error.message
      );
    }
  }
};

// ============================================================
// DELETE ALL UPLOADED FILES
// ============================================================

const deleteUploadedFiles = async (files) => {
  if (!files) {
    return;
  }

  const fileList = [];

  if (Array.isArray(files)) {
    fileList.push(...files);
  } else {
    Object.values(files).forEach((items) => {
      if (Array.isArray(items)) {
        fileList.push(...items);
      }
    });
  }

  await Promise.all(
    fileList.map(deleteUploadedFile)
  );
};

// ============================================================
// STORAGE
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (file.fieldname === "coverImage") {
        return cb(null, COVER_DIR);
      }

      if (file.fieldname === "audioFile") {
        return cb(null, SONG_DIR);
      }

      // Artist profile images.
      if (file.fieldname === "image") {
        return cb(null, ARTIST_DIR);
      }

      return cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          file.fieldname
        )
      );
    } catch (error) {
      return cb(error);
    }
  },

  filename: (req, file, cb) => {
    try {
      if (
        !isSafeOriginalFilename(
          file.originalname
        )
      ) {
        return cb(
          new Error("Invalid filename.")
        );
      }

      return cb(
        null,
        createSecureFilename(
          file.originalname
        )
      );
    } catch (error) {
      return cb(error);
    }
  },
});

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  try {
    // Song cover images and artist profile images.
    if (
      file.fieldname === "coverImage" ||
      file.fieldname === "image"
    ) {
      validateImageMetadata(file);
      return cb(null, true);
    }

    // Song audio files.
    if (file.fieldname === "audioFile") {
      validateAudioMetadata(file);
      return cb(null, true);
    }

    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        file.fieldname
      )
    );
  } catch (error) {
    return cb(error, false);
  }
};

// ============================================================
// MULTER
//
// IMPORTANT:
//
// This remains directly usable as:
//
// upload.fields(...)
//
// ============================================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    // Audio maximum.
    //
    // Multer uses a single global per-file limit.
    // Post-validation enforces the smaller image limit.
    fileSize: MAX_AUDIO_SIZE,
    files: 2,
    fields: 20,
    parts: 24,
    fieldSize: 256 * 1024,
  },
});

// ============================================================
// VALIDATE UPLOADED SONG FILES
//
// This runs AFTER Multer has written files to disk.
//
// Performs:
// 1. Actual image signature validation
// 2. Actual audio signature validation
// 3. Individual image size validation
// 4. Individual audio size validation
// 5. Cleanup if anything fails
//
// ============================================================

const validateUploadedFiles = async (
  req,
  res,
  next
) => {
  try {
    const files = req.files || {};

    const coverFiles = Array.isArray(
      files.coverImage
    )
      ? files.coverImage
      : [];

    const audioFiles = Array.isArray(
      files.audioFile
    )
      ? files.audioFile
      : [];

    // ------------------------------------------------------
    // COVER
    // ------------------------------------------------------

    if (coverFiles.length > 1) {
      await deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Only one cover image is allowed.",
      });
    }

    if (coverFiles.length === 1) {
      const cover = coverFiles[0];

      if (cover.size > MAX_IMAGE_SIZE) {
        await deleteUploadedFiles(req.files);

        return res.status(400).json({
          success: false,
          message: "Cover image must not exceed 5 MB.",
        });
      }

      await validateActualImage(cover);
    }

    // ------------------------------------------------------
    // AUDIO
    // ------------------------------------------------------

    if (audioFiles.length > 1) {
      await deleteUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Only one audio file is allowed.",
      });
    }

    if (audioFiles.length === 1) {
      const audio = audioFiles[0];

      if (audio.size > MAX_AUDIO_SIZE) {
        await deleteUploadedFiles(req.files);

        return res.status(400).json({
          success: false,
          message: "Audio file must not exceed 50 MB.",
        });
      }

      await validateActualAudio(audio);
    }

    return next();
  } catch (error) {
    await deleteUploadedFiles(req.files);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Uploaded file validation failed.",
    });
  }
};

// ============================================================
// VALIDATE ARTIST PROFILE IMAGE
// ============================================================

upload.validateArtistImage = async (
  req,
  res,
  next
) => {
  try {
    if (!req.file) {
      return next();
    }

    if (req.file.size > MAX_IMAGE_SIZE) {
      await deleteUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message: "Profile image must not exceed 5 MB.",
      });
    }

    await validateActualImage(req.file);

    return next();
  } catch (error) {
    await deleteUploadedFile(req.file);

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Invalid profile image.",
    });
  }
};

// ============================================================
// EXPOSE SECURITY HELPERS
// ============================================================

upload.IMAGE_MIME_TYPES = IMAGE_MIME_TYPES;
upload.AUDIO_MIME_TYPES = AUDIO_MIME_TYPES;

upload.UPLOAD_ROOT = UPLOAD_ROOT;
upload.COVER_DIR = COVER_DIR;
upload.SONG_DIR = SONG_DIR;
upload.ARTIST_DIR = ARTIST_DIR;
upload.ALBUM_DIR = ALBUM_DIR;

upload.MAX_IMAGE_SIZE = MAX_IMAGE_SIZE;
upload.MAX_AUDIO_SIZE = MAX_AUDIO_SIZE;

upload.validateUploadedFiles = validateUploadedFiles;
upload.validateActualImage = validateActualImage;
upload.validateActualAudio = validateActualAudio;

upload.deleteUploadedFile = deleteUploadedFile;
upload.deleteUploadedFiles = deleteUploadedFiles;

// ============================================================
// ES MODULE EXPORT
// ============================================================

export default upload;