import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ============================================================
// ES MODULE DIRECTORY SUPPORT
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadPath = path.resolve(
  __dirname,
  "..",
  "uploads",
  "artists"
);

// ============================================================
// CREATE DIRECTORY IF IT DOES NOT EXIST
// ============================================================

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// ============================================================
// MULTER STORAGE
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}${path.extname(file.originalname).toLowerCase()}`;

    cb(null, uniqueName);
  },
});

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  return cb(
    new Error("Only image files are allowed!"),
    false
  );
};

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const uploadArtist = multer({
  storage,
  fileFilter,
});

// ============================================================
// ES MODULE EXPORT
// ============================================================

export default uploadArtist;