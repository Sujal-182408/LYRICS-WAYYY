import mongoose from "mongoose";
import Favorite from "../models/Favorite.js";
import Song from "../models/Song.js";

const getSongPopulate = () => ({
path: "song",
select:
"title artist album genre duration coverImage audioFile createdAt",
populate: [
{
path: "artist",
select: "name image verified",
},
{
path: "album",
select: "title coverImage",
},
],
});

// =====================================================
// GET /api/profile/favorites
// Get the authenticated user's favorites
// =====================================================

export const getMyFavorites = async (req, res) => {
try {
const userId = req.user?._id || req.user?.id;

 
if (!userId || !mongoose.isValidObjectId(userId)) {
  return res.status(401).json({
    success: false,
    message: "Authentication required.",
  });
}

const favorites = await Favorite.find({ user: userId })
  .populate(getSongPopulate())
  .sort({ createdAt: -1 })
  .lean();

return res.status(200).json({
  success: true,
  count: favorites.length,
  favorites,
});
 

} catch (error) {
console.error("getMyFavorites error:", error);

 
return res.status(500).json({
  success: false,
  message: "Failed to load favorites.",
});
 

}
};

// =====================================================
// POST /api/profile/favorites
// Add a song to the authenticated user's favorites
// =====================================================

export const addFavorite = async (req, res) => {
try {
const userId = req.user?._id || req.user?.id;
const songId = req.body?.songId || req.body?.song;

 
if (!userId || !mongoose.isValidObjectId(userId)) {
  return res.status(401).json({
    success: false,
    message: "Authentication required.",
  });
}

if (!songId || !mongoose.isValidObjectId(songId)) {
  return res.status(400).json({
    success: false,
    message: "A valid song ID is required.",
  });
}

// Confirm that the requested song exists.
const songExists = await Song.exists({ _id: songId });

if (!songExists) {
  return res.status(404).json({
    success: false,
    message: "Song not found.",
  });
}

// Avoid creating duplicate favorites.
const existingFavorite = await Favorite.findOne({
  user: userId,
  song: songId,
});

if (existingFavorite) {
  return res.status(200).json({
    success: true,
    message: "Song is already in favorites.",
    favorite: existingFavorite,
    alreadyFavorited: true,
  });
}

const favorite = await Favorite.create({
  user: userId,
  song: songId,
});

const populatedFavorite = await Favorite.findById(favorite._id)
  .populate(getSongPopulate())
  .lean();

return res.status(201).json({
  success: true,
  message: "Song added to favorites.",
  favorite: populatedFavorite,
  alreadyFavorited: false,
});
 

} catch (error) {
// Handle a duplicate-key race if the schema has a unique index.
if (error?.code === 11000) {
return res.status(200).json({
success: true,
message: "Song is already in favorites.",
alreadyFavorited: true,
});
}

 
console.error("addFavorite error:", error);

return res.status(500).json({
  success: false,
  message: "Failed to add song to favorites.",
});
 

}
};

// =====================================================
// DELETE /api/profile/favorites/:songId
// Remove a song from the authenticated user's favorites
// =====================================================

export const removeFavorite = async (req, res) => {
try {
const userId = req.user?._id || req.user?.id;
const { songId } = req.params;

 
if (!userId || !mongoose.isValidObjectId(userId)) {
  return res.status(401).json({
    success: false,
    message: "Authentication required.",
  });
}

if (!mongoose.isValidObjectId(songId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid song ID.",
  });
}

const favorite = await Favorite.findOneAndDelete({
  user: userId,
  song: songId,
});

if (!favorite) {
  return res.status(404).json({
    success: false,
    message: "Favorite not found.",
  });
}

return res.status(200).json({
  success: true,
  message: "Song removed from favorites.",
});
 

} catch (error) {
console.error("removeFavorite error:", error);

 
return res.status(500).json({
  success: false,
  message: "Failed to remove favorite.",
});
 

}
};
