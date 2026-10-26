import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    // Playlist owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Playlist name
    name: {
      type: String,
      required: [true, "Playlist name is required."],
      trim: true,
      minlength: [1, "Playlist name cannot be empty."],
      maxlength: [100, "Playlist name cannot exceed 100 characters."],
    },

    // Playlist description
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters."],
    },

    // Playlist cover image URL or path
    coverImage: {
      type: String,
      trim: true,
      default: "",
    },

    // Playlist visibility
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
      index: true,
    },

    // Songs belonging to this playlist
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate playlist names for the same owner.
// Different users can still use the same playlist name.
playlistSchema.index(
  { owner: 1, name: 1 },
  { unique: true }
);

// Export model using ES Modules
const Playlist =
  mongoose.models.Playlist ||
  mongoose.model("Playlist", playlistSchema);

export default Playlist;