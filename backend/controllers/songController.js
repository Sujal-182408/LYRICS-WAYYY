
import mongoose from "mongoose";
import path from "path";

import Song from "../models/Song.js";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import ListeningHistory from "../models/ListeningHistory.js";
import { notifyAllUsers } from "../utils/notificationService.js";

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
  String(req.user?.role || "")
    .trim()
    .toLowerCase();

const isSuperAdmin = (req) =>
  ["superadmin", "super_admin"].includes(getRole(req));

const validId = (id) =>
  typeof id === "string" &&
  mongoose.Types.ObjectId.isValid(id) &&
  String(new mongoose.Types.ObjectId(id)) === id;

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

// =====================================================
// PAGINATION
// =====================================================

const getPagination = (req) => {
  const parsedPage = Number.parseInt(req.query.page, 10);
  const parsedLimit = Number.parseInt(req.query.limit, 10);

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
// REGEX HELPERS
// =====================================================

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSearch = (value) =>
  String(value ?? "").trim();

// =====================================================
// UPLOAD PATH HELPERS
// =====================================================

// Store public upload paths instead of absolute filesystem paths.
//
// Example:
// C:\project\backend\uploads\songs\song.mp3
// becomes:
// uploads/songs/song.mp3

const toPublicUploadPath = (filePath, folder) => {
  if (!filePath) return null;

  const value = String(filePath).trim();

  if (!value) return null;

  const normalized = value.replace(/\\/g, "/");

  if (
    normalized.startsWith("uploads/") ||
    normalized.startsWith("/uploads/")
  ) {
    return normalized.replace(/^\/+/, "");
  }

  const filename = path.posix.basename(normalized);

  if (!filename || filename === "." || filename === "..") {
    return null;
  }

  return `uploads/${folder}/${filename}`;
};

// =====================================================
// FILE -> PUBLIC PATH
// =====================================================

const getUploadedAudioPath = (req) => {
  const file =
    req.file ||
    req.files?.audioFile?.[0] ||
    req.files?.song?.[0] ||
    null;

  if (!file) return null;

  return toPublicUploadPath(
    file.path || file.filename,
    "songs",
  );
};

const getUploadedCoverPath = (req) => {
  const file =
    req.files?.coverImage?.[0] ||
    req.files?.cover?.[0] ||
    null;

  if (!file) return null;

  return toPublicUploadPath(
    file.path || file.filename,
    "covers",
  );
};

// =====================================================
// ARTIST OWNERSHIP
// =====================================================

const findMyArtist = async (userId) => {
  if (!userId) return null;

  let artist = await Artist.findOne({
    user: userId,
  });

  if (!artist) {
    artist = await Artist.findOne({
      user_id: userId,
    });
  }

  return artist;
};

// =====================================================
// SONG OWNERSHIP
// =====================================================

const canManageSong = async (req, song) => {
  if (isSuperAdmin(req)) {
    return true;
  }

  const userId = getUserId(req);

  if (!userId || !song) {
    return false;
  }

  // Direct uploader ownership.
  const uploadedBy = song.uploadedBy?._id || song.uploadedBy;

  if (
    uploadedBy &&
    String(uploadedBy) === String(userId)
  ) {
    return true;
  }

  // Artist ownership.
  const artistId = song.artist?._id || song.artist;

  if (!artistId) return false;

  const artist = await Artist.findById(artistId)
    .select("user user_id");

  if (!artist) return false;

  const ownerId = artist.user || artist.user_id;

  return Boolean(
    ownerId && String(ownerId) === String(userId),
  );
};

// =====================================================
// SONG POPULATE
// =====================================================

// Song.album is a string, so do not populate album.

const populateSong = (query) =>
  query
    .populate({
      path: "artist",
      select: "name image bio genre followers verified user user_id",
    })
    .populate({
      path: "uploadedBy",
      select: "name email role profileImage",
    });

// =====================================================
// SAFE NOTIFICATION HELPERS
// =====================================================

// Notification failures must not cause a successful song
// operation to return an error.
//
// notifyAllUsers should save notifications and emit
// notification:new through your Socket.IO implementation.

const safelyNotifyAllUsers = async (notification) => {
  try {
    await notifyAllUsers(notification);
  } catch (error) {
    console.error(
      "SONG NOTIFICATION ERROR:",
      error?.message || error,
    );
  }
};

// =====================================================
// CREATE SONG
// =====================================================

export const createSong = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = getRole(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    if (role !== "artist" && !isSuperAdmin(req)) {
      return sendError(
        res,
        403,
        "Only artists or superadmins can upload songs.",
      );
    }

    const {
      title,
      artist,
      album,
      genre,
      duration,
      coverImage,
      audioFile,
    } = req.body || {};

    const songTitle = String(title || "").trim();

    if (!songTitle) {
      return sendError(
        res,
        400,
        "Song title is required.",
      );
    }

    // Resolve artist profile.
    let artistId = artist;

    if (role === "artist") {
      const myArtist = await findMyArtist(userId);

      if (!myArtist) {
        return sendError(
          res,
          403,
          "Artist profile not found.",
        );
      }

      artistId = myArtist._id;
    }

    if (!artistId || !validId(String(artistId))) {
      return sendError(
        res,
        400,
        "Valid artist ID is required.",
      );
    }

    const artistDoc = await Artist.findById(artistId);

    if (!artistDoc) {
      return sendError(
        res,
        404,
        "Artist not found.",
      );
    }

    // Verify artist ownership.
    if (role === "artist") {
      const ownerId = artistDoc.user || artistDoc.user_id;

      if (
        !ownerId ||
        String(ownerId) !== String(userId)
      ) {
        return sendError(
          res,
          403,
          "You can only upload songs for your own artist profile.",
        );
      }
    }

    const albumValue =
      album !== undefined && album !== null
        ? String(album).trim()
        : "";

    const uploadedAudio = getUploadedAudioPath(req);
    const uploadedCover = getUploadedCoverPath(req);

    const finalAudio =
      uploadedAudio ||
      (audioFile
        ? toPublicUploadPath(audioFile, "songs")
        : null);

    const finalCover =
      uploadedCover ||
      (coverImage
        ? toPublicUploadPath(coverImage, "covers")
        : null);

    if (!finalAudio) {
      return sendError(
        res,
        400,
        "Audio file is required.",
      );
    }

    const songData = {
      title: songTitle,
      artist: artistId,
      uploadedBy: userId,
      album: albumValue,
      audioFile: finalAudio,
    };

    if (genre !== undefined) {
      songData.genre = String(genre || "").trim();
    }

    if (duration !== undefined) {
      songData.duration = String(duration || "").trim();
    }

    if (finalCover) {
      songData.coverImage = finalCover;
    }

    const song = await Song.create(songData);

    const populated = await populateSong(
      Song.findById(song._id),
    ).lean();

    // Notify other users after the song is saved.
    const artistName =
      populated?.artist?.name ||
      artistDoc.name ||
      "An artist";

    await safelyNotifyAllUsers({
      type: "song",
      title: "New Song Released",
      message: `${artistName} added "${song.title}" to the music library.`,
      icon: "music",
      link: `/songs/${song._id}`,
      metadata: {
        songId: String(song._id),
        artistId: String(artistDoc._id),
        songTitle: song.title,
        artistName,
      },
      excludeUser: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Song created successfully.",
      song: populated,
    });
  } catch (error) {
    console.error("CREATE SONG ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to create song.",
    );
  }
};

// =====================================================
// GET ALL SONGS
// GET /api/songs?search=joy&page=1&limit=6
// =====================================================

export const getSongs = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const search = normalizeSearch(req.query.search);
    const genre = normalizeSearch(req.query.genre);
    const artist = req.query.artist;
    const album = normalizeSearch(req.query.album);
    const sort = normalizeSearch(req.query.sort) || "latest";

    const filter = {};

    // Case-insensitive search across title, genre and album.
    if (search) {
      const searchRegex = new RegExp(
        escapeRegex(search),
        "i",
      );

      filter.$or = [
        { title: searchRegex },
        { genre: searchRegex },
        { album: searchRegex },
      ];
    }

    // Genre filter.
    if (genre) {
      filter.genre = {
        $regex: escapeRegex(genre),
        $options: "i",
      };
    }

    // Artist ID filter.
    if (artist) {
      if (!validId(String(artist))) {
        return sendError(
          res,
          400,
          "Invalid artist ID.",
        );
      }

      filter.artist = artist;
    }

    // Album filter.
    if (album) {
      filter.album = {
        $regex: `^${escapeRegex(album)}$`,
        $options: "i",
      };
    }

    // Sorting.
    let sortQuery = {
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortQuery = {
        createdAt: 1,
      };
    } else if (sort === "title") {
      sortQuery = {
        title: 1,
      };
    } else if (sort === "artist") {
      sortQuery = {
        artist: 1,
      };
    }

    const [songs, total] = await Promise.all([
      populateSong(
        Song.find(filter)
          .sort(sortQuery)
          .skip(skip)
          .limit(limit),
      ).lean(),

      Song.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      songs,
      count: songs.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET SONGS ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve songs.",
    );
  }
};

// =====================================================
// GET MY SONGS
// =====================================================

export const getMySongs = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    const { page, limit, skip } = getPagination(req);
    const myArtist = await findMyArtist(userId);

    const conditions = [
      {
        uploadedBy: userId,
      },
    ];

    if (myArtist) {
      conditions.push({
        artist: myArtist._id,
      });
    }

    const filter = {
      $or: conditions,
    };

    const [songs, total] = await Promise.all([
      populateSong(
        Song.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ).lean(),

      Song.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      songs,
      count: songs.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET MY SONGS ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve your songs.",
    );
  }
};

// =====================================================
// GET MY ARTIST
// =====================================================

export const getMyArtist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    const artist = await findMyArtist(userId);

    if (!artist) {
      return sendError(
        res,
        404,
        "Artist profile not found.",
      );
    }

    return res.status(200).json({
      success: true,
      artist,
    });
  } catch (error) {
    console.error("GET MY ARTIST ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve artist profile.",
    );
  }
};

// =====================================================
// GET SONG BY ID
// =====================================================

export const getSongById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return sendError(
        res,
        400,
        "Invalid song ID.",
      );
    }

    const song = await populateSong(
      Song.findById(id),
    ).lean();

    if (!song) {
      return sendError(
        res,
        404,
        "Song not found.",
      );
    }

    return res.status(200).json({
      success: true,
      song,
    });
  } catch (error) {
    console.error("GET SONG BY ID ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve song.",
    );
  }
};

// =====================================================
// UPDATE SONG
// =====================================================

export const updateSong = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(
        res,
        400,
        "Invalid song ID.",
      );
    }

    const song = await Song.findById(id);

    if (!song) {
      return sendError(
        res,
        404,
        "Song not found.",
      );
    }

    const allowed = await canManageSong(req, song);

    if (!allowed) {
      return sendError(
        res,
        403,
        "You do not have permission to update this song.",
      );
    }

    const {
      title,
      artist,
      album,
      genre,
      duration,
      coverImage,
      audioFile,
    } = req.body || {};

    // TITLE
    if (title !== undefined) {
      const value = String(title).trim();

      if (!value) {
        return sendError(
          res,
          400,
          "Song title cannot be empty.",
        );
      }

      song.title = value;
    }

    // ARTIST
    if (artist !== undefined) {
      if (!validId(String(artist))) {
        return sendError(
          res,
          400,
          "Invalid artist ID.",
        );
      }

      const artistDoc = await Artist.findById(artist);

      if (!artistDoc) {
        return sendError(
          res,
          404,
          "Artist not found.",
        );
      }

      if (!isSuperAdmin(req)) {
        const ownerId =
          artistDoc.user || artistDoc.user_id;

        if (
          !ownerId ||
          String(ownerId) !== String(userId)
        ) {
          return sendError(
            res,
            403,
            "You can only assign your own artist profile.",
          );
        }
      }

      song.artist = artist;
    }

    // ALBUM
    if (album !== undefined) {
      song.album =
        album === null ? "" : String(album).trim();
    }

    // GENRE
    if (genre !== undefined) {
      song.genre = String(genre || "").trim();
    }

    // DURATION
    if (duration !== undefined) {
      song.duration = String(duration || "").trim();
    }

    // COVER FROM BODY
    if (coverImage !== undefined) {
      const normalizedCover = coverImage
        ? toPublicUploadPath(coverImage, "covers")
        : "";

      song.coverImage = normalizedCover;
    }

    // AUDIO FROM BODY
    if (audioFile !== undefined) {
      const normalizedAudio = audioFile
        ? toPublicUploadPath(audioFile, "songs")
        : "";

      if (!normalizedAudio) {
        return sendError(
          res,
          400,
          "Audio file cannot be empty.",
        );
      }

      song.audioFile = normalizedAudio;
    }

    // NEW UPLOADED FILES
    const uploadedAudio = getUploadedAudioPath(req);
    const uploadedCover = getUploadedCoverPath(req);

    if (uploadedAudio) {
      song.audioFile = uploadedAudio;
    }

    if (uploadedCover) {
      song.coverImage = uploadedCover;
    }

    // AUDIO SAFETY
    if (
      !song.audioFile ||
      !String(song.audioFile).trim()
    ) {
      return sendError(
        res,
        400,
        "Audio file is required.",
      );
    }

    // FINAL NORMALIZATION
    song.audioFile = toPublicUploadPath(
      song.audioFile,
      "songs",
    );

    if (song.coverImage) {
      song.coverImage = toPublicUploadPath(
        song.coverImage,
        "covers",
      );
    }

    await song.save();

    const updated = await populateSong(
      Song.findById(song._id),
    ).lean();

    // Notify users after the update has succeeded.
    const updatedArtistName =
      updated?.artist?.name || "An artist";

    await safelyNotifyAllUsers({
      type: "song",
      title: "Song Updated",
      message: `"${updated?.title || song.title}" by ${updatedArtistName} has been updated.`,
      icon: "music",
      link: `/songs/${song._id}`,
      metadata: {
        songId: String(song._id),
        artistId: updated?.artist?._id
          ? String(updated.artist._id)
          : String(song.artist),
        songTitle: updated?.title || song.title,
        artistName: updatedArtistName,
        action: "updated",
      },
      excludeUser: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Song updated successfully.",
      song: updated,
    });
  } catch (error) {
    console.error("UPDATE SONG ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to update song.",
    );
  }
};

// =====================================================
// DELETE SONG
// =====================================================

export const deleteSong = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(
        res,
        400,
        "Invalid song ID.",
      );
    }

    const song = await Song.findById(id);

    if (!song) {
      return sendError(
        res,
        404,
        "Song not found.",
      );
    }

    const allowed = await canManageSong(req, song);

    if (!allowed) {
      return sendError(
        res,
        403,
        "You do not have permission to delete this song.",
      );
    }

    await Song.deleteOne({
      _id: song._id,
    });

    return res.status(200).json({
      success: true,
      message: "Song deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE SONG ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to delete song.",
    );
  }
};

// =====================================================
// DASHBOARD STATS
// =====================================================

export const getDashboardStats = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = getRole(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    // ARTIST DASHBOARD
    if (role === "artist") {
      const myArtist = await findMyArtist(userId);

      if (!myArtist) {
        return sendError(
          res,
          404,
          "Artist profile not found.",
        );
      }

      const artistId = myArtist._id;

      const artistSongFilter = {
        artist: artistId,
      };

      const [
        totalSongs,
        genreResult,
        recentSongs,
      ] = await Promise.all([
        Song.countDocuments(artistSongFilter),

        Song.aggregate([
          {
            $match: {
              artist: artistId,
              genre: {
                $nin: ["", null],
              },
            },
          },
          {
            $group: {
              _id: "$genre",
            },
          },
          {
            $count: "count",
          },
        ]),

        populateSong(
          Song.find(artistSongFilter)
            .sort({ createdAt: -1 })
            .limit(10),
        ).lean(),
      ]);

      const totalGenres = genreResult[0]?.count || 0;

      let totalAlbums = 0;

      try {
        totalAlbums = await Album.countDocuments({
          artist: artistId,
        });
      } catch (albumError) {
        console.warn(
          "ARTIST ALBUM COUNT WARNING:",
          albumError.message,
        );

        totalAlbums = 0;
      }

      return res.status(200).json({
        success: true,
        stats: {
          totalSongs,
          totalArtists: 1,
          totalAlbums,
          totalGenres,
        },
        totalSongs,
        totalArtists: 1,
        totalAlbums,
        totalGenres,
        recentSongs,
        artist: myArtist,
      });
    }

    // SUPERADMIN DASHBOARD
    if (isSuperAdmin(req)) {
      const [
        totalSongs,
        totalArtists,
        totalAlbums,
        genreResult,
        recentSongs,
      ] = await Promise.all([
        Song.countDocuments(),
        Artist.countDocuments(),
        Album.countDocuments(),

        Song.aggregate([
          {
            $match: {
              genre: {
                $nin: ["", null],
              },
            },
          },
          {
            $group: {
              _id: "$genre",
            },
          },
          {
            $count: "count",
          },
        ]),

        populateSong(
          Song.find({})
            .sort({ createdAt: -1 })
            .limit(10),
        ).lean(),
      ]);

      const totalGenres = genreResult[0]?.count || 0;

      return res.status(200).json({
        success: true,
        stats: {
          totalSongs,
          totalArtists,
          totalAlbums,
          totalGenres,
        },
        totalSongs,
        totalArtists,
        totalAlbums,
        totalGenres,
        recentSongs,
      });
    }

    return sendError(
      res,
      403,
      "You do not have permission to view dashboard statistics.",
    );
  } catch (error) {
    console.error("GET DASHBOARD STATS ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve dashboard statistics.",
    );
  }
};

// =====================================================
// ARTIST ANALYTICS
// =====================================================

export const getArtistAnalytics = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required.",
      );
    }

    const myArtist = await findMyArtist(userId);

    if (!myArtist && !isSuperAdmin(req)) {
      return sendError(
        res,
        404,
        "Artist profile not found.",
      );
    }

    const artistId = req.query.artistId || myArtist?._id;

    if (!artistId || !validId(String(artistId))) {
      return sendError(
        res,
        400,
        "Valid artist ID is required.",
      );
    }

    // Artist ownership.
    if (!isSuperAdmin(req)) {
      if (
        !myArtist ||
        String(myArtist._id) !== String(artistId)
      ) {
        return sendError(
          res,
          403,
          "You can only view your own artist analytics.",
        );
      }
    }

    const artist = await Artist.findById(artistId)
      .select("name image followers verified user user_id")
      .lean();

    if (!artist) {
      return sendError(
        res,
        404,
        "Artist not found.",
      );
    }

    const songs = await Song.find({
      artist: artistId,
    })
      .select("_id title album genre duration createdAt")
      .lean();

    const songIds = songs.map((song) => song._id);

    let totalListeningEvents = 0;
    let totalListeningDuration = 0;
    let topSongs = [];
    let dailyListening = [];

    if (songIds.length > 0) {
      const [
        eventStats,
        topSongStats,
        dailyStats,
      ] = await Promise.all([
        // Overall listening statistics.
        ListeningHistory.aggregate([
          {
            $match: {
              song: {
                $in: songIds,
              },
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
              duration: {
                $sum: {
                  $ifNull: ["$duration", 0],
                },
              },
            },
          },
        ]),

        // Top songs by plays.
        ListeningHistory.aggregate([
          {
            $match: {
              song: {
                $in: songIds,
              },
            },
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
        ]),

        // Daily listening activity.
        ListeningHistory.aggregate([
          {
            $match: {
              song: {
                $in: songIds,
              },
            },
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
        ]),
      ]);

      totalListeningEvents = eventStats[0]?.count || 0;

      totalListeningDuration = eventStats[0]?.duration || 0;

      topSongs = topSongStats.map((item) => {
        const song = songs.find(
          (entry) => String(entry._id) === String(item._id),
        );

        return {
          song,
          plays: item.plays,
          duration: item.duration,
        };
      });

      dailyListening = dailyStats;
    }

    return res.status(200).json({
      success: true,
      artist,
      summary: {
        totalSongs: songs.length,
        totalFollowers: Number(artist.followers || 0),
        totalListeningEvents,
        totalListeningDuration,
      },
      songs,
      topSongs,
      dailyListening,
    });
  } catch (error) {
    console.error("GET ARTIST ANALYTICS ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve artist analytics.",
    );
  }
};
