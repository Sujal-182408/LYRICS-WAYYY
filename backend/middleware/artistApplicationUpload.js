
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  AUDIO_EXTENSIONS,
  AUDIO_MIME_TYPES,
} from "../utils/fileSecurity.js";

// =====================================================
// PATHS
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_ROOT = path.resolve(__dirname, "..");

const uploadRoot = path.join(
  BACKEND_ROOT,
  "uploads",
  "artist-applications",
  "images"
);

const verificationRoot = path.join(
  BACKEND_ROOT,
  "private_uploads",
  "verification-songs"
);

// =====================================================
// CREATE DIRECTORIES
// =====================================================

fs.mkdirSync(uploadRoot, {
  recursive: true,
});

fs.mkdirSync(verificationRoot, {
  recursive: true,
});

// =====================================================
// STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "image") {
      return cb(null, uploadRoot);
    }

    if (file.fieldname === "verificationSong") {
      return cb(null, verificationRoot);
    }

    return cb(new Error("Invalid upload field."));
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const randomName = crypto
      .randomBytes(24)
      .toString("hex");

    cb(
      null,
      `${Date.now()}-${randomName}${extension}`
    );
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname || "")
    .toLowerCase();

  const mimeType = String(file.mimetype || "")
    .trim()
    .toLowerCase();

  // Artist image.
  if (file.fieldname === "image") {
    if (!IMAGE_EXTENSIONS.has(extension)) {
      return cb(
        new Error(
          "Artist image must be JPG, JPEG, PNG, or WEBP."
        )
      );
    }

    if (!IMAGE_MIME_TYPES.has(mimeType)) {
      return cb(
        new Error("Invalid artist image file type.")
      );
    }

    return cb(null, true);
  }

  // Private verification audio.
  if (file.fieldname === "verificationSong") {
    if (!AUDIO_EXTENSIONS.has(extension)) {
      return cb(
        new Error(
          "Verification song must be MP3, WAV, M4A, OGG, AAC, FLAC, or WEBM."
        )
      );
    }

    if (!AUDIO_MIME_TYPES.has(mimeType)) {
      return cb(
        new Error(
          "Invalid verification song file type."
        )
      );
    }

    return cb(null, true);
  }

  return cb(new Error("Invalid upload field."));
};

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const uploadArtistApplication = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 2,
    fieldSize: 256 * 1024,
    fields: 10,
    parts: 12,
  },
});

export default uploadArtistApplication;
