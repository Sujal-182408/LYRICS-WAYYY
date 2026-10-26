import mongoose from "mongoose";

const artistFollowSchema = new mongoose.Schema(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Each user can follow an artist only once.
artistFollowSchema.index(
  { user: 1, artist: 1 },
  { unique: true }
);

const ArtistFollow =
  mongoose.models.ArtistFollow ||
  mongoose.model("ArtistFollow", artistFollowSchema);

export default ArtistFollow;