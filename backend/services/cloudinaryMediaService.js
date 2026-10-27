import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";
import path from "path";

const CLOUDINARY_FOLDERS = {
  image: "lyricswayyy/images",
  audio: "lyricswayyy/audio",
};

export const isCloudinaryUrl = (value = "") =>
  /^https:\/\/res\.cloudinary\.com\//i.test(
    String(value).trim(),
  );

export async function uploadMediaToCloudinary(
  file,
  resourceType,
  folder,
) {
  if (!file?.path) {
    throw new Error("A valid uploaded file is required.");
  }

  if (!["image", "video"].includes(resourceType)) {
    throw new Error(
      'resourceType must be "image" or "video".',
    );
  }

  const resolvedPath = path.resolve(file.path);

  const result = await cloudinary.uploader.upload(
    resolvedPath,
    {
      resource_type: resourceType,
      folder:
        folder ||
        (resourceType === "video"
          ? CLOUDINARY_FOLDERS.audio
          : CLOUDINARY_FOLDERS.image),
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    },
  );

  // Delete the temporary file only after Cloudinary succeeds.
  await fs.unlink(resolvedPath).catch((error) => {
    if (error.code !== "ENOENT") {
      console.error(
        "Temporary upload cleanup failed:",
        error.message,
      );
    }
  });

  return result.secure_url;
}