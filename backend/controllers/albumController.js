import Album from "../models/Album.js";
import Artist from "../models/Artist.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary.js";
// ============================================================
// ALBUM CONTROLLER
// ============================================================
//
// Responsibilities:
//   1. Create albums.
//   2. Retrieve all albums.
//   3. Retrieve albums belonging to the current artist.
//   4. Retrieve an album by ID.
//   5. Update albums with ownership validation.
//   6. Delete albums with ownership validation.
//
// Schema requirements:
//   - title: required album title.
//   - artist: required Artist document ID.
//   - uploadedBy: required User document ID.
//
// Authentication requirements:
//   - authMiddleware must attach the authenticated user to
//     req.user before protected controller functions execute.
//
// ============================================================

// ============================================================
// 1. HELPER FUNCTIONS
// ============================================================

/**

* Extract the authenticated user's ID from the request.
*
* Supports common user ID properties used by authentication
* middleware without trusting a user ID supplied by the client.
*
* @param {Object} req - Express request.
* @returns {string|null} Authenticated user ID.
  */
  const getUserId = (req) =>
  req.user?.id ||
  req.user?._id ||
  req.user?.userId ||
  req.user?.user_id ||
  null;

/**

* Return the authenticated user's normalized role.
*
* @param {Object} req - Express request.
* @returns {string} Normalized role.
  */
  const getRole = (req) =>
  String(req.user?.role || "").trim().toLowerCase();

/**

* Determine whether the authenticated user is an administrator.
*
* @param {Object} req - Express request.
* @returns {boolean}
  */
  const isAdmin = (req) =>
  ["admin", "superadmin", "super_admin"].includes(getRole(req));

/**

* Determine whether the user is permitted to access album
* management functionality.
*
* @param {Object} req - Express request.
* @returns {boolean}
  */
  const isArtistOrAdmin = (req) =>
  ["artist", "admin", "superadmin", "super_admin"].includes(
  getRole(req)
  );

/**

* Convert a Mongoose album document into a plain object and
* remove internal version metadata.
*
* @param {Object|null} album - Album document.
* @returns {Object|null}
  */
  const sanitizeAlbum = (album) => {
  if (!album) return null;

const data =
typeof album.toObject === "function"
? album.toObject()
: { ...album };

delete data.__v;

return data;
};

/**

* Send a consistent API error response.
*
* @param {Object} res - Express response.
* @param {number} status - HTTP status code.
* @param {string} message - Error message.
* @param {Object} extra - Optional additional response fields.
  */
  const sendError = (res, status, message, extra = {}) =>
  res.status(status).json({
  success: false,
  message,
  ...extra,
  });

/**

* Find the artist profile belonging to the authenticated user.
*
* The Artist schema links an artist profile to its owner using
* the Artist.user field.
*
* @param {string} userId - Authenticated user's ID.
* @returns {Promise<Object|null>}
  */
  const findArtistForUser = async (userId) =>
  Artist.findOne({ user: userId });

/**

* Validate and normalize an optional release date.
*
* @param {*} value - Supplied date.
* @returns {Date|null}
* @throws {Error} If the supplied date is invalid.
  */
  const parseReleaseDate = (value) => {
  if (value === undefined || value === null || value === "") {
  return null;
  }

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
throw new Error("Invalid release date.");
}

return date;
};

/**

* Resolve the cover-image path produced by the upload middleware.
*
* IMPORTANT:
* This path assumes uploadAlbum stores files in uploads/albums.
* Adjust it if your upload middleware uses another destination.
*
* @param {Object} file - Multer uploaded file.
* @returns {string}
  */
const getUploadedCoverUrl = async (file) => {
  if (!file) return "";

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "lyricswayyy/images",
      resource_type: "image",
    });

    return result.secure_url;
  } finally {
    if (file.path) {
      await fs.promises.unlink(file.path).catch(() => {});
    }
  }
};

/**

* Delete a previously uploaded album cover from disk.
*
* This helper only deletes files located inside the configured
* uploads/albums directory. Remote URLs and unrelated paths are
* not deleted.
*
* @param {string} imagePath - Stored image path.
  */
  const deleteAlbumCoverFile = async (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return;

// Do not attempt to delete external image URLs.
if (/^https?:\/\//i.test(imagePath)) return;

// Support paths stored as /uploads/albums/filename.ext.
const normalizedPath = imagePath.replace(/\\/g, "/");
const prefix = "/uploads/albums/";

if (!normalizedPath.startsWith(prefix)) return;

const filename = path.basename(normalizedPath);

// Prevent unexpected path traversal or empty filenames.
if (!filename || filename === "." || filename === "..") return;

const filePath = path.resolve(
process.cwd(),
"uploads",
"albums",
filename
);

const uploadDirectory = path.resolve(
process.cwd(),
"uploads",
"albums"
);

// Ensure the target remains inside the expected directory.
if (path.dirname(filePath) !== uploadDirectory) return;

try {
await fs.promises.unlink(filePath);
} catch (error) {
// A missing file should not invalidate an otherwise successful
// album update or deletion.
if (error.code !== "ENOENT") {
console.error("ALBUM COVER DELETE ERROR:", error.message);
}
}
};

// ============================================================
// 2. CREATE ALBUM
// ============================================================
//
// Route:
//   POST /api/albums
//
// Middleware:
//   authMiddleware
//   artistAccess
//   uploadAlbum.single("coverImage")
//
// Required database fields:
//   title
//   artist
//   uploadedBy
//
// ============================================================

export const createAlbum = async (req, res) => {
try {
// --------------------------------------------------------
// A. Validate authentication and authorization.
// --------------------------------------------------------

 
const userId = getUserId(req);

if (!userId || !mongoose.isValidObjectId(userId)) {
  return sendError(res, 401, "Authentication required.");
}

if (!isArtistOrAdmin(req)) {
  return sendError(
    res,
    403,
    "Only artists or administrators can create albums."
  );
}

// --------------------------------------------------------
// B. Read and validate submitted form fields.
// --------------------------------------------------------

const {
  title,
  name,
  description,
  genre,
  releaseDate,
  artist: requestedArtistId,
} = req.body;

// Accept both "title" and "name" from existing frontend forms,
// but always save the value using the schema's "title" field.
const albumTitle = String(title || name || "").trim();

if (!albumTitle) {
  return sendError(res, 400, "Album title is required.");
}

// --------------------------------------------------------
// C. Resolve the correct artist profile.
// --------------------------------------------------------

let artistDoc = null;

if (getRole(req) === "artist") {
  // An artist can create albums only for their own profile.
  artistDoc = await findArtistForUser(userId);

  if (!artistDoc) {
    return sendError(
      res,
      403,
      "Your artist profile could not be found."
    );
  }

  // Reject attempts to assign the album to another artist.
  if (
    requestedArtistId &&
    (
      !mongoose.isValidObjectId(requestedArtistId) ||
      String(requestedArtistId) !== String(artistDoc._id)
    )
  ) {
    return sendError(
      res,
      403,
      "You can only create albums for your own artist profile."
    );
  }
} else {
  // Administrators must provide a valid artist ID or have
  // an artist profile associated with their own account.
  if (requestedArtistId) {
    if (!mongoose.isValidObjectId(requestedArtistId)) {
      return sendError(res, 400, "Invalid artist ID.");
    }

    artistDoc = await Artist.findById(requestedArtistId);
  } else {
    artistDoc = await findArtistForUser(userId);
  }

  if (!artistDoc) {
    return sendError(
      res,
      400,
      "A valid artist profile is required to create this album."
    );
  }
}

// --------------------------------------------------------
// D. Validate the optional release date.
// --------------------------------------------------------

let parsedReleaseDate;

try {
  parsedReleaseDate = parseReleaseDate(releaseDate);
} catch {
  return sendError(res, 400, "Invalid release date.");
}

// --------------------------------------------------------
// E. Prepare the uploaded cover image.
// --------------------------------------------------------

// Multer stores an uploaded file in req.file.
// req.body.coverImage is not the uploaded file itself.
const coverImage = await getUploadedCoverUrl(req.file);

// --------------------------------------------------------
// F. Create the album with all required schema fields.
// --------------------------------------------------------

const album = await Album.create({
  title: albumTitle,
  artist: artistDoc._id,
  uploadedBy: userId,
  description: String(description || "").trim(),
  genre: String(genre || "").trim(),
  coverImage,
  ...(parsedReleaseDate
    ? { releaseDate: parsedReleaseDate }
    : {}),
});

// Return useful artist information to the frontend.
await album.populate("artist", "name image verified");

return res.status(201).json({
  success: true,
  message: "Album created successfully.",
  album: sanitizeAlbum(album),
});
 

} catch (error) {
console.error("CREATE ALBUM ERROR:", error);

 
// Mongoose reports missing or invalid schema fields here.
if (error.name === "ValidationError") {
  return sendError(res, 400, "Album validation failed.", {
    error: error.message,
  });
}

// Include the underlying error only in development.
return res.status(500).json({
  success: false,
  message: "Unable to create album.",
  ...(process.env.NODE_ENV === "development"
    ? { error: error.message }
    : {}),
});
 

}
};

// ============================================================
// 3. GET ALL ALBUMS
// ============================================================
//
// Route:
//   GET /api/albums
//
// Query parameters:
//   page   - Page number.
//   limit  - Results per page.
//   search - Search by album title.
//   genre  - Filter by genre.
//   artist - Filter by artist profile ID.
//
// ============================================================

export const getAlbums = async (req, res) => {
try {
const {
page = 1,
limit = 50,
search = "",
genre,
artist,
} = req.query;

 
// Keep pagination values within safe limits.
const pageNumber = Math.max(Number(page) || 1, 1);
const limitNumber = Math.min(
  Math.max(Number(limit) || 50, 1),
  100
);

const query = {};

// --------------------------------------------------------
// A. Search album titles.
// --------------------------------------------------------

const searchText = String(search || "").trim();

if (searchText) {
  // Escape regex metacharacters so user input is treated
  // as literal search text rather than a regular expression.
  const escapedSearch = searchText.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  query.title = {
    $regex: escapedSearch,
    $options: "i",
  };
}

// --------------------------------------------------------
// B. Apply optional genre filtering.
// --------------------------------------------------------

if (genre) {
  query.genre = String(genre).trim();
}

// --------------------------------------------------------
// C. Apply optional artist filtering.
// --------------------------------------------------------

if (artist) {
  if (!mongoose.isValidObjectId(artist)) {
    return sendError(res, 400, "Invalid artist ID.");
  }

  query.artist = artist;
}

// --------------------------------------------------------
// D. Fetch the requested page and total result count.
// --------------------------------------------------------

const skip = (pageNumber - 1) * limitNumber;

const [albums, total] = await Promise.all([
  Album.find(query)
    .populate("artist", "name image verified")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean(),

  Album.countDocuments(query),
]);

return res.status(200).json({
  success: true,
  albums,
  count: albums.length,
  total,
  page: pageNumber,
  pages: Math.ceil(total / limitNumber),
});
 

} catch (error) {
console.error("GET ALBUMS ERROR:", error);

 
return sendError(res, 500, "Unable to retrieve albums.");
 

}
};

// ============================================================
// 4. GET MY ALBUMS
// ============================================================
//
// Route:
//   GET /api/albums/my
//
// Behavior:
//   - Artists receive albums belonging to their artist profile.
//   - Administrators can view all albums.
//   - Other authorized account types can view albums they uploaded.
//
// NOTE:
// The Album schema uses "uploadedBy", not "createdBy".
//
// ============================================================

export const getMyAlbums = async (req, res) => {
try {
const userId = getUserId(req);

 
if (!userId || !mongoose.isValidObjectId(userId)) {
  return sendError(res, 401, "Authentication required.");
}

let query = {};

// --------------------------------------------------------
// A. Retrieve albums belonging to the current artist.
// --------------------------------------------------------

if (getRole(req) === "artist") {
  const artistDoc = await findArtistForUser(userId);

  if (!artistDoc) {
    return sendError(
      res,
      404,
      "Your artist profile could not be found."
    );
  }

  query = { artist: artistDoc._id };
} else if (isAdmin(req)) {
  // Administrators can see every album.
  query = {};
} else {
  // Use the ownership field defined in Album.js.
  query = { uploadedBy: userId };
}

// --------------------------------------------------------
// B. Fetch the albums and their associated artist profiles.
// --------------------------------------------------------

const albums = await Album.find(query)
  .populate("artist", "name image verified")
  .sort({ createdAt: -1 });

return res.status(200).json({
  success: true,
  albums: albums.map(sanitizeAlbum),
  count: albums.length,
});
 

} catch (error) {
console.error("GET MY ALBUMS ERROR:", error);

 
return sendError(
  res,
  500,
  "Unable to retrieve your albums."
);
 

}
};

// ============================================================
// 5. GET ALBUM BY ID
// ============================================================
//
// Route:
//   GET /api/albums/:id
//
// ============================================================

export const getAlbumById = async (req, res) => {
try {
const { id } = req.params;

 
// Validate the album ID before querying MongoDB.
if (!mongoose.isValidObjectId(id)) {
  return sendError(res, 400, "Invalid album ID.");
}

// Retrieve the album and its associated artist.
const album = await Album.findById(id)
  .populate("artist", "name image verified");

if (!album) {
  return sendError(res, 404, "Album not found.");
}

return res.status(200).json({
  success: true,
  album: sanitizeAlbum(album),
});
 

} catch (error) {
console.error("GET ALBUM ERROR:", error);

 
return sendError(res, 500, "Unable to retrieve album.");
 

}
};

// ============================================================
// 6. UPDATE ALBUM
// ============================================================
//
// Route:
//   PUT /api/albums/:id
//
// Authorization:
//   - Artists can update only albums assigned to their profile.
//   - Administrators can update albums.
//   - Artist reassignment is restricted to administrators.
//
// ============================================================

export const updateAlbum = async (req, res) => {
try {
const userId = getUserId(req);
const { id } = req.params;

 
// --------------------------------------------------------
// A. Validate authentication and the album ID.
// --------------------------------------------------------

if (!userId || !mongoose.isValidObjectId(userId)) {
  return sendError(res, 401, "Authentication required.");
}

if (!mongoose.isValidObjectId(id)) {
  return sendError(res, 400, "Invalid album ID.");
}

if (!isArtistOrAdmin(req)) {
  return sendError(res, 403, "Album management access required.");
}

// --------------------------------------------------------
// B. Retrieve the existing album.
// --------------------------------------------------------

const album = await Album.findById(id);

if (!album) {
  return sendError(res, 404, "Album not found.");
}

// --------------------------------------------------------
// C. Verify ownership or administrator permission.
// --------------------------------------------------------

let allowed = isAdmin(req);

if (!allowed && getRole(req) === "artist") {
  const artistDoc = await findArtistForUser(userId);

  allowed = Boolean(
    artistDoc &&
    album.artist &&
    String(album.artist) === String(artistDoc._id)
  );
}

if (!allowed) {
  return sendError(
    res,
    403,
    "You are not allowed to update this album."
  );
}

// --------------------------------------------------------
// D. Update only supported album fields.
// --------------------------------------------------------

const { title, name, description, genre, releaseDate } =
  req.body;

// Support both title and name from existing frontend forms.
if (title !== undefined || name !== undefined) {
  const newTitle = String(title ?? name ?? "").trim();

  if (!newTitle) {
    return sendError(res, 400, "Album title is required.");
  }

  album.title = newTitle;
}

if (description !== undefined) {
  album.description = String(description).trim();
}

if (genre !== undefined) {
  album.genre = String(genre).trim();
}

if (releaseDate !== undefined) {
  try {
    const parsedDate = parseReleaseDate(releaseDate);

    if (parsedDate) {
      album.releaseDate = parsedDate;
    } else {
      album.set("releaseDate", undefined);
    }
  } catch {
    return sendError(res, 400, "Invalid release date.");
  }
}

// --------------------------------------------------------
// E. Allow only administrators to reassign the artist.
// --------------------------------------------------------

if (isAdmin(req) && req.body.artist !== undefined) {
  const requestedArtistId = String(req.body.artist || "").trim();

  if (!requestedArtistId) {
    return sendError(
      res,
      400,
      "Album must be assigned to a valid artist."
    );
  }

  if (!mongoose.isValidObjectId(requestedArtistId)) {
    return sendError(res, 400, "Invalid artist ID.");
  }

  const artistDoc = await Artist.findById(requestedArtistId);

  if (!artistDoc) {
    return sendError(res, 404, "Artist profile not found.");
  }

  album.artist = artistDoc._id;
}

// --------------------------------------------------------
// F. Replace the cover image if a new file was uploaded.
// --------------------------------------------------------

if (req.file) {
  const oldCoverImage = album.coverImage;

  album.coverImage = await getUploadedCoverUrl(req.file);

  // Persist the new image path before deleting the old file.
  await album.save();

  if (oldCoverImage !== album.coverImage) {
    await deleteAlbumCoverFile(oldCoverImage);
  }
} else {
  // Mongoose validates required fields when saving.
  await album.save();
}

await album.populate("artist", "name image verified");

return res.status(200).json({
  success: true,
  message: "Album updated successfully.",
  album: sanitizeAlbum(album),
});
 

} catch (error) {
console.error("UPDATE ALBUM ERROR:", error);

 
if (error.name === "ValidationError") {
  return sendError(res, 400, "Album validation failed.", {
    error: error.message,
  });
}

return res.status(500).json({
  success: false,
  message: "Unable to update album.",
  ...(process.env.NODE_ENV === "development"
    ? { error: error.message }
    : {}),
});
 

}
};

// ============================================================
// 7. DELETE ALBUM
// ============================================================
//
// Route:
//   DELETE /api/albums/:id
//
// Authorization:
//   - Artists can delete only albums assigned to their profile.
//   - Administrators can delete albums.
//
// ============================================================

export const deleteAlbum = async (req, res) => {
try {
const userId = getUserId(req);
const { id } = req.params;

 
// --------------------------------------------------------
// A. Validate authentication and album ID.
// --------------------------------------------------------

if (!userId || !mongoose.isValidObjectId(userId)) {
  return sendError(res, 401, "Authentication required.");
}

if (!mongoose.isValidObjectId(id)) {
  return sendError(res, 400, "Invalid album ID.");
}

if (!isArtistOrAdmin(req)) {
  return sendError(res, 403, "Album management access required.");
}

// --------------------------------------------------------
// B. Find the album.
// --------------------------------------------------------

const album = await Album.findById(id);

if (!album) {
  return sendError(res, 404, "Album not found.");
}

// --------------------------------------------------------
// C. Verify ownership or administrator permission.
// --------------------------------------------------------

let allowed = isAdmin(req);

if (!allowed && getRole(req) === "artist") {
  const artistDoc = await findArtistForUser(userId);

  allowed = Boolean(
    artistDoc &&
    album.artist &&
    String(album.artist) === String(artistDoc._id)
  );
}

if (!allowed) {
  return sendError(
    res,
    403,
    "You are not allowed to delete this album."
  );
}

// --------------------------------------------------------
// D. Delete the album document.
// --------------------------------------------------------

const oldCoverImage = album.coverImage;

await Album.findByIdAndDelete(id);

// --------------------------------------------------------
// E. Remove the associated cover image when it is a local
//    file stored in uploads/albums.
// --------------------------------------------------------

await deleteAlbumCoverFile(oldCoverImage);

return res.status(200).json({
  success: true,
  message: "Album deleted successfully.",
});
 

} catch (error) {
console.error("DELETE ALBUM ERROR:", error);

 
return res.status(500).json({
  success: false,
  message: "Unable to delete album.",
  ...(process.env.NODE_ENV === "development"
    ? { error: error.message }
    : {}),
});
 

}
};
