import mongoose from "mongoose";
import Artist from "../models/Artist.js";
import ArtistFollow from "../models/ArtistFollow.js";

// =====================================================
// FOLLOW ARTIST
// POST /api/artists/:artistId/follow
// =====================================================

export const followArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to follow an artist.",
      });
    }

    if (
      !mongoose.isValidObjectId(artistId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist or user ID.",
      });
    }

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    if (artist.user.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow your own artist profile.",
      });
    }

    // Create a relationship only if one does not already exist.
    let created = false;

    try {
      await ArtistFollow.create({
        user: userId,
        artist: artistId,
      });

      created = true;
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
      // Duplicate relationship: already following.
    }

    if (created) {
      await Artist.updateOne(
        { _id: artistId },
        { $inc: { followers: 1 } }
      );
    }

    const updatedArtist = await Artist.findById(artistId).select(
      "name followers verified"
    );

    return res.status(200).json({
      success: true,
      following: true,
      alreadyFollowing: !created,
      artist: updatedArtist,
    });
  } catch (error) {
    console.error("Follow artist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to follow artist.",
    });
  }
};


export const getArtistFollowStatus = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in.",
      });
    }

    const following = await ArtistFollow.exists({
      user: userId,
      artist: artistId,
    });

    return res.status(200).json({
      success: true,
      following: Boolean(following),
    });
  } catch (error) {
    console.error("Get artist follow status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch follow status.",
    });
  }
};


// =====================================================
// UNFOLLOW ARTIST
// POST /api/artists/:artistId/unfollow
// =====================================================

export const unfollowArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to unfollow an artist.",
      });
    }

    if (
      !mongoose.isValidObjectId(artistId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist or user ID.",
      });
    }

    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    const result = await ArtistFollow.deleteOne({
      user: userId,
      artist: artistId,
    });

    if (result.deletedCount > 0) {
      await Artist.updateOne(
        { _id: artistId, followers: { $gt: 0 } },
        { $inc: { followers: -1 } }
      );
    }

    const updatedArtist = await Artist.findById(artistId).select(
      "name followers verified"
    );

    return res.status(200).json({
      success: true,
      following: false,
      wasFollowing: result.deletedCount > 0,
      artist: updatedArtist,
    });
  } catch (error) {
    console.error("Unfollow artist error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow artist.",
    });
  }
};