import User from "../models/User.js";
import Song from "../models/Song.js";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import ArtistApplication from "../models/ArtistApplication.js";

// =====================================================
// HELPERS
// =====================================================

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

// =====================================================
// SUPER ADMIN CHECK
// =====================================================

const isSuperAdmin = (req) => {
  return (
    String(req.user?.role || "")
      .trim()
      .toLowerCase() === "superadmin"
  );
};

// =====================================================
// GET SUPER ADMIN DASHBOARD STATS
// =====================================================
//
// GET
// /api/superadmin/dashboard-stats
//
// Returns live information for:
//
// - users
// - artists
// - admins
// - super admins
// - total accounts
// - songs
// - albums
// - artist applications
// - recent users
// - recent artist applications
// - recent songs
// - genre statistics
//
// =====================================================

export const getDashboardStats = async (req, res) => {
  try {
    // ===================================================
    // SECURITY
    // ===================================================

    if (!isSuperAdmin(req)) {
      return sendError(
        res,
        403,
        "Super Admin access required."
      );
    }

    // ===================================================
    // BASIC COUNTS
    // ===================================================

    const [
      totalUsers,
      totalArtists,
      totalAdmins,
      totalSuperAdmins,
      totalSongs,
      totalAlbums,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
    ] = await Promise.all([
      // Normal users
      User.countDocuments({
        role: "user",
      }),

      // Artists
      User.countDocuments({
        role: "artist",
      }),

      // Admins
      User.countDocuments({
        role: "admin",
      }),

      // Super Admins
      User.countDocuments({
        role: "superadmin",
      }),

      // Songs
      Song.countDocuments(),

      // Albums
      Album.countDocuments(),

      // Pending artist applications
      ArtistApplication.countDocuments({
        status: "pending",
      }),

      // Approved artist applications
      ArtistApplication.countDocuments({
        status: "approved",
      }),

      // Rejected artist applications
      ArtistApplication.countDocuments({
        status: "rejected",
      }),
    ]);

    // ===================================================
    // TOTAL ACCOUNTS
    // ===================================================

    const totalAccounts =
      totalUsers +
      totalArtists +
      totalAdmins +
      totalSuperAdmins;

    // ===================================================
    // RECENT USERS
    // ===================================================

    const recentUsers = await User.find({})
      .select(
        [
          "_id",
          "name",
          "email",
          "role",
          "createdAt",
          "updatedAt",
          "profileImage",
          "status",
          "isActive",
        ].join(" ")
      )
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean();

    // ===================================================
    // RECENT ARTIST APPLICATIONS
    // ===================================================

    const recentApplications =
      await ArtistApplication.find({})
        .select(
          [
            "_id",
            "user_id",
            "artist_name",
            "status",
            "genre",
            "description",
            "image_url",
            "social_profile_url",
            "verification_song_id",
            "admin_note",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
            "createdAt",
            "updatedAt",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
          created_at: -1,
        })
        .limit(10)
        .populate({
          path: "user_id",
          select: "_id name email role profileImage",
        })
        .lean();

    // ===================================================
    // RECENT SONGS
    // ===================================================

    const recentSongs = await Song.find({})
      .select(
        [
          "_id",
          "title",
          "artist",
          "album",
          "genre",
          "duration",
          "coverImage",
          "audioFile",
          "createdAt",
          "updatedAt",
        ].join(" ")
      )
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean();

    // ===================================================
    // GENRE STATISTICS
    // ===================================================

    const genreStats = await Song.aggregate([
      // Ignore empty genres
      {
        $match: {
          genre: {
            $nin: [null, ""],
          },
        },
      },

      // Group by genre
      {
        $group: {
          _id: "$genre",
          count: {
            $sum: 1,
          },
        },
      },

      // Highest count first
      {
        $sort: {
          count: -1,
        },
      },

      // Maximum 20 genres
      {
        $limit: 20,
      },
    ]);

    // ===================================================
    // APPLICATION SUMMARY
    // ===================================================

    const applicationTotal =
      pendingApplications +
      approvedApplications +
      rejectedApplications;

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,

      // Stats object
      stats: {
        totalUsers,
        totalArtists,
        totalAdmins,
        totalSuperAdmins,
        totalAccounts,
        totalSongs,
        totalAlbums,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        applicationTotal,
      },

      // Frontend compatibility
      totalUsers,
      totalArtists,
      totalAdmins,
      totalSuperAdmins,
      totalAccounts,
      totalSongs,
      totalAlbums,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      applicationTotal,

      // Live dashboard data
      recentUsers,
      recentApplications,
      recentSongs,
      genreStats,
    });
  } catch (error) {
    console.error(
      "SUPER ADMIN DASHBOARD ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve Super Admin dashboard statistics."
    );
  }
};