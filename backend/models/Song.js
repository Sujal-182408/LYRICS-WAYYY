
import mongoose from "mongoose";

// ============================================================
// SONG SCHEMA
// ============================================================

const songSchema = new mongoose.Schema(
  {
    // ==========================================================
    // BASIC INFORMATION
    // ==========================================================

    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
      maxlength: [200, "Song title cannot exceed 200 characters"],
    },

    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: [true, "Artist is required"],
      index: true,
    },

    album: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Album name cannot exceed 200 characters"],
    },

    genre: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Genre cannot exceed 100 characters"],
    },

    duration: {
      type: String,
      default: "",
      trim: true,
      maxlength: [20, "Duration cannot exceed 20 characters"],
    },

    // ==========================================================
    // MEDIA
    // ==========================================================

    coverImage: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Cover image path is too long"],
    },

    audioFile: {
      type: String,
      required: [true, "Audio file is required"],
      trim: true,
      maxlength: [1000, "Audio file path is too long"],
    },

    // ==========================================================
    // OWNER / UPLOADER
    // ==========================================================

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

// Artist + newest songs
songSchema.index({
  artist: 1,
  createdAt: -1,
});

// Newest songs
songSchema.index({
  createdAt: -1,
});

// Genre filtering
songSchema.index({
  genre: 1,
});

// ============================================================
// ES MODULE EXPORT
// ============================================================

const Song =
  mongoose.models.Song ||
  mongoose.model("Song", songSchema);

export default Song;
