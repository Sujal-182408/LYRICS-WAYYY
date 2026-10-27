import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is missing from .env");
  process.exit(1);
}

const root = path.join(os.homedir(), "Downloads");
const matches = [];

function search(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === "mongodump.exe") matches.push(full);
    else if (entry.isDirectory()) search(full);
  }
}

search(root);

if (!matches.length) {
  console.error("mongodump.exe was not found under Downloads. Extract the downloaded ZIP first.");
  process.exit(1);
}

const tool = matches[0];
console.log("Found MongoDB backup tool.");

const output = path.join(os.homedir(), "Desktop", `lyricswayyy-backup-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });

const result = spawnSync(tool, ["--uri", uri, "--out", output], {
  stdio: "inherit",
  windowsHide: true,
});

if (result.status !== 0) {
  console.error("Backup failed. Do not run the migration yet.");
  process.exit(result.status ?? 1);
}

console.log("Backup completed. Folder:", output);
