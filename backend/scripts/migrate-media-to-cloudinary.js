
import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cloudinary from "../config/cloudinary.js";
import Song from "../models/Song.js";
import Album from "../models/Album.js";
import Artist from "../models/Artist.js";
import ArtistApplication from "../models/ArtistApplication.js";
import User from "../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const applyChanges = process.argv.includes("--apply");

// Cache uploaded URLs by resolved local path to prevent duplicate uploads.
const uploadedFiles = new Map();
const totals = {
  checked: 0,
  updated: 0,
  dryRun: 0,
  alreadyCloudinary: 0,
  empty: 0,
  missing: 0,
  unsupported: 0,
  failed: 0,
  conflicts: 0,
};

const jobs = [
  {
    Model: Song,
    fields: [
      { name: "audioFile", type: "video", folder: "lyricswayyy/audio" },
      { name: "coverImage", type: "image", folder: "lyricswayyy/images" },
    ],
  },
  {
    Model: Album,
    fields: [
      { name: "coverImage", type: "image", folder: "lyricswayyy/images" },
    ],
  },
  {
    Model: Artist,
    fields: [
      { name: "image", type: "image", folder: "lyricswayyy/images" },
    ],
  },
  {
    Model: ArtistApplication,
    fields: [
      { name: "image_url", type: "image", folder: "lyricswayyy/images" },
    ],
  },
  {
    Model: User,
    fields: [
      { name: "profileImage", type: "image", folder: "lyricswayyy/images" },
      {
        name: "artistApplication.image",
        type: "image",
        folder: "lyricswayyy/images",
      },
    ],
  },
];

function getFieldValue(document, field) {
  return field.split(".").reduce((value, key) => value?.[key], document);
}

function isCloudinaryUrl(value = "") {
  return /^https:\/\/res\.cloudinary\.com\//i.test(String(value).trim());
}

function resolveLocalFile(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim().replace(/\\/g, "/");

  // Only migrate public files under uploads/. Private files are excluded.
  const match = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
  if (!match) return null;

  const absolutePath = path.resolve(backendRoot, "uploads", ...match[1].split("/"));
  const relative = path.relative(path.resolve(backendRoot, "uploads"), absolutePath);

  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Unsafe local media path: ${value}`);
  }

  return absolutePath;
}

async function uploadOnce(localPath, field) {
  if (uploadedFiles.has(localPath)) {
    return uploadedFiles.get(localPath);
  }

  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: field.type,
    folder: field.folder,
    use_filename: false,
    unique_filename: true,
    overwrite: false,
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary did not return a secure URL.");
  }

  uploadedFiles.set(localPath, result.secure_url);
  return result.secure_url;
}

async function migrateField(Model, document, field) {
  totals.checked++;

  const value = getFieldValue(document, field.name);

  if (typeof value !== "string" || !value.trim()) {
    totals.empty++;
    return;
  }

  if (isCloudinaryUrl(value)) {
    totals.alreadyCloudinary++;
    return;
  }

  let localPath;

  try {
    localPath = resolveLocalFile(value);
  } catch (error) {
    totals.failed++;
    console.error(`  ERROR ${field.name}: ${error.message}`);
    return;
  }

  if (!localPath) {
    totals.unsupported++;
    console.log(`  SKIP ${field.name}: unsupported path: ${value}`);
    return;
  }

  try {
    await fs.access(localPath);
  } catch {
    totals.missing++;
    console.log(`  MISSING ${field.name}: ${value}`);
    return;
  }

  if (!applyChanges) {
    totals.dryRun++;
    console.log(`  DRY RUN ${field.name}: ${value}`);
    return;
  }

  try {
    const cloudinaryUrl = await uploadOnce(localPath, field);

    // Update only if the database value still matches the value we read.
    const result = await Model.updateOne(
      { _id: document._id, [field.name]: value },
      { $set: { [field.name]: cloudinaryUrl } },
    );

    if (result.modifiedCount !== 1) {
      totals.conflicts++;
      console.error(`  CONFLICT ${field.name}: ${value}`);
      console.error(`  Uploaded asset: ${cloudinaryUrl}`);
      return;
    }

    totals.updated++;
    console.log(`  UPDATED ${field.name}: ${cloudinaryUrl}`);
  } catch (error) {
    totals.failed++;
    console.error(`  ERROR ${field.name}: ${error.message}`);
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from backend/.env");
  }

  if (
    applyChanges &&
    (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET)
  ) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected.");
  console.log(
    applyChanges
      ? "LIVE MIGRATION: uploading media and updating database fields."
      : "DRY RUN: no uploads or database changes will be made.",
  );

  try {
    if (applyChanges) {
      await cloudinary.api.ping();
      console.log("Cloudinary connection verified.");
    }

    for (const { Model, fields } of jobs) {
      for (const field of fields) {
        const documents = await Model.find({
          [field.name]: { $type: "string", $ne: "" },
        })
          .select("_id " + field.name)
          .lean();

        console.log(`\n${Model.modelName}.${field.name}: ${documents.length} records`);

        for (const document of documents) {
          await migrateField(Model, document, field);
        }
      }
    }
  } finally {
    console.log("\nMigration summary:");
    console.log(JSON.stringify({
      mode: applyChanges ? "LIVE" : "DRY RUN",
      ...totals,
      uniqueFilesUploadedThisRun: uploadedFiles.size,
    }, null, 2));

    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

main().catch((error) => {
  console.error("Migration stopped:", error.message);
  process.exitCode = 1;
});
