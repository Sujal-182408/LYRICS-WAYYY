
import fs from "node:fs";
import path from "node:path";

// =====================================================
// CONSTANTS
// =====================================================

export const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const ARTIST_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const VERIFICATION_SONG_MAX_SIZE = 50 * 1024 * 1024;

export const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".mpeg",
]);

export const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/x-m4a",
]);

// =====================================================
// SAFE EXTENSION
// =====================================================

export const getSafeExtension = (filename = "") => {
  if (typeof filename !== "string") {
    return "";
  }

  return path.extname(filename).toLowerCase();
};

// =====================================================
// ORIGINAL FILENAME VALIDATION
// =====================================================

export const isSafeOriginalFilename = (filename = "") => {
  if (
    typeof filename !== "string" ||
    !filename.trim()
  ) {
    return false;
  }

  if (
    filename.includes("\0") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return false;
  }

  const normalized = filename.toLowerCase();

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

// =====================================================
// BASIC IMAGE VALIDATION
// =====================================================

export const validateImageMetadata = (file) => {
  if (!file) {
    throw new Error("Image file is required.");
  }

  const extension = getSafeExtension(file.originalname);
  const mimeType = String(file.mimetype || "")
    .trim()
    .toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(
      "Only JPG, JPEG, PNG, and WEBP images are allowed."
    );
  }

  if (!IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Invalid image file type.");
  }

  return true;
};

// =====================================================
// BASIC AUDIO VALIDATION
// =====================================================

export const validateAudioMetadata = (file) => {
  if (!file) {
    throw new Error("Audio file is required.");
  }

  const extension = getSafeExtension(file.originalname);
  const mimeType = String(file.mimetype || "")
    .trim()
    .toLowerCase();

  if (!AUDIO_EXTENSIONS.has(extension)) {
    throw new Error(
      "Only MP3, WAV, and M4A audio files are allowed."
    );
  }

  if (!AUDIO_MIME_TYPES.has(mimeType)) {
    throw new Error("Invalid audio file type.");
  }

  return true;
};

// =====================================================
// FILE SIZE VALIDATION
// =====================================================

export const validateFileSize = (
  file,
  maxSize,
  label = "File"
) => {
  if (!file) {
    throw new Error(`${label} is required.`);
  }

  if (
    !Number.isFinite(maxSize) ||
    maxSize <= 0
  ) {
    throw new Error("Invalid maximum file size.");
  }

  if (
    !Number.isFinite(file.size) ||
    file.size <= 0
  ) {
    throw new Error(`${label} is empty or invalid.`);
  }

  if (file.size > maxSize) {
    const maxMB = Math.floor(
      maxSize / (1024 * 1024)
    );

    throw new Error(
      `${label} must not exceed ${maxMB} MB.`
    );
  }

  return true;
};

// =====================================================
// READ FILE HEADER
// =====================================================

export const readFileHeader = async (
  filePath,
  length = 4100
) => {
  if (
    typeof filePath !== "string" ||
    !filePath.trim()
  ) {
    throw new Error("File path is required.");
  }

  if (
    !Number.isInteger(length) ||
    length <= 0
  ) {
    throw new Error("Invalid file header length.");
  }

  const handle = await fs.promises.open(filePath, "r");

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

// =====================================================
// IMAGE SIGNATURE DETECTION
// =====================================================

export const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  // JPEG
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

  // PNG
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

  // WEBP
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

// =====================================================
// AUDIO SIGNATURE DETECTION
// =====================================================

export const detectAudioType = (buffer) => {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  // MP3 with ID3 metadata
  if (
    buffer.length >= 3 &&
    buffer.toString("ascii", 0, 3) === "ID3"
  ) {
    return {
      extension: ".mp3",
      mime: "audio/mpeg",
    };
  }

  // MP3 MPEG frame sync
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

  // WAV
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

  // M4A / ISO Base Media
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
        buffer.toString("ascii", offset, offset + 4)
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

// =====================================================
// ACTUAL IMAGE FILE VALIDATION
// =====================================================

export const validateActualImage = async (file) => {
  validateImageMetadata(file);

  if (!file.path) {
    throw new Error("Uploaded image path is missing.");
  }

  const detected = detectImageType(
    await readFileHeader(file.path)
  );

  if (!detected) {
    throw new Error(
      "The uploaded image content is invalid."
    );
  }

  const extension = getSafeExtension(file.originalname);

  const extensionMatches =
    detected.extension === extension ||
    (
      detected.extension === ".jpg" &&
      extension === ".jpeg"
    );

  if (!extensionMatches) {
    throw new Error(
      "The image extension does not match the actual file content."
    );
  }

  if (
    String(file.mimetype || "").toLowerCase() !==
    detected.mime
  ) {
    throw new Error(
      "The image MIME type does not match the actual file content."
    );
  }

  return detected;
};

// =====================================================
// ACTUAL AUDIO FILE VALIDATION
// =====================================================

export const validateActualAudio = async (file) => {
  validateAudioMetadata(file);

  if (!file.path) {
    throw new Error("Uploaded audio path is missing.");
  }

  const detected = detectAudioType(
    await readFileHeader(file.path)
  );

  if (!detected) {
    throw new Error(
      "The uploaded audio content is invalid."
    );
  }

  const extension = getSafeExtension(file.originalname);

  if (detected.extension !== extension) {
    throw new Error(
      "The audio extension does not match the actual file content."
    );
  }

  const suppliedMimeType = String(file.mimetype || "")
    .trim()
    .toLowerCase();

  if (
    suppliedMimeType &&
    suppliedMimeType !== detected.mime &&
    !(
      detected.mime === "audio/mpeg" &&
      suppliedMimeType === "audio/mp3"
    ) &&
    !(
      detected.mime === "audio/wav" &&
      ["audio/x-wav", "audio/wave"].includes(
        suppliedMimeType
      )
    )
  ) {
    throw new Error(
      "The audio MIME type does not match the actual file content."
    );
  }

  return detected;
};

// =====================================================
// SAFE FILE DELETE
// =====================================================

export const deleteUploadedFile = async (file) => {
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
