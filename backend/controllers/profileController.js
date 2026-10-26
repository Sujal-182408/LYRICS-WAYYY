import mongoose from "mongoose";
import ListeningHistory from "../models/ListeningHistory.js";
import Song from "../models/Song.js";

// =====================================================
// HELPER: VALIDATE MONGODB OBJECTID
// =====================================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) &&
  String(new mongoose.Types.ObjectId(id)) === String(id);

// =====================================================
// START LISTENING SESSION
// POST /api/profile/listening/start
// =====================================================

export const startListening = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { songId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!songId || !isValidObjectId(songId)) {
      return res.status(400).json({
        success: false,
        message: "A valid song ID is required.",
      });
    }

    const song = await Song.findById(songId).select(
      "_id title artist duration"
    );

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    const durationValue = Number(song.duration);

    const duration =
      Number.isFinite(durationValue) && durationValue >= 0
        ? durationValue
        : 0;

    const history = await ListeningHistory.create({
      user: userId,
      song: song._id,
      artist: song.artist || null,
      startedAt: new Date(),
      listenedSeconds: 0,
      duration,
      position: 0,
      completed: false,
      lastListenedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Listening session started.",
      history,
      historyId: history._id,
    });
  } catch (error) {
    console.error("startListening error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start listening session.",
    });
  }
};

// =====================================================
// UPDATE LISTENING SESSION
// PATCH /api/profile/listening/:historyId
// =====================================================

export const updateListening = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { historyId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!isValidObjectId(historyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listening history ID.",
      });
    }

    const history = await ListeningHistory.findOne({
      _id: historyId,
      user: userId,
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: "Listening session not found.",
      });
    }

    const {
      listenedSeconds,
      position,
      duration,
      completed,
    } = req.body;

    // Validate listened duration.
    if (listenedSeconds !== undefined) {
      const seconds = Number(listenedSeconds);

      if (!Number.isFinite(seconds) || seconds < 0) {
        return res.status(400).json({
          success: false,
          message:
            "listenedSeconds must be a finite nonnegative number.",
        });
      }

      // Prevent stale requests from decreasing the saved total.
      history.listenedSeconds = Math.max(
        history.listenedSeconds || 0,
        Math.floor(seconds)
      );
    }

    // Validate playback position.
    if (position !== undefined) {
      const nextPosition = Number(position);

      if (!Number.isFinite(nextPosition) || nextPosition < 0) {
        return res.status(400).json({
          success: false,
          message:
            "position must be a finite nonnegative number.",
        });
      }

      history.position = nextPosition;
    }

    // Validate song duration.
    if (duration !== undefined) {
      const nextDuration = Number(duration);

      if (!Number.isFinite(nextDuration) || nextDuration < 0) {
        return res.status(400).json({
          success: false,
          message:
            "duration must be a finite nonnegative number.",
        });
      }

      history.duration = nextDuration;
    }

    // Completion is one-way.
    if (completed === true) {
      history.completed = true;
    }

    history.lastListenedAt = new Date();

    await history.save();

    return res.status(200).json({
      success: true,
      message: "Listening session updated.",
      historyId: history._id,
      listenedSeconds: history.listenedSeconds,
      position: history.position,
      duration: history.duration,
      completed: history.completed,
      lastListenedAt: history.lastListenedAt,
    });
  } catch (error) {
    console.error("updateListening error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update listening session.",
    });
  }
};

// =====================================================
// GET LISTENING HISTORY + ANALYTICS
// GET /api/profile/listening
// =====================================================

export const getListeningHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const requestedPage =
      Number.parseInt(req.query.page, 10) || 1;

    const requestedLimit =
      Number.parseInt(req.query.limit, 10) || 20;

    const page = Math.max(1, requestedPage);
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const userFilter = {
      user: new mongoose.Types.ObjectId(String(userId)),
    };

    // -----------------------------------------------------
    // PAGINATED LISTENING HISTORY
    // -----------------------------------------------------

    const [history, count] = await Promise.all([
      ListeningHistory.find(userFilter)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "song",
          select:
            "title artist album genre duration coverImage audioFile",
        })
        .populate({
          path: "artist",
          select: "name image verified",
        })
        .lean(),

      ListeningHistory.countDocuments(userFilter),
    ]);

    // -----------------------------------------------------
    // OVERALL ANALYTICS
    // Calculated across all sessions, not just this page.
    // -----------------------------------------------------

    const [overallStatsResult, dailyActivity] = await Promise.all([
      ListeningHistory.aggregate([
        {
          $match: userFilter,
        },
        {
          $group: {
            _id: null,
            totalPlays: {
              $sum: 1,
            },
            totalListenedSeconds: {
              $sum: {
                $ifNull: ["$listenedSeconds", 0],
              },
            },
            completedPlays: {
              $sum: {
                $cond: [
                  { $eq: ["$completed", true] },
                  1,
                  0,
                ],
              },
            },
            uniqueSongs: {
              $addToSet: "$song",
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalPlays: 1,
            totalListenedSeconds: 1,
            completedPlays: 1,
            uniqueSongs: {
              $size: "$uniqueSongs",
            },
          },
        },
      ]),

      ListeningHistory.aggregate([
        {
          $match: userFilter,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$startedAt",
                timezone: "Asia/Kolkata",
              },
            },
            plays: {
              $sum: 1,
            },
            listenedSeconds: {
              $sum: {
                $ifNull: ["$listenedSeconds", 0],
              },
            },
            completedPlays: {
              $sum: {
                $cond: [
                  { $eq: ["$completed", true] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            plays: 1,
            listenedSeconds: 1,
            completedPlays: 1,
          },
        },
      ]),
    ]);

    const stats = overallStatsResult[0] || {
      totalPlays: 0,
      totalListenedSeconds: 0,
      completedPlays: 0,
      uniqueSongs: 0,
    };

    const totalListenedSeconds =
      stats.totalListenedSeconds || 0;

    return res.status(200).json({
      success: true,
      history,
      count: history.length,
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),

      stats: {
        totalPlays: stats.totalPlays || 0,
        totalListenedSeconds,

        totalListenedMinutes: Math.floor(
          totalListenedSeconds / 60
        ),

        totalListenedHours: Number(
          (totalListenedSeconds / 3600).toFixed(2)
        ),

        completedPlays: stats.completedPlays || 0,
        uniqueSongs: stats.uniqueSongs || 0,
      },

      dailyActivity,
    });
  } catch (error) {
    console.error("getListeningHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve listening history.",
    });
  }
};