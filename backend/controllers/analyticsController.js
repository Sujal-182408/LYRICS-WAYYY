import ListeningHistory from "../models/ListeningHistory.js";
import Song from "../models/Song.js";
import Artist from "../models/Artist.js";

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
  String(req.user?.role || "").toLowerCase();

const isAdmin = (req) =>
  ["admin", "superadmin", "super_admin"].includes(
    getRole(req)
  );

// =====================================================
// ANALYTICS DATE HELPERS
// =====================================================

const ALLOWED_PERIODS = ["7d", "30d", "90d", "1y"];

const getAnalyticsDateRange = (req) => {
  const requestedPeriod = String(
    req.query?.period || "30d"
  ).trim();

  if (!ALLOWED_PERIODS.includes(requestedPeriod)) {
    return {
      error: "Invalid period. Use 7d, 30d, 90d, or 1y.",
    };
  }

  const now = new Date();

  const end = req.query?.endDate
    ? new Date(req.query.endDate)
    : now;

  let start;

  if (req.query?.startDate) {
    start = new Date(req.query.startDate);
  } else {
    start = new Date(end);

    switch (requestedPeriod) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;

      case "30d":
        start.setDate(start.getDate() - 30);
        break;

      case "90d":
        start.setDate(start.getDate() - 90);
        break;

      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
  }

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return {
      error: "Invalid analytics date range.",
    };
  }

  if (start > end) {
    return {
      error: "Start date cannot be after end date.",
    };
  }

  return {
    period: requestedPeriod,
    start,
    end,
  };
};

const buildListeningHistoryMatch = (
  req,
  userId,
  start,
  end
) => {
  const match = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
  };

  // Administrators can view global analytics.
  // Other users can only view their own listening history.
  if (!isAdmin(req)) {
    match.user = userId;
  }

  return match;
};

// =====================================================
// GET GENERAL ANALYTICS
// =====================================================

export const getAnalytics = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const dateRange = getAnalyticsDateRange(req);

    if (dateRange.error) {
      return res.status(400).json({
        success: false,
        message: dateRange.error,
      });
    }

    const {
      period,
      start,
      end,
    } = dateRange;

    const match = buildListeningHistoryMatch(
      req,
      userId,
      start,
      end
    );

    const [
      totalListeningEvents,
      uniqueSongs,
      totalDurationResult,
    ] = await Promise.all([
      ListeningHistory.countDocuments(match),

      ListeningHistory.distinct("song", match),

      ListeningHistory.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: null,
            totalDuration: {
              $sum: {
                $ifNull: ["$duration", 0],
              },
            },
          },
        },
      ]),
    ]);

    const totalDuration =
      totalDurationResult[0]?.totalDuration || 0;

    return res.status(200).json({
      success: true,

      analytics: {
        period,
        startDate: start,
        endDate: end,

        totalListeningEvents,
        uniqueSongs: uniqueSongs.length,
        totalDuration,
      },
    });
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve analytics.",
    });
  }
};

// =====================================================
// GET LISTENING ANALYTICS
// =====================================================

export const getListeningAnalytics = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const dateRange = getAnalyticsDateRange(req);

    if (dateRange.error) {
      return res.status(400).json({
        success: false,
        message: dateRange.error,
      });
    }

    const {
      period,
      start,
      end,
    } = dateRange;

    const match = buildListeningHistoryMatch(
      req,
      userId,
      start,
      end
    );

    // -------------------------------------------------
    // DAILY LISTENING
    // -------------------------------------------------

    const daily = await ListeningHistory.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          plays: {
            $sum: 1,
          },

          duration: {
            $sum: {
              $ifNull: ["$duration", 0],
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // -------------------------------------------------
    // TOP SONGS
    // -------------------------------------------------

    const topSongs = await ListeningHistory.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: "$song",

          plays: {
            $sum: 1,
          },

          duration: {
            $sum: {
              $ifNull: ["$duration", 0],
            },
          },
        },
      },
      {
        $sort: {
          plays: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    const topSongIds = topSongs
      .map((item) => item._id)
      .filter(Boolean);

    const songs = topSongIds.length
      ? await Song.find({
          _id: {
            $in: topSongIds,
          },
        })
          .populate("artist")
          .lean()
      : [];

    const songMap = new Map(
      songs.map((song) => [
        String(song._id),
        song,
      ])
    );

    const formattedTopSongs = topSongs.map(
      (item) => ({
        song:
          songMap.get(String(item._id)) || null,

        plays: item.plays,
        duration: item.duration,
      })
    );

    // -------------------------------------------------
    // ARTIST PERFORMANCE
    // -------------------------------------------------

    const artistStats = await ListeningHistory.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "songData",
        },
      },
      {
        $unwind: {
          path: "$songData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$songData.artist",

          plays: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          plays: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    const artistIds = artistStats
      .map((item) => item._id)
      .filter(Boolean);

    const artists = artistIds.length
      ? await Artist.find({
          _id: {
            $in: artistIds,
          },
        }).lean()
      : [];

    const artistMap = new Map(
      artists.map((artist) => [
        String(artist._id),
        artist,
      ])
    );

    const formattedArtists = artistStats.map(
      (item) => ({
        artist:
          artistMap.get(String(item._id)) || null,

        plays: item.plays,
      })
    );

    // -------------------------------------------------
    // TOTALS
    // -------------------------------------------------

    const totals = await ListeningHistory.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,

          plays: {
            $sum: 1,
          },

          duration: {
            $sum: {
              $ifNull: ["$duration", 0],
            },
          },
        },
      },
    ]);

    const total = totals[0] || {
      plays: 0,
      duration: 0,
    };

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      analytics: {
        period,
        startDate: start,
        endDate: end,

        totals: {
          plays: total.plays || 0,
          duration: total.duration || 0,
        },

        daily,

        topSongs: formattedTopSongs,

        artists: formattedArtists,
      },
    });
  } catch (error) {
    console.error(
      "GET LISTENING ANALYTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve listening analytics.",
    });
  }
};