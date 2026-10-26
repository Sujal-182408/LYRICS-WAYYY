
import mongoose from "mongoose";
import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

// =====================================================
// HELPERS
// =====================================================

const getUserId = (req) =>
  req.user?.id ??
  req.user?._id ??
  req.user?.userId ??
  req.user?.user_id ??
  null;

const validId = (id) =>
  Boolean(
    id &&
      (typeof id === "string" ||
        id instanceof mongoose.Types.ObjectId) &&
      mongoose.Types.ObjectId.isValid(String(id))
  );

const sendError = (res, status, message, extra = {}) =>
  res.status(status).json({
    success: false,
    message,
    ...extra,
  });

const isAdmin = (req) =>
  ["admin", "superadmin"].includes(
    String(req.user?.role || "").toLowerCase()
  );

const sameId = (first, second) =>
  Boolean(first && second) &&
  String(first._id || first) === String(second._id || second);

const getOwnerId = (playlist) =>
  playlist?.owner?._id || playlist?.owner || null;

const canModifyPlaylist = (req, playlist) =>
  isAdmin(req) || sameId(getOwnerId(playlist), getUserId(req));

const normalizeVisibility = (body = {}) => {
  if (body.visibility !== undefined) {
    return body.visibility === "public" ? "public" : "private";
  }

  if (body.isPublic !== undefined) {
    return body.isPublic === true || body.isPublic === "true"
      ? "public"
      : "private";
  }

  if (body.visible !== undefined) {
    return body.visible === true || body.visible === "true"
      ? "public"
      : "private";
  }

  return undefined;
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPagination = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(req.query.limit) || 20)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// =====================================================
// POPULATE PLAYLIST
// Playlist schema uses owner, not user.
// =====================================================

const populatePlaylist = (query) =>
  query
    .populate("owner", "name email profileImage")
    .populate({
      path: "songs",
      select:
        "title artist album genre duration coverImage audioFile createdAt",
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
    });

// =====================================================
// GET MY PLAYLISTS
// GET /api/playlists
// =====================================================

const getMyPlaylists = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { search = "" } = req.query;
    const { page, limit, skip } = getPagination(req);

    const filter = { owner: userId };
    const searchText = String(search || "").trim();

    if (searchText) {
      filter.name = {
        $regex: escapeRegex(searchText),
        $options: "i",
      };
    }

    const [playlists, total] = await Promise.all([
      populatePlaylist(
        Playlist.find(filter)
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ).lean(),

      Playlist.countDocuments(filter),
    ]);

    const totalSongsInPlaylists = playlists.reduce(
      (totalSongs, playlist) =>
        totalSongs + (playlist.songs?.length || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: playlists.length,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      stats: {
        totalPlaylists: total,
        totalSongsInPlaylists,
      },
      playlists,
    });
  } catch (error) {
    console.error("GET MY PLAYLISTS ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve playlists."
    );
  }
};

// =====================================================
// CREATE PLAYLIST
// POST /api/playlists
// =====================================================

const createPlaylist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(
        res,
        401,
        "Authentication required. Please sign in again."
      );
    }

    const {
      name,
      description = "",
      coverImage = "",
    } = req.body || {};

    const playlistName = String(name || "").trim();
    const playlistDescription = String(description || "").trim();
    const playlistCover = String(coverImage || "").trim();
    const visibility = normalizeVisibility(req.body) || "private";

    if (!playlistName) {
      return sendError(res, 400, "Playlist name is required.");
    }

    if (playlistName.length > 100) {
      return sendError(
        res,
        400,
        "Playlist name cannot exceed 100 characters."
      );
    }

    if (playlistDescription.length > 500) {
      return sendError(
        res,
        400,
        "Playlist description cannot exceed 500 characters."
      );
    }

    const existingPlaylist = await Playlist.findOne({
      owner: userId,
      name: playlistName,
    });

    if (existingPlaylist) {
      return sendError(
        res,
        409,
        "A playlist with this name already exists."
      );
    }

    const playlist = await Playlist.create({
      owner: userId,
      name: playlistName,
      description: playlistDescription,
      coverImage: playlistCover,
      visibility,
      songs: [],
    });

    const populatedPlaylist = await populatePlaylist(
      Playlist.findById(playlist._id)
    ).lean();

    return res.status(201).json({
      success: true,
      message: "Playlist created successfully.",
      playlist: populatedPlaylist,
    });
  } catch (error) {
    console.error("CREATE PLAYLIST ERROR:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "A playlist with this name already exists."
      );
    }

    if (error.name === "ValidationError") {
      return sendError(
        res,
        400,
        "Playlist validation failed.",
        {
          errors: Object.values(error.errors).map(
            (item) => item.message
          ),
        }
      );
    }

    return sendError(
      res,
      500,
      "Failed to create playlist."
    );
  }
};

// =====================================================
// GET PLAYLIST BY ID
// GET /api/playlists/:id
// =====================================================

const getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return sendError(res, 400, "Invalid playlist ID.");
    }

    const playlist = await populatePlaylist(
      Playlist.findById(id)
    ).lean();

    if (!playlist) {
      return sendError(res, 404, "Playlist not found.");
    }

    const userId = getUserId(req);
    const ownerId = playlist.owner?._id || playlist.owner;

    const isOwner = sameId(ownerId, userId);
    const isPublic = playlist.visibility === "public";

    if (!isOwner && !isPublic && !isAdmin(req)) {
      return sendError(res, 403, "This playlist is private.");
    }

    return res.status(200).json({
      success: true,
      playlist,
    });
  } catch (error) {
    console.error("GET PLAYLIST ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to retrieve playlist."
    );
  }
};

// =====================================================
// UPDATE PLAYLIST
// PUT /api/playlists/:id
// =====================================================

const updatePlaylist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(res, 400, "Invalid playlist ID.");
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return sendError(res, 404, "Playlist not found.");
    }

    if (!canModifyPlaylist(req, playlist)) {
      return sendError(
        res,
        403,
        "You do not have permission to update this playlist."
      );
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return sendError(
          res,
          400,
          "Playlist name cannot be empty."
        );
      }

      if (name.length > 100) {
        return sendError(
          res,
          400,
          "Playlist name cannot exceed 100 characters."
        );
      }

      playlist.name = name;
    }

    if (req.body?.description !== undefined) {
      const description = String(
        req.body.description || ""
      ).trim();

      if (description.length > 500) {
        return sendError(
          res,
          400,
          "Playlist description cannot exceed 500 characters."
        );
      }

      playlist.description = description;
    }

    const visibility = normalizeVisibility(req.body);

    if (visibility !== undefined) {
      playlist.visibility = visibility;
    }

    if (req.body?.coverImage !== undefined) {
      playlist.coverImage = String(
        req.body.coverImage || ""
      ).trim();
    }

    await playlist.save();

    const updated = await populatePlaylist(
      Playlist.findById(playlist._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Playlist updated successfully.",
      playlist: updated,
    });
  } catch (error) {
    console.error("UPDATE PLAYLIST ERROR:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "A playlist with this name already exists."
      );
    }

    return sendError(
      res,
      500,
      "Unable to update playlist."
    );
  }
};

// =====================================================
// DELETE PLAYLIST
// DELETE /api/playlists/:id
// =====================================================

const deletePlaylist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(res, 400, "Invalid playlist ID.");
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return sendError(res, 404, "Playlist not found.");
    }

    if (!canModifyPlaylist(req, playlist)) {
      return sendError(
        res,
        403,
        "You do not have permission to delete this playlist."
      );
    }

    await Playlist.deleteOne({ _id: playlist._id });

    return res.status(200).json({
      success: true,
      message: "Playlist deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PLAYLIST ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to delete playlist."
    );
  }
};

// =====================================================
// ADD SONG TO PLAYLIST
// POST /api/playlists/:id/songs
// Body: { songId }
// =====================================================

const addSongToPlaylist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { id } = req.params;
    const { songId } = req.body || {};

    if (!validId(id) || !validId(songId)) {
      return sendError(
        res,
        400,
        "Invalid playlist or song ID."
      );
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return sendError(res, 404, "Playlist not found.");
    }

    if (!canModifyPlaylist(req, playlist)) {
      return sendError(
        res,
        403,
        "You do not have permission to modify this playlist."
      );
    }

    const song = await Song.findById(songId).select("_id");

    if (!song) {
      return sendError(res, 404, "Song not found.");
    }

    const alreadyExists = (playlist.songs || []).some(
      (item) => String(item._id || item) === String(songId)
    );

    if (alreadyExists) {
      return sendError(
        res,
        409,
        "Song is already in this playlist."
      );
    }

    playlist.songs.push(song._id);
    await playlist.save();

    const updated = await populatePlaylist(
      Playlist.findById(playlist._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Song added to playlist successfully.",
      activity: {
        type: "song_added_to_playlist",
        playlistId: String(playlist._id),
        songId: String(song._id),
        occurredAt: new Date(),
      },
      playlist: updated,
    });
  } catch (error) {
    console.error("ADD SONG TO PLAYLIST ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to add song to playlist."
    );
  }
};

// =====================================================
// REMOVE SONG FROM PLAYLIST
// DELETE /api/playlists/:id/songs/:songId
// =====================================================

const removeSongFromPlaylist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { id, songId } = req.params;

    if (!validId(id) || !validId(songId)) {
      return sendError(
        res,
        400,
        "Invalid playlist or song ID."
      );
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return sendError(res, 404, "Playlist not found.");
    }

    if (!canModifyPlaylist(req, playlist)) {
      return sendError(
        res,
        403,
        "You do not have permission to modify this playlist."
      );
    }

    const originalCount = (playlist.songs || []).length;

    playlist.songs = (playlist.songs || []).filter(
      (item) => String(item._id || item) !== String(songId)
    );

    if (playlist.songs.length === originalCount) {
      return sendError(
        res,
        404,
        "Song is not in this playlist."
      );
    }

    await playlist.save();

    const updated = await populatePlaylist(
      Playlist.findById(playlist._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Song removed from playlist successfully.",
      activity: {
        type: "song_removed_from_playlist",
        playlistId: String(playlist._id),
        songId: String(songId),
        occurredAt: new Date(),
      },
      playlist: updated,
    });
  } catch (error) {
    console.error("REMOVE SONG FROM PLAYLIST ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to remove song from playlist."
    );
  }
};

// =====================================================
// REORDER PLAYLIST
// PUT /api/playlists/:id/songs/reorder
// Body: { songIds: [...] }
// Alternative: { fromIndex, toIndex }
// =====================================================

const reorderPlaylist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !validId(String(userId))) {
      return sendError(res, 401, "Authentication required.");
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(res, 400, "Invalid playlist ID.");
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return sendError(res, 404, "Playlist not found.");
    }

    if (!canModifyPlaylist(req, playlist)) {
      return sendError(
        res,
        403,
        "You do not have permission to reorder this playlist."
      );
    }

    const {
      songIds,
      songs,
      fromIndex,
      toIndex,
    } = req.body || {};

    let newOrder = null;

    if (Array.isArray(songIds)) {
      newOrder = songIds;
    } else if (Array.isArray(songs)) {
      newOrder = songs.map((song) => song?._id || song);
    } else if (
      fromIndex !== undefined &&
      toIndex !== undefined &&
      Number.isInteger(Number(fromIndex)) &&
      Number.isInteger(Number(toIndex))
    ) {
      const current = [...(playlist.songs || [])];
      const from = Number(fromIndex);
      const to = Number(toIndex);

      if (
        from < 0 ||
        from >= current.length ||
        to < 0 ||
        to >= current.length
      ) {
        return sendError(
          res,
          400,
          "Invalid playlist positions."
        );
      }

      const [moved] = current.splice(from, 1);
      current.splice(to, 0, moved);

      newOrder = current;
    }

    if (!newOrder) {
      return sendError(
        res,
        400,
        "Provide songIds or valid fromIndex and toIndex."
      );
    }

    if (
      !newOrder.every((item) =>
        validId(String(item?._id || item))
      )
    ) {
      return sendError(
        res,
        400,
        "The reorder request contains an invalid song ID."
      );
    }

    const currentIds = (playlist.songs || []).map(
      (song) => String(song._id || song)
    );

    const requestedIds = newOrder.map(
      (song) => String(song?._id || song)
    );

    if (requestedIds.length !== currentIds.length) {
      return sendError(
        res,
        400,
        "The reordered playlist must contain every existing song exactly once."
      );
    }

    if (new Set(requestedIds).size !== requestedIds.length) {
      return sendError(
        res,
        400,
        "Duplicate songs are not allowed."
      );
    }

    const currentSet = new Set(currentIds);

    if (requestedIds.some((songId) => !currentSet.has(songId))) {
      return sendError(
        res,
        400,
        "Reorder request contains a song that is not in this playlist."
      );
    }

    playlist.songs = requestedIds.map(
      (songId) => new mongoose.Types.ObjectId(songId)
    );

    await playlist.save();

    const updated = await populatePlaylist(
      Playlist.findById(playlist._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Playlist reordered successfully.",
      playlist: updated,
    });
  } catch (error) {
    console.error("REORDER PLAYLIST ERROR:", error);

    return sendError(
      res,
      500,
      "Unable to reorder playlist."
    );
  }
};

// =====================================================
// ES MODULE EXPORTS
// =====================================================

export {
  getMyPlaylists,
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
};
