
const AUDIUS_API = "https://api.audius.co/v1";

/**
 * Audius public API service.
 *
 * Supports:
 * - Trending tracks
 * - Track search
 * - Track details
 * - Streaming URLs
 *
 * Existing locally uploaded songs remain unaffected.
 */

async function audiusRequest(endpoint, params = {}) {
  const url = new URL(`${AUDIUS_API}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Audius API error: ${response.status}`);
  }

  const result = await response.json();

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data ?? [];
}

/**
 * Convert an Audius track into the song format
 * used by LYRICS WAYYY.
 */
export function normalizeAudiusTrack(track) {
  if (!track?.id) return null;

  const artwork =
    track.artwork?.["480x480"] ||
    track.artwork?.["150x150"] ||
    track.artwork?.["1000x1000"] ||
    "";

  const artistName =
    track.user?.name ||
    track.user?.handle ||
    track.artist_name ||
    "Unknown Artist";

  return {
    // Prefix the ID to distinguish external tracks from MongoDB songs.
    _id: `audius:${track.id}`,

    title: track.title || "Untitled Track",
    artist: artistName,

    // Keep artwork and source metadata.
    coverImage: artwork,
    image: artwork,
    albumImage: artwork,

    // Resolved when the track is played.
    audioFile: "",
    source: "audius",
    externalTrackId: String(track.id),

    duration: Number(track.duration) || 0,
    genre: track.genre || "Unknown",
    permalink: track.permalink
      ? `https://audius.co${track.permalink}`
      : "",

    // Preserve the provider's original data for future features.
    externalMetadata: {
      userId: track.user?.id || null,
      handle: track.user?.handle || "",
      artwork,
    },
  };
}

/**
 * Get trending Audius tracks.
 */
export async function getTrendingAudiusTracks({
  limit = 20,
  offset = 0,
  time = "week",
} = {}) {
  const data = await audiusRequest("/tracks/trending", {
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    offset: Math.max(Number(offset) || 0, 0),
    time,
  });

  return data.map(normalizeAudiusTrack).filter(Boolean);
}

/**
 * Search for tracks.
 */
export async function searchAudiusTracks(
  query,
  { limit = 20, offset = 0 } = {},
) {
  const searchTerm = String(query || "").trim();

  if (!searchTerm) return [];

  const data = await audiusRequest("/tracks/search", {
    query: searchTerm,
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    offset: Math.max(Number(offset) || 0, 0),
  });

  return data.map(normalizeAudiusTrack).filter(Boolean);
}

/**
 * Get the stream endpoint for an Audius track.
 *
 * The browser's audio element follows the endpoint's redirect
 * to the actual audio stream.
 */
export function getAudiusStreamUrl(trackId) {
  if (!trackId) return "";

  return `${AUDIUS_API}/tracks/${encodeURIComponent(
    trackId,
  )}/stream`;
}

/**
 * Retrieve current details for a specific track.
 */
export async function getAudiusTrack(trackId) {
  if (!trackId) {
    throw new Error("An Audius track ID is required.");
  }

  const data = await audiusRequest(
    `/tracks/${encodeURIComponent(trackId)}`,
  );

  const track = Array.isArray(data) ? data[0] : data;

  return normalizeAudiusTrack(track);
}
