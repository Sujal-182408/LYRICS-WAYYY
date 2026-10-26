
import mongoose from "mongoose";
import ListeningHistory from "../models/ListeningHistory.js";
import Artist from "../models/Artist.js";
import Song from "../models/Song.js";
import User from "../models/User.js";

// =====================================================
// HELPERS
// =====================================================

const getUserId = (req) =>
  req.user?.id ||
  req.user?._id ||
  req.user?.userId ||
  req.user?.user_id ||
  null;

const getRole = (req) =>
  String(req.user?.role || "").trim().toLowerCase();

const isAdmin = (req) =>
  ["admin", "superadmin", "super_admin"].includes(getRole(req));

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSearch = (value) =>
  String(value ?? "").trim();

const isValidObjectId = (value) =>
  typeof value === "string" &&
  mongoose.Types.ObjectId.isValid(value);

const normalizePagination = (query) => {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  const page = Number.isFinite(parsedPage)
    ? Math.max(1, parsedPage)
    : 1;

  const limit = Number.isFinite(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// =====================================================
// GET ALL ARTISTS
// GET /api/artists?search=joy&page=1&limit=6
// =====================================================

export const getArtists = async (req, res) => {
  try {
    const search = normalizeSearch(req.query.search);
    const verified = req.query.verified;
    const genre = normalizeSearch(req.query.genre);

    const { page, limit, skip } = normalizePagination(req.query);

    const filter = {};

    if (verified !== undefined && String(verified).trim() !== "") {
      const normalizedVerified = String(verified)
        .trim()
        .toLowerCase();

      if (!["true", "false"].includes(normalizedVerified)) {
        return res.status(400).json({
          success: false,
          message: "Invalid verified filter. Use true or false.",
        });
      }

      filter.verified = normalizedVerified === "true";
    }

    if (genre) {
      filter.genre = {
        $regex: escapeRegex(genre),
        $options: "i",
      };
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: searchRegex },
        { bio: searchRegex },
        { genre: searchRegex },
      ];
    }

    const [artists, total] = await Promise.all([
      Artist.find(filter)
        .sort({
          verified: -1,
          followers: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Artist.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: artists.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      artists,
    });
  } catch (error) {
    console.error("GET ARTISTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve artists.",
    });
  }
};

// =====================================================
// GET PUBLIC ARTIST PROFILE
// GET /api/artists/:id
// =====================================================

export const getArtistById = async (req, res) => {
  try {
   const id = req.params.artistId;

console.log("Artist route received ID:", JSON.stringify(id));
console.log("ID length:", id?.length);
console.log("ID type:", typeof id);
console.log(
  "Mongoose validation:",
  mongoose.Types.ObjectId.isValid(id)
);

if (
  typeof id !== "string" ||
  !/^[a-fA-F0-9]{24}$/.test(id)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid artist ID.",
    receivedId: id,
    idLength: id?.length,
  });
}

    const artist = await Artist.findById(id).lean();

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found.",
      });
    }

    const songs = await Song.find({
      artist: artist._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const songIds = songs.map((song) => song._id);

    // Count listening-history records for all songs by this artist.
    const totalPlays =
      songIds.length > 0
        ? await ListeningHistory.countDocuments({
            song: { $in: songIds },
          })
        : 0;

    return res.status(200).json({
      success: true,

      artist: {
        ...artist,
        totalPlays,
        plays: totalPlays,
      },

      songs,

      stats: {
        totalPlays,
        totalSongs: songs.length,
      },
    });
  } catch (error) {
    console.error("GET PUBLIC ARTIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve artist profile.",
    });
  }
};

// =====================================================
// GET MY ARTIST PROFILE
// GET /api/artists/me
// =====================================================

export const getMyArtist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(String(userId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    let artist = await Artist.findOne({
      user: userId,
    }).lean();

    if (!artist) {
      artist = await Artist.findOne({
        user_id: userId,
      }).lean();
    }

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      artist,
    });
  } catch (error) {
    console.error("GET MY ARTIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your artist profile.",
    });
  }
};

// =====================================================
// UPDATE MY ARTIST PROFILE
// PUT /api/artists/me
// =====================================================

export const updateMyArtist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(String(userId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    let artist = await Artist.findOne({
      user: userId,
    });

    if (!artist) {
      artist = await Artist.findOne({
        user_id: userId,
      });
    }

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found.",
      });
    }

    const allowedFields = [
      "name",
      "bio",
      "genre",
      "coverImage",
      "website",
      "instagram",
      "facebook",
      "twitter",
      "youtube",
      "spotify",
      "socialLinks",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        artist[field] = req.body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "image")) {
      artist.image = req.body.image;
    }

    if (req.body.social_links !== undefined) {
      artist.socialLinks = req.body.social_links;
    }

    if (req.file) {
      artist.image = `uploads/artists/${req.file.filename}`;
    }

    await artist.save();

    if (req.body.name && String(req.body.name).trim()) {
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            name: String(req.body.name).trim(),
          },
        },
        {
          runValidators: true,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Artist profile updated successfully.",
      artist: artist.toObject(),
    });
  } catch (error) {
    console.error("UPDATE MY ARTIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update artist profile.",
    });
  }
};