// Import Express to create the API route.
import express from "express";

// Import Axios to send HTTP requests to the Jamendo API.
import axios from "axios";

// Create an Express router for external music endpoints.
const router = express.Router();

/**
 * GET /api/external-music/search?q=jazz
 *
 * Searches Jamendo for tracks matching the supplied query.
 */
router.get("/search", async (req, res) => {
  try {
    // Read the search query from the URL and remove extra spaces.
    const query = String(req.query.q || "").trim();

    // Return a client error if the search query is empty.
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Enter a song name or artist.",
      });
    }

    // Read the Jamendo Client ID from the backend environment variables.
    const clientId = process.env.JAMENDO_CLIENT_ID;

    // Stop if the Client ID has not been configured.
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: "Jamendo Client ID is not configured.",
      });
    }

    // Request matching tracks from Jamendo.
    const response = await axios.get(
      "https://api.jamendo.com/v3.0/tracks/",
      {
        // Axios converts these values into URL query parameters.
        params: {
          client_id: clientId,
          format: "json",
          search: query,
          limit: 20,
          audioformat: "mp31",
        },

        // Prevent the request from waiting indefinitely.
        timeout: 15000,
      }
    );

    // Store the API response data.
    const data = response.data;

    // Check whether Jamendo reports that the request succeeded.
    if (data.headers?.status !== "success") {
      return res.status(502).json({
        success: false,
        message:
          data.headers?.error_message ||
          "Jamendo search failed.",
      });
    }

    // Convert Jamendo's track objects into a consistent format
    // that is easier for the LYRICS WAYYY frontend to use.
    const tracks = (data.results || []).map((track) => ({
      // Convert the track ID to a string for consistent handling.
      id: String(track.id),

      // Track title and artist name.
      title: track.name,
      artist: track.artist_name,

      // Some tracks may not have an album name.
      album: track.album_name || "",

      // Duration is returned in seconds.
      duration: Number(track.duration) || 0,

      // Album artwork URL; use an empty string if unavailable.
      image: track.album_image || track.image || "",

      // Stream URL used by the frontend audio player.
      audioUrl: track.audio || "",

      // License URL for checking the track's permitted uses.
      licenseUrl: track.license_ccurl || "",

      // Indicates whether Jamendo allows downloading this track.
      downloadAllowed: track.audiodownload_allowed === true,

      // Identifies where this track came from.
      source: "jamendo",
    }));

    // Send the formatted tracks back to the frontend.
    return res.json({
      success: true,
      count: tracks.length,
      tracks,
    });
  } catch (error) {
    // Log the detailed error on the backend for debugging.
    console.error(
      "Jamendo API error:",
      error.response?.data || error.message
    );

    // Send a safe error response to the frontend.
    return res.status(502).json({
      success: false,
      message: "Unable to retrieve music from Jamendo.",
    });
  }
});

// Export the router so the main Express server can use it.
export default router;