import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a user from following the same artist more than once.
followSchema.index(
  {
    user: 1,
    artist: 1,
  },
  {
    unique: true,
  }
);

const Follow = mongoose.model("Follow", followSchema);

export default Follow;