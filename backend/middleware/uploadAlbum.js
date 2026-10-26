import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ================= DIRECTORY SUPPORT =================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= CREATE FOLDER =================

const uploadPath = path.resolve(
  __dirname,
  "..",
  "uploads",
  "albums"
);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

// ================= STORAGE =================

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

// ================= FILE FILTER =================

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp/;

  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase().replace(".", "")
  );

  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }

  return cb(
    new Error("Only image files are allowed.")
  );
};

// ================= MULTER =================

const uploadAlbum = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ================= ES MODULE EXPORT =================

export default uploadAlbum;