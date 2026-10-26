// =====================================================
// LYRICS WAYYY - SECURE UPLOAD MIDDLEWARE
// ES MODULES
// =====================================================

import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  validateImageMagicBytes,
  validateAudioMagicBytes,
} from "../utils/fileSecurity.js";

// =====================================================
// DIRECTORY CONFIGURATION
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const UPLOAD_DIRS = {
  covers: path.join(UPLOADS_DIR, "covers"),
  songs: path.join(UPLOADS_DIR, "songs"),
  artists: path.join(UPLOADS_DIR, "artists"),
  albums: path.join(UPLOADS_DIR, "albums"),
  profiles: path.join(UPLOADS_DIR, "profiles"),
};

// Ensure upload directories exist.
for (const directory of Object.values(UPLOAD_DIRS)) {
  fs.mkdirSync(directory, { recursive: true });
}

// =====================================================
// ALLOWED FILE TYPES
// =====================================================

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
]);

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".flac",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

// =====================================================
// STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination(req, file, callback) {
    let destination;

    if (file.fieldname === "audioFile") {
      destination = UPLOAD_DIRS.songs;
    } else if (file.fieldname === "coverImage") {
      destination = UPLOAD_DIRS.covers;
    } else if (
      file.fieldname === "image" ||
      file.fieldname === "artistImage"
    ) {
      destination = UPLOAD_DIRS.artists;
    } else if (
      file.fieldname === "albumCover" ||
      file.fieldname === "albumImage"
    ) {
      destination = UPLOAD_DIRS.albums;
    } else if (
      file.fieldname === "profileImage"
    ) {
      destination = UPLOAD_DIRS.profiles;
    } else {
      return callback(
        new Error(`Unsupported upload field: ${file.fieldname}`)
      );
    }

    callback(null, destination);
  },

  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    // Never use the original filename as the stored filename.
    const safeFilename =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    callback(null, safeFilename);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "audioFile") {
    const validMime = AUDIO_MIME_TYPES.has(file.mimetype);
    const validExtension = AUDIO_EXTENSIONS.has(extension);

    if (!validMime || !validExtension) {
      return callback(
        new Error("Unsupported audio file type.")
      );
    }

    return callback(null, true);
  }

  const imageFields = new Set([
    "coverImage",
    "image",
    "artistImage",
    "albumCover",
    "albumImage",
    "profileImage",
  ]);

  if (imageFields.has(file.fieldname)) {
    const validMime = IMAGE_MIME_TYPES.has(file.mimetype);
    const validExtension = IMAGE_EXTENSIONS.has(extension);

    if (!validMime || !validExtension) {
      return callback(
        new Error("Unsupported image file type.")
      );
    }

    return callback(null, true);
  }

  return callback(
    new Error(`Unsupported upload field: ${file.fieldname}`)
  );
};

// =====================================================
// MULTER INSTANCE
// =====================================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 2,
    fields: 20,
    parts: 22,
  },
});

// =====================================================
// MAGIC-BYTE VALIDATION
// =====================================================

const validateFile = async (file, type) => {
  if (!file) {
    return true;
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (type === "image") {
    if (
      file.size > MAX_IMAGE_SIZE ||
      !IMAGE_EXTENSIONS.has(extension) ||
      !IMAGE_MIME_TYPES.has(file.mimetype)
    ) {
      return false;
    }

    return await validateImageMagicBytes(file.path);
  }

  if (type === "audio") {
    if (
      file.size > MAX_AUDIO_SIZE ||
      !AUDIO_EXTENSIONS.has(extension) ||
      !AUDIO_MIME_TYPES.has(file.mimetype)
    ) {
      return false;
    }

    return await validateAudioMagicBytes(file.path);
  }

  return false;
};

// =====================================================
// VALIDATE ARTIST IMAGE
// =====================================================

upload.validateArtistImage = async (req, res, next) => {
  try {
    const image = req.file;

    if (!image) {
      return next();
    }

    const valid = await validateFile(image, "image");

    if (!valid) {
      fs.promises.unlink(image.path).catch(() => {});

      return res.status(400).json({
        success: false,
        message: "Invalid image file.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// VALIDATE UPLOADED SONG FILES
// =====================================================

upload.validateUploadedFiles = async (req, res, next) => {
  try {
    const files = req.files || {};

    const audioFile = files.audioFile?.[0];
    const coverImage = files.coverImage?.[0];

    if (audioFile) {
      const validAudio = await validateFile(audioFile, "audio");

      if (!validAudio) {
        fs.promises.unlink(audioFile.path).catch(() => {});

        if (coverImage) {
          fs.promises.unlink(coverImage.path).catch(() => {});
        }

        return res.status(400).json({
          success: false,
          message: "Invalid audio file.",
        });
      }
    }

    if (coverImage) {
      const validImage = await validateFile(coverImage, "image");

      if (!validImage) {
        fs.promises.unlink(coverImage.path).catch(() => {});

        if (audioFile) {
          fs.promises.unlink(audioFile.path).catch(() => {});
        }

        return res.status(400).json({
          success: false,
          message: "Invalid cover image.",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// EXPORT
// =====================================================

export default upload;