import User from "../models/User.js";
import Song from "../models/Song.js";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import ArtistApplication from "../models/ArtistApplication.js";

// ============================================================
// GET DASHBOARD STATS
// ============================================================

export const getDashboardStats = async (req, res) => {
  try {
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
      User.countDocuments({ role: "user" }),

      User.countDocuments({ role: "artist" }),

      User.countDocuments({ role: "admin" }),

      User.countDocuments({ role: "superadmin" }),

      Song.countDocuments(),

      Album.countDocuments(),

      ArtistApplication.countDocuments({
        status: "pending",
      }),

      ArtistApplication.countDocuments({
        status: "approved",
      }),

      ArtistApplication.countDocuments({
        status: "rejected",
      }),
    ]);

    // --------------------------------------------------------
    // RECENT USERS
    // --------------------------------------------------------

    const recentUsers = await User.find({})
      .select("-password -passwordHash -tokenVersion")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // --------------------------------------------------------
    // RECENT ARTIST APPLICATIONS
    // --------------------------------------------------------

    const recentApplications = await ArtistApplication.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // --------------------------------------------------------
    // SONG GENRE STATISTICS
    // --------------------------------------------------------

    const genreStats = await Song.aggregate([
      {
        $match: {
          genre: {
            $exists: true,
            $nin: [null, ""],
          },
        },
      },
      {
        $group: {
          _id: "$genre",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 20,
      },
      {
        $project: {
          _id: 0,
          genre: "$_id",
          count: 1,
        },
      },
    ]);

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        totalArtists,
        totalAdmins,
        totalSuperAdmins,

        totalAccounts:
          totalUsers +
          totalArtists +
          totalAdmins +
          totalSuperAdmins,

        totalSongs,
        totalAlbums,

        pendingApplications,
        approvedApplications,
        rejectedApplications,
      },

      recentUsers,
      recentApplications,
      genreStats,

      // Compatibility with older dashboard frontend
      users: totalUsers,
      artists: totalArtists,
      admins: totalAdmins,
      superadmins: totalSuperAdmins,
      songs: totalSongs,
      albums: totalAlbums,
    });
  } catch (error) {
    console.error(
      "getDashboardStats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
};