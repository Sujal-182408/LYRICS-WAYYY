import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

import {
  PROFILE_IMAGE_MAX_SIZE,
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES,
  validateActualImage,
  deleteUploadedFile,
  isSafeOriginalFilename,
} from "../utils/fileSecurity.js";

/*
|--------------------------------------------------------------------------
| ES MODULE DIRECTORY SUPPORT
|--------------------------------------------------------------------------
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
|--------------------------------------------------------------------------
| UPLOAD DIRECTORY
|--------------------------------------------------------------------------
*/

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "profiles"
);

fs.mkdirSync(uploadDir, {
  recursive: true,
});

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    try {
      const extension = path
        .extname(file.originalname)
        .toLowerCase();

      const randomName = crypto
        .randomBytes(32)
        .toString("hex");

      return cb(
        null,
        `profile-${randomName}${extension}`
      );
    } catch (error) {
      return cb(error);
    }
  },
});

/*
|--------------------------------------------------------------------------
| FILE FILTER
|--------------------------------------------------------------------------
*/

const fileFilter = (req, file, cb) => {
  /*
  |--------------------------------------------------------------------------
  | ORIGINAL FILENAME SECURITY
  |--------------------------------------------------------------------------
  */

  if (
    typeof isSafeOriginalFilename === "function" &&
    !isSafeOriginalFilename(file.originalname)
  ) {
    return cb(
      new Error("Invalid file name.")
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EXTENSION VALIDATION
  |--------------------------------------------------------------------------
  */

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG, and WEBP images are allowed."
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MIME TYPE VALIDATION
  |--------------------------------------------------------------------------
  */

  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error("Invalid image file type.")
    );
  }

  return cb(null, true);
};

/*
|--------------------------------------------------------------------------
| MULTER CONFIGURATION
|--------------------------------------------------------------------------
*/

const uploadProfile = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      PROFILE_IMAGE_MAX_SIZE ||
      5 * 1024 * 1024,

    files: 1,
    fields: 10,
    parts: 12,
    fieldSize: 64 * 1024,
  },
});

/*
|--------------------------------------------------------------------------
| POST-UPLOAD CONTENT VALIDATION
|--------------------------------------------------------------------------
|
| Multer checks:
| - Extension
| - MIME type
| - File size
|
| This middleware additionally validates the actual file content.
|
|--------------------------------------------------------------------------
*/

const validateProfileImage = async (
  req,
  res,
  next
) => {
  if (!req.file) {
    return next();
  }

  try {
    await validateActualImage(req.file);

    return next();
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | DELETE REJECTED FILE
    |--------------------------------------------------------------------------
    */

    await deleteUploadedFile(req.file);

    return res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Invalid profile image.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| EXPOSE VALIDATION MIDDLEWARE
|--------------------------------------------------------------------------
*/

uploadProfile.validateProfileImage =
  validateProfileImage;

/*
|--------------------------------------------------------------------------
| ES MODULE EXPORT
|--------------------------------------------------------------------------
*/

export default uploadProfile;