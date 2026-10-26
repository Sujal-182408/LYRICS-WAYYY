import mongoose from "mongoose";

import Collection from "../models/Collection.js";
import Song from "../models/Song.js";
import Artist from "../models/Artist.js";

// ============================================================
// HELPERS
// ============================================================

const getUserId = (req) =>
  req.user?.id ||
  req.user?._id ||
  req.user?.userId ||
  req.user?.user_id ||
  null;

const getRole = (req) =>
  String(req.user?.role || "").toLowerCase();

const isAdmin = (req) =>
  ["superadmin", "admin"].includes(getRole(req));

const isArtist = (req) =>
  getRole(req) === "artist";

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

// ============================================================
// GET ARTIST PROFILE FROM USER
// ============================================================

const getActorArtist = async (userId) => {
  if (!userId) {
    return null;
  }

  return Artist.findOne({
    user: userId,
  });
};

// ============================================================
// COLLECTION POPULATION
// ============================================================
//
// Collection:
//   artist     -> Artist
//   uploadedBy -> User
//   songs      -> Song
//
// Song:
//   artist -> Artist
//   album  -> STRING
//
// Never populate Song.album.
//

const collectionPopulate = (query) =>
  query
    .populate(
      "artist",
      "name image bio followers verified"
    )
    .populate(
      "uploadedBy",
      "name email role profileImage"
    )
    .populate({
      path: "songs",
      select:
        "title artist album genre duration coverImage audioFile createdAt",
      populate: {
        path: "artist",
        select: "name image verified followers",
      },
    });

// ============================================================
// CREATE COLLECTION
// ============================================================

export const createCollection = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const {
      name,
      description = "",
      visible = true,
      coverImage = "",
    } = req.body || {};

    const collectionName = String(name || "").trim();

    if (!collectionName) {
      return sendError(
        res,
        400,
        "Collection name is required."
      );
    }

    if (collectionName.length > 100) {
      return sendError(
        res,
        400,
        "Collection name cannot exceed 100 characters."
      );
    }

    const descriptionText = String(
      description || ""
    ).trim();

    if (descriptionText.length > 1000) {
      return sendError(
        res,
        400,
        "Collection description is too long."
      );
    }

    // --------------------------------------------------------
    // ARTIST PROFILE
    // --------------------------------------------------------

    let artist = null;

    if (isArtist(req)) {
      artist = await getActorArtist(userId);

      if (!artist) {
        return sendError(
          res,
          404,
          "Artist profile not found."
        );
      }
    }

    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    const duplicateFilter = {
      name: collectionName,
      uploadedBy: userId,
    };

    if (artist) {
      duplicateFilter.artist = artist._id;
    }

    const existing = await Collection.findOne(
      duplicateFilter
    ).lean();

    if (existing) {
      return sendError(
        res,
        409,
        "A collection with this name already exists."
      );
    }

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const collection = await Collection.create({
      name: collectionName,
      description: descriptionText,
      artist: artist?._id || null,
      uploadedBy: userId,
      songs: [],
      visible: visible !== false,
      coverImage: String(coverImage || "").trim(),
    });

    const populated = await collectionPopulate(
      Collection.findById(collection._id)
    ).lean();

    return res.status(201).json({
      success: true,
      message: "Collection created successfully.",
      collection: populated,
    });
  } catch (error) {
    console.error(
      "CREATE COLLECTION ERROR:",
      error
    );

    if (error?.code === 11000) {
      return sendError(
        res,
        409,
        "A collection with this name already exists."
      );
    }

    return sendError(
      res,
      500,
      "Unable to create collection."
    );
  }
};

// ============================================================
// GET ALL PUBLIC COLLECTIONS
// ============================================================

export const getCollections = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 20,
    } = req.query || {};

    const pageNumber = Math.max(
      1,
      Number(page) || 1
    );

    const limitNumber = Math.min(
      100,
      Math.max(1, Number(limit) || 20)
    );

    const filter = {
      visible: true,
    };

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    const searchText = String(search || "").trim();

    if (searchText) {
      const escapedSearch = searchText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    // --------------------------------------------------------
    // QUERY
    // --------------------------------------------------------

    const collectionsQuery = collectionPopulate(
      Collection.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) * limitNumber
        )
        .limit(limitNumber)
    );

    const [collections, total] = await Promise.all([
      collectionsQuery.lean(),
      Collection.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: collections.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(total / limitNumber),
      collections,
    });
  } catch (error) {
    console.error(
      "GET COLLECTIONS ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve collections."
    );
  }
};

// ============================================================
// GET MY COLLECTIONS
// ============================================================

export const getMyCollections = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    let filter = {
      uploadedBy: userId,
    };

    // --------------------------------------------------------
    // ARTIST
    // --------------------------------------------------------

    if (isArtist(req)) {
      const artist = await getActorArtist(userId);

      if (artist) {
        filter = {
          $or: [
            {
              uploadedBy: userId,
            },
            {
              artist: artist._id,
            },
          ],
        };
      }
    }

    const collections = await collectionPopulate(
      Collection.find(filter).sort({
        createdAt: -1,
      })
    ).lean();

    return res.status(200).json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error(
      "GET MY COLLECTIONS ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve your collections."
    );
  }
};

// ============================================================
// GET COLLECTION BY ID
// ============================================================

export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return sendError(
        res,
        400,
        "Invalid collection ID."
      );
    }

    const collection = await collectionPopulate(
      Collection.findById(id)
    ).lean();

    if (!collection) {
      return sendError(
        res,
        404,
        "Collection not found."
      );
    }

    // --------------------------------------------------------
    // PRIVATE COLLECTION
    // --------------------------------------------------------

    if (collection.visible === false) {
      const userId = getUserId(req);

      const ownerId =
        collection.uploadedBy?._id ||
        collection.uploadedBy;

      const isOwner =
        userId &&
        ownerId &&
        String(ownerId) === String(userId);

      if (!isOwner && !isAdmin(req)) {
        return sendError(
          res,
          403,
          "This collection is private."
        );
      }
    }

    return res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error(
      "GET COLLECTION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve collection."
    );
  }
};

// ============================================================
// GET AVAILABLE SONGS
// ============================================================

export const getAvailableSongsForCollection = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const {
      collectionId,
      search = "",
      artist,
      page = 1,
      limit = 50,
    } = req.query || {};

    const pageNumber = Math.max(
      1,
      Number(page) || 1
    );

    const limitNumber = Math.min(
      100,
      Math.max(1, Number(limit) || 50)
    );

    let collection = null;

    // --------------------------------------------------------
    // COLLECTION ACCESS
    // --------------------------------------------------------

    if (collectionId) {
      if (!validId(collectionId)) {
        return sendError(
          res,
          400,
          "Invalid collection ID."
        );
      }

      collection = await Collection.findById(
        collectionId
      ).lean();

      if (!collection) {
        return sendError(
          res,
          404,
          "Collection not found."
        );
      }

      const ownerId = collection.uploadedBy;

      const isOwner =
        ownerId &&
        String(ownerId) === String(userId);

      let artistOwner = false;

      if (isArtist(req)) {
        const actorArtist = await getActorArtist(
          userId
        );

        artistOwner = Boolean(
          actorArtist &&
          collection.artist &&
          String(collection.artist) ===
            String(actorArtist._id)
        );
      }

      if (
        !isOwner &&
        !artistOwner &&
        !isAdmin(req)
      ) {
        return sendError(
          res,
          403,
          "You do not have permission to modify this collection."
        );
      }
    }

    // --------------------------------------------------------
    // SONG FILTER
    // --------------------------------------------------------

    const filter = {};

    const searchText = String(
      search || ""
    ).trim();

    if (searchText) {
      const escapedSearch = searchText.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        escapedSearch,
        "i"
      );

      filter.$or = [
        {
          title: regex,
        },
        {
          genre: regex,
        },
      ];
    }

    if (artist) {
      if (!validId(artist)) {
        return sendError(
          res,
          400,
          "Invalid artist ID."
        );
      }

      filter.artist = artist;
    }

    // --------------------------------------------------------
    // EXCLUDE EXISTING SONGS
    // --------------------------------------------------------

    if (
      collection &&
      Array.isArray(collection.songs) &&
      collection.songs.length
    ) {
      filter._id = {
        $nin: collection.songs,
      };
    }

    const [songs, total] = await Promise.all([
      Song.find(filter)
        .populate(
          "artist",
          "name image verified followers"
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) * limitNumber
        )
        .limit(limitNumber)
        .lean(),

      Song.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: songs.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(total / limitNumber),
      songs,
    });
  } catch (error) {
    console.error(
      "GET AVAILABLE SONGS ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to retrieve available songs."
    );
  }
};

// ============================================================
// UPDATE COLLECTION
// ============================================================

export const updateCollection = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(
        res,
        400,
        "Invalid collection ID."
      );
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return sendError(
        res,
        404,
        "Collection not found."
      );
    }

    // --------------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------------

    let authorized = isAdmin(req);

    if (
      collection.uploadedBy &&
      String(collection.uploadedBy) === String(userId)
    ) {
      authorized = true;
    }

    if (!authorized && isArtist(req)) {
      const artist = await getActorArtist(userId);

      if (
        artist &&
        collection.artist &&
        String(collection.artist) ===
          String(artist._id)
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return sendError(
        res,
        403,
        "You do not have permission to update this collection."
      );
    }

    // --------------------------------------------------------
    // ALLOWED FIELDS ONLY
    // --------------------------------------------------------

    if (req.body?.name !== undefined) {
      const name = String(
        req.body.name
      ).trim();

      if (!name) {
        return sendError(
          res,
          400,
          "Collection name cannot be empty."
        );
      }

      if (name.length > 100) {
        return sendError(
          res,
          400,
          "Collection name cannot exceed 100 characters."
        );
      }

      collection.name = name;
    }

    if (req.body?.description !== undefined) {
      const description = String(
        req.body.description || ""
      ).trim();

      if (description.length > 1000) {
        return sendError(
          res,
          400,
          "Collection description is too long."
        );
      }

      collection.description = description;
    }

    if (req.body?.visible !== undefined) {
      collection.visible =
        req.body.visible === true ||
        req.body.visible === "true";
    }

    if (req.body?.coverImage !== undefined) {
      collection.coverImage = String(
        req.body.coverImage || ""
      ).trim();
    }

    await collection.save();

    const updated = await collectionPopulate(
      Collection.findById(collection._id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully.",
      collection: updated,
    });
  } catch (error) {
    console.error(
      "UPDATE COLLECTION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to update collection."
    );
  }
};

// ============================================================
// DELETE COLLECTION
// ============================================================

export const deleteCollection = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const { id } = req.params;

    if (!validId(id)) {
      return sendError(
        res,
        400,
        "Invalid collection ID."
      );
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return sendError(
        res,
        404,
        "Collection not found."
      );
    }

    // --------------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------------

    let authorized = isAdmin(req);

    if (
      collection.uploadedBy &&
      String(collection.uploadedBy) === String(userId)
    ) {
      authorized = true;
    }

    if (!authorized && isArtist(req)) {
      const artist = await getActorArtist(userId);

      if (
        artist &&
        collection.artist &&
        String(collection.artist) ===
          String(artist._id)
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return sendError(
        res,
        403,
        "You do not have permission to delete this collection."
      );
    }

    await Collection.deleteOne({
      _id: collection._id,
    });

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE COLLECTION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to delete collection."
    );
  }
};

// ============================================================
// ADD SONG TO COLLECTION
// ============================================================

export const addSongToCollection = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const {
      id,
      songId,
    } = req.params;

    if (!validId(id) || !validId(songId)) {
      return sendError(
        res,
        400,
        "Invalid collection or song ID."
      );
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return sendError(
        res,
        404,
        "Collection not found."
      );
    }

    // --------------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------------

    let authorized = isAdmin(req);

    if (
      collection.uploadedBy &&
      String(collection.uploadedBy) === String(userId)
    ) {
      authorized = true;
    }

    if (!authorized && isArtist(req)) {
      const artist = await getActorArtist(userId);

      if (
        artist &&
        collection.artist &&
        String(collection.artist) ===
          String(artist._id)
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return sendError(
        res,
        403,
        "You do not have permission to modify this collection."
      );
    }

    // --------------------------------------------------------
    // SONG
    // --------------------------------------------------------

    const song = await Song.findById(songId);

    if (!song) {
      return sendError(
        res,
        404,
        "Song not found."
      );
    }

    // --------------------------------------------------------
    // DUPLICATE
    // --------------------------------------------------------

    const alreadyAdded =
      Array.isArray(collection.songs) &&
      collection.songs.some(
        (existingSong) =>
          String(existingSong) === String(songId)
      );

    if (alreadyAdded) {
      return sendError(
        res,
        409,
        "Song is already in this collection."
      );
    }

    if (!Array.isArray(collection.songs)) {
      collection.songs = [];
    }

    collection.songs.push(song._id);

    await collection.save();

    const updated = await collectionPopulate(
      Collection.findById(id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Song added to collection successfully.",
      collection: updated,
    });
  } catch (error) {
    console.error(
      "ADD SONG TO COLLECTION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to add song to collection."
    );
  }
};

// ============================================================
// REMOVE SONG FROM COLLECTION
// ============================================================

export const removeSongFromCollection = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return sendError(
        res,
        401,
        "Authentication required."
      );
    }

    const {
      id,
      songId,
    } = req.params;

    if (!validId(id) || !validId(songId)) {
      return sendError(
        res,
        400,
        "Invalid collection or song ID."
      );
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return sendError(
        res,
        404,
        "Collection not found."
      );
    }

    // --------------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------------

    let authorized = isAdmin(req);

    if (
      collection.uploadedBy &&
      String(collection.uploadedBy) === String(userId)
    ) {
      authorized = true;
    }

    if (!authorized && isArtist(req)) {
      const artist = await getActorArtist(userId);

      if (
        artist &&
        collection.artist &&
        String(collection.artist) ===
          String(artist._id)
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return sendError(
        res,
        403,
        "You do not have permission to modify this collection."
      );
    }

    // --------------------------------------------------------
    // REMOVE SONG
    // --------------------------------------------------------

    collection.songs = (
      collection.songs || []
    ).filter(
      (song) => String(song) !== String(songId)
    );

    await collection.save();

    const updated = await collectionPopulate(
      Collection.findById(id)
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Song removed from collection successfully.",
      collection: updated,
    });
  } catch (error) {
    console.error(
      "REMOVE SONG FROM COLLECTION ERROR:",
      error
    );

    return sendError(
      res,
      500,
      "Unable to remove song from collection."
    );
  }
};