
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

/**
 * Search YouTube for music videos.
 * Returns video information for displaying and embedding in the app.
 */
export async function searchYouTubeMusic(query, maxResults = 12) {
  if (!API_KEY) {
    throw new Error(
      "YouTube API key is missing. Check the VITE_YOUTUBE_API_KEY setting in your frontend .env file."
    );
  }

  if (!query || !query.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query.trim(),
    type: "video",
    videoEmbeddable: "true",
    videoCategoryId: "10",
    maxResults: String(Math.min(Math.max(maxResults, 1), 25)),
    key: API_KEY,
  });

  const response = await fetch(
    `${YOUTUBE_API_URL}/search?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Failed to search YouTube music."
    );
  }

  return (data.items || [])
    .filter((item) => item?.id?.videoId)
    .map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet?.title || "Untitled video",
      artist: item.snippet?.channelTitle || "Unknown artist",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "",
      publishedAt: item.snippet?.publishedAt || null,
    }));
}
