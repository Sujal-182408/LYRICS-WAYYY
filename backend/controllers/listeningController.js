import mongoose from "mongoose";
import Song from "../models/Song.js";
import ListeningHistory from "../models/ListeningHistory.js";

// =====================================================
// HELPERS
// =====================================================

const getUserId = (req) =>
  req.user?._id ||
  req.user?.id ||
  req.authUser?._id ||
  req.authUser?.id ||
  null;

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const validId = (id) =>
  typeof id === "string" &&
  mongoose.isValidObjectId(id);

const getPagination = (req) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// =====================================================
// START LISTENING
// POST /api/profile/listening/start
// Body: { songId, position?, duration? }
// =====================================================

export const startListening = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { songId, position, duration } = req.body || {};

    if (!songId || !validId(String(songId))) {
      return sendError(res, 400, "A valid song ID is required.");
    }

    const song = await Song.findById(songId)
      .select("_id title artist album duration")
      .lean();

    if (!song) {
      return sendError(res, 404, "Song not found.");
    }

    const toNonNegativeNumber = (value, fallback = 0) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      if (typeof value === "boolean") {
        return null;
      }

      const number = Number(value);

      return Number.isFinite(number) && number >= 0
        ? number
        : null;
    };

    const initialPosition = toNonNegativeNumber(position, 0);

    const initialDuration = toNonNegativeNumber(
      duration,
      Number(song.duration) || 0
    );

    if (initialPosition === null || initialDuration === null) {
      return sendError(
        res,
        400,
        "Position and duration must be non-negative numbers."
      );
    }

    const now = new Date();

    const history = await ListeningHistory.create({
      user: userId,
      song: song._id,
      artist: song.artist || null,
      startedAt: now,
      listenedSeconds: 0,
      position: initialPosition,
      duration: initialDuration,
      completed: false,
      lastListenedAt: now,
    });

    return res.status(201).json({
      success: true,
      message: "Listening session started.",
      history,
      historyId: history._id,
    });
  } catch (error) {
    console.error("START LISTENING ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to start listening session."
    );
  }
};

// =====================================================
// UPDATE LISTENING
// PATCH /api/profile/listening/:id
// Body: { listenedSeconds, position?, duration?, completed? }
// =====================================================

export const updateListening = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const historyId = req.params.id || req.body?.historyId;

    if (!historyId || !validId(String(historyId))) {
      return sendError(
        res,
        400,
        "A valid listening history ID is required."
      );
    }

    const history = await ListeningHistory.findOne({
      _id: historyId,
      user: userId,
    });

    if (!history) {
      return sendError(
        res,
        404,
        "Listening session not found for this user."
      );
    }

    const safeNumber = (value) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        typeof value === "boolean"
      ) {
        return null;
      }

      const number = Number(value);

      return Number.isFinite(number) && number >= 0
        ? number
        : null;
    };

    const body = req.body || {};

    if (body.listenedSeconds !== undefined) {
      const seconds = safeNumber(body.listenedSeconds);

      if (seconds === null) {
        return sendError(
          res,
          400,
          "listenedSeconds must be a non-negative number."
        );
      }

      history.listenedSeconds = Math.max(
        Number(history.listenedSeconds) || 0,
        seconds
      );
    }

    if (
      body.position !== undefined &&
      history.schema.path("position")
    ) {
      const position = safeNumber(body.position);

      if (position === null) {
        return sendError(
          res,
          400,
          "position must be a non-negative number."
        );
      }

      history.position = position;
    }

    if (
      body.duration !== undefined &&
      history.schema.path("duration")
    ) {
      const duration = safeNumber(body.duration);

      if (duration === null) {
        return sendError(
          res,
          400,
          "duration must be a non-negative number."
        );
      }

      history.duration = duration;
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== "boolean") {
        return sendError(
          res,
          400,
          "completed must be a boolean."
        );
      }

      history.completed = body.completed;
    }

    if (history.schema.path("lastListenedAt")) {
      history.lastListenedAt = new Date();
    }

    await history.save();

    return res.status(200).json({
      success: true,
      message: "Listening progress updated.",
      history,
    });
  } catch (error) {
    console.error("UPDATE LISTENING ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to update listening progress."
    );
  }
};

// =====================================================
// GET LISTENING HISTORY
// GET /api/profile/listening
// =====================================================

export const getListeningHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { page, limit, skip } = getPagination(req);

    const filter = { user: userId };
    const userObjectId = new mongoose.Types.ObjectId(String(userId));

    const [history, total, analytics] = await Promise.all([
      ListeningHistory.find(filter)
        .sort({ startedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "song",
          select: "title artist album genre duration coverImage audioFile",
          populate: [
            {
              path: "artist",
              select: "name image verified followers",
            },
            {
              path: "album",
              select: "name title coverImage",
            },
          ],
        })
        .lean(),

      ListeningHistory.countDocuments(filter),

      ListeningHistory.aggregate([
        {
          $match: {
            user: userObjectId,
          },
        },
        {
          $group: {
            _id: null,

            totalPlays: {
              $sum: 1,
            },

            totalListenedSeconds: {
              $sum: {
                $max: [
                  0,
                  {
                    $ifNull: ["$listenedSeconds", 0],
                  },
                ],
              },
            },

            completedPlays: {
              $sum: {
                $cond: ["$completed", 1, 0],
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
    ]);

    const stats = analytics[0] || {
      totalPlays: 0,
      totalListenedSeconds: 0,
      completedPlays: 0,
      uniqueSongs: 0,
    };

    return res.status(200).json({
      success: true,
      history,
      count: history.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),

      stats: {
        ...stats,

        totalListenedMinutes: Math.floor(
          stats.totalListenedSeconds / 60
        ),

        totalListenedHours: Number(
          (stats.totalListenedSeconds / 3600).toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error("GET LISTENING HISTORY ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve listening history."
    );
  }
};

// =====================================================
// DELETE ONE LISTENING HISTORY ENTRY
// DELETE /api/profile/listening/:id
// =====================================================

export const deleteListeningHistoryEntry = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const deleted = await ListeningHistory.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Listening history entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Listening history entry deleted.",
      deletedId: deleted._id,
    });
  } catch (error) {
    console.error("deleteListeningHistoryEntry:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete listening history entry.",
    });
  }
};

// =====================================================
// CLEAR ALL LISTENING HISTORY
// DELETE /api/profile/listening
// =====================================================

export const clearListeningHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await ListeningHistory.deleteMany({
      user: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Listening history cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("clearListeningHistory:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear listening history.",
    });
  }
};