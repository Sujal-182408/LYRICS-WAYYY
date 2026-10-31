// =====================================================
// LYRICS WAYYY - BACKEND SERVER (ES MODULES)
// =====================================================

// Load environment variables before importing controllers and routes.
import "dotenv/config";


import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import { fileURLToPath } from "node:url";

import { createServer } from "node:http";
import { initializeNotificationSocket } from "./utils/notificationSocket.js";

// =====================================================
// ES MODULES EQUIVALENT OF __dirname
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// =====================================================
// DATABASE
// =====================================================

import connectDB from "./config/db.js";

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// Trust one proxy only if your backend is behind exactly
// one trusted proxy. Adjust this to match your deployment.
app.set("trust proxy", 1);

// =====================================================
// CONFIGURATION
// =====================================================

const PORT = Number(process.env.PORT) || 5001;

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

// =====================================================
// UPLOAD DIRECTORIES
// =====================================================

const UPLOADS_DIR = path.resolve(__dirname, "uploads");

const SONGS_DIR = path.join(UPLOADS_DIR, "songs");
const COVERS_DIR = path.join(UPLOADS_DIR, "covers");
const ARTISTS_DIR = path.join(UPLOADS_DIR, "artists");
const ALBUMS_DIR = path.join(UPLOADS_DIR, "albums");
const PROFILES_DIR = path.join(UPLOADS_DIR, "profiles");

// =====================================================
// CREATE REQUIRED UPLOAD DIRECTORIES
// =====================================================

[
  UPLOADS_DIR,
  SONGS_DIR,
  COVERS_DIR,
  ARTISTS_DIR,
  ALBUMS_DIR,
  PROFILES_DIR,
].forEach((directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });

    console.log(`📁 Created directory: ${directory}`);
  }
});

// =====================================================
// SECURITY
// =====================================================

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// =====================================================
// CORS
// =====================================================


const allowedOrigins = [
  // Production frontend
  "https://lyricswayyy.vercel.app",

  // Local development
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  // LAN development
  "http://192.168.1.5:5173",
  "http://192.168.1.7:5173",
  "http://192.168.1.10:5173",

  // VS Code Dev Tunnel frontend
  "https://q8n7zrnv-5173.inc1.devtunnels.ms",

  // Optional configured frontend URL
  CLIENT_URL,
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/+$/, ""));


app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.error(`❌ CORS blocked: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



// =====================================================
// BODY PARSERS
// =====================================================

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

// =====================================================
// STATIC UPLOADS
// =====================================================
//
// Example:
// /uploads/songs/file.mp3
//
// Maps to:
// backend/uploads/songs/file.mp3
//
// Keep this before the 404 handler.
// =====================================================

app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    fallthrough: true,
    index: false,
    dotfiles: "deny",
    maxAge:
      process.env.NODE_ENV === "production"
        ? "1d"
        : 0,
  })
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "LYRICS WAYYY API is running 🎵",
    status: "online",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const databaseConnected = dbState === 1;

    return res.status(databaseConnected ? 200 : 503).json({
      success: databaseConnected,
      api: "ok",
      database: databaseConnected
        ? "connected"
        : "disconnected",
      service: "LYRICS WAYYY API",
    });
  } catch (error) {
    console.error(
      "❌ HEALTH CHECK ERROR:",
      error?.message || error
    );

    return res.status(503).json({
      success: false,
      api: "ok",
      database: "disconnected",
    });
  }
});

// =====================================================
// ROUTE IMPORTS
// =====================================================

import authRoutes from "./routes/auth.js";
import songRoutes from "./routes/songRoutes.js";
import artistRoutes from "./routes/artistRoutes.js";
import albumRoutes from "./routes/albumRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import superAdminRoutes from "./routes/superadminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import artistApplicationRoutes from "./routes/artistApplicationRoutes.js";
import superAdminArtistApplicationRoutes from "./routes/superAdminArtistApplicationRoutes.js";

import externalMusicRoutes from "./routes/externalMusicRoutes.js";

// =====================================================
// AUTH ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

if (process.env.NODE_ENV !== "production") {
  app.get("/api/auth/route-check", (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Auth router is mounted.",
      path: req.originalUrl,
    });
  });

  console.log("AUTH ROUTER MOUNTED AT /api/auth");
  console.log("JWT_SECRET PRESENT:", Boolean(process.env.JWT_SECRET));
  console.log(
    "JWT_SECRET LENGTH:",
    process.env.JWT_SECRET?.length || 0
  );
}

// Temporary development-only route diagnostics.
// Remove or disable this logging before production.
if (process.env.NODE_ENV !== "production") {
  console.log("🔐 AUTH ROUTES LOADED");
}

// =====================================================
// SONG ROUTES
// =====================================================

app.use("/api/songs", songRoutes);

// =====================================================
// ARTIST ROUTES
// =====================================================

app.use("/api/artists", artistRoutes);

// =====================================================
// ALBUM ROUTES
// =====================================================

app.use("/api/albums", albumRoutes);

// =====================================================
// COLLECTION ROUTES
// =====================================================

app.use("/api/collections", collectionRoutes);

// =====================================================
// PLAYLIST ROUTES
// =====================================================

app.use("/api/playlists", playlistRoutes);

// =====================================================
// SUPERADMIN ROUTES
// =====================================================

app.use("/api/superadmin", superAdminRoutes);

// ========================================================== 
// Mount external music routes under /api/external-music.
// ==========================================================

app.use("/api/external-music", externalMusicRoutes);

// =====================================================
// PROFILE ROUTES
// =====================================================

app.use("/api/profile", profileRoutes);

if (process.env.NODE_ENV !== "production") {
  app.get("/api/profile/route-check", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Profile routes are loaded",
    });
  });

  console.log("✅ PROFILE ROUTER MOUNTED AT /api/profile");
}

// =====================================================
// NOTIFICATION ROUTES
// =====================================================

app.use("/api/notifications", notificationRoutes);

// =====================================================
// ANALYTICS ROUTES
// =====================================================

app.use("/api/analytics", analyticsRoutes);

// =====================================================
// ARTIST APPLICATION ROUTES
// =====================================================

app.use("/api/artist-applications", artistApplicationRoutes);

// =====================================================
// SUPERADMIN ARTIST APPLICATION ROUTES
// =====================================================

app.use(
  "/api/superadmin/artist-applications",
  superAdminArtistApplicationRoutes
);

// =====================================================
// UPLOAD DEBUG ROUTE
// =====================================================
//
// Checks an individual uploaded song file without exposing
// directory listings. Keep this route development-only.
// =====================================================

if (process.env.NODE_ENV !== "production") {
  app.get("/uploads-check/songs/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(SONGS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        exists: false,
        filename,
      });
    }

    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      return res.status(404).json({
        success: false,
        exists: false,
        filename,
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      filename,
      size: stats.size,
      url: `/uploads/songs/${encodeURIComponent(filename)}`,
    });
  });
}

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);

  return res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin not allowed",
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload failed",
    });
  }

  console.error(
    "❌ SERVER ERROR:",
    err?.message || err
  );

  return res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Unexpected server error",
  });
});

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
  let server;

  try {
    console.log("");
    console.log("========================================");
    console.log("       LYRICS WAYYY BACKEND");
    console.log("========================================");
    console.log("🔄 Connecting to MongoDB...");

    await connectDB();

    console.log("✅ MongoDB connected successfully");

    console.log("");
    console.log("📁 Upload configuration:");
    console.log(`   Root:     ${UPLOADS_DIR}`);
    console.log(`   Songs:    ${SONGS_DIR}`);
    console.log(`   Covers:   ${COVERS_DIR}`);
    console.log(`   Artists:  ${ARTISTS_DIR}`);
    console.log(`   Albums:   ${ALBUMS_DIR}`);
    console.log(`   Profiles: ${PROFILES_DIR}`);

    const songFiles = fs
      .readdirSync(SONGS_DIR)
      .filter((file) => !file.startsWith("."));

    console.log("");
    console.log(`🎵 Songs available on disk: ${songFiles.length}`);

    if (songFiles.length > 0) {
      console.log("   First songs:");

      songFiles.slice(0, 5).forEach((file) => {
        console.log(`   ✓ ${file}`);
      });
    }

    console.log("");

 
const httpServer = createServer(app);

// Initialize Socket.IO on the same HTTP server as Express.
initializeNotificationSocket(httpServer, allowedOrigins);

// Keep this reference if your graceful-shutdown code uses `server`.
server = httpServer;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log("       🎵 SERVER IS RUNNING 🎵");
  console.log("========================================");
  console.log(`🚀 Local:   http://localhost:${PORT}`);
  console.log(`❤️ Health:  http://localhost:${PORT}/api/health`);
  console.log(`🎵 API:     http://localhost:${PORT}/api`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
  console.log("🔔 Socket.IO notification server initialized");
  console.log("========================================");
  console.log("✅ LYRICS WAYYY API READY");
  console.log("========================================");
  console.log("");
});


    // =================================================
    // GRACEFUL SHUTDOWN
    // =================================================

    let isShuttingDown = false;

    const shutdown = (signal) => {
      if (isShuttingDown) {
        return;
      }

      isShuttingDown = true;

      console.log("");
      console.log(`⚠️ ${signal} received. Shutting down...`);

      const forceExitTimer = setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);

      forceExitTimer.unref();

      server.close(async (serverError) => {
        try {
          if (serverError) {
            throw serverError;
          }

          await mongoose.connection.close();

          clearTimeout(forceExitTimer);

          console.log("✅ MongoDB connection closed");
          console.log("👋 Server shutdown complete");

          process.exit(0);
        } catch (error) {
          console.error(
            "❌ Shutdown error:",
            error?.message || error
          );

          process.exit(1);
        }
      });
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("❌ SERVER STARTUP FAILED");
    console.error("========================================");
    console.error(error);
    console.error("========================================");

    if (server) {
      server.close();
    }

    process.exitCode = 1;
  }
};

startServer();