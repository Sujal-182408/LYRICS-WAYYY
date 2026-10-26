
import mongoose from "mongoose";
import Follow from "../models/Follow.js";
import Artist from "../models/Artist.js";

const getAuthenticatedUserId = (req) => {
  return req.auth?.userId || req.user?._id?.toString();
};

const isValidObjectId = (id) => {
  return (
    typeof id === "string" &&
    mongoose.Types.ObjectId.isValid(id)
  );
};

// =====================================================
// GET FOLLOWED ARTISTS
// GET /api/profile/followed-artists
// =====================================================

export const getFollowedArtists = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const follows = await Follow.find({ user: userId })
      .populate({
        path: "artist",
        select: "name image bio followers verified user",
      })
      .sort({ createdAt: -1 })
      .lean();

    const artists = follows
      .filter((follow) => follow.artist)
      .map((follow) => ({
        ...follow.artist,
        followId: follow._id,
        followedAt: follow.createdAt,
      }));

    return res.status(200).json({
      success: true,
      count: artists.length,
      artists,
    });
  } catch (error) {
    console.error("GET FOLLOWED ARTISTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch followed artists.",
    });
  }
};

// =====================================================
// FOLLOW ARTIST
// POST /api/profile/followed-artists/:artistId
// =====================================================

export const followArtist = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { artistId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(artistId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist ID.",
      });
    }

    const artist = await Artist.findById(artistId)
      .select("_id user followers name")
      .lean();

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    // Prevent an artist from following their own artist profile.
    if (String(artist.user) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow your own artist profile.",
      });
    }

    // The unique compound index on Follow prevents duplicates.
    const existingFollow = await Follow.findOne({
      user: userId,
      artist: artistId,
    }).lean();

    if (existingFollow) {
      return res.status(200).json({
        success: true,
        message: "You already follow this artist.",
        following: true,
      });
    }

    try {
      await Follow.create({
        user: userId,
        artist: artistId,
      });
    } catch (error) {
      // Handle concurrent requests safely.
      if (error.code !== 11000) {
        throw error;
      }
    }

    // Recalculate from Follow records to avoid incrementing twice.
    const followers = await Follow.countDocuments({
      artist: artistId,
    });

    await Artist.updateOne(
      { _id: artistId },
      { $set: { followers } }
    );

    return res.status(200).json({
      success: true,
      message: "Artist followed successfully.",
      following: true,
      followers,
    });
  } catch (error) {
    console.error("FOLLOW ARTIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to follow artist.",
    });
  }
};

// =====================================================
// UNFOLLOW ARTIST
// DELETE /api/profile/followed-artists/:artistId
// =====================================================

export const unfollowArtist = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { artistId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(artistId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist ID.",
      });
    }

    const artist = await Artist.findById(artistId)
      .select("_id")
      .lean();

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    await Follow.deleteOne({
      user: userId,
      artist: artistId,
    });

    // Recalculate so repeated unfollow requests cannot make it negative.
    const followers = await Follow.countDocuments({
      artist: artistId,
    });

    await Artist.updateOne(
      { _id: artistId },
      { $set: { followers } }
    );

    return res.status(200).json({
      success: true,
      message: "Artist unfollowed successfully.",
      following: false,
      followers,
    });
  } catch (error) {
    console.error("UNFOLLOW ARTIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow artist.",
    });
  }
};

// =====================================================
// CHECK FOLLOW STATUS
// GET /api/profile/followed-artists/:artistId/status
// =====================================================

export const getFollowStatus = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { artistId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(artistId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist ID.",
      });
    }

    const [artist, follow] = await Promise.all([
      Artist.findById(artistId).select("_id").lean(),
      Follow.findOne({
        user: userId,
        artist: artistId,
      })
        .select("_id")
        .lean(),
    ]);

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    return res.status(200).json({
      success: true,
      following: Boolean(follow),
    });
  } catch (error) {
    console.error("GET FOLLOW STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check follow status.",
    });
  }
};