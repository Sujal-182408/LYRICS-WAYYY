import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from favoriting the same song more than once.
favoriteSchema.index(
  {
    user: 1,
    song: 1,
  },
  {
    unique: true,
  }
);

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;