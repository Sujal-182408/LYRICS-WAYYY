
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
import { motion } from "framer-motion";

import {
  TrendingUp,
  Mic2,
  Disc3,
  Headphones,
  Clock3,
  ListMusic,
  Play,
  Music2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Radio,
  ArrowUpRight,
  Music,
  Heart,
  Waves,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/api";
import { usePlayer } from "../context/PlayerContext";

// ============================================================
// CONFIGURATION
// ============================================================

const API = String(BASE_URL || "").replace(/\/+$/, "");
const REQUEST_TIMEOUT = 12000;
const MAX_ITEMS = 12;

// ============================================================
// IMAGE URL HELPER
// ============================================================

const getImage = (value) => {
  if (!value || typeof value !== "string") return "";

  const image = value.trim();

  if (
    /^(https?:\/\/|data:image\/|blob:)/i.test(image)
  ) {
    return image;
  }

  const cleanPath = image
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  return API ? `${API}/${cleanPath}` : `/${cleanPath}`;
};

// ============================================================
// API RESPONSE HELPERS
// ============================================================

const getArray = (response, preferredKey) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  if (preferredKey && Array.isArray(data?.[preferredKey])) {
    return data[preferredKey];
  }

  const candidates = [
    data?.songs,
    data?.artists,
    data?.albums,
    data?.playlists,
    data?.collections,
    data?.history,
    data?.listeningHistory,
    data?.recentlyPlayed,
    data?.items,
    data?.results,
    data?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

const getId = (item) =>
  item?._id || item?.id || null;

const getArtistId = (item) => {
  const artist = item?.artist;

  if (artist && typeof artist === "object") {
    return artist._id || artist.id || null;
  }

  if (item?.artistId) return item.artistId;
  if (item?.artist_id) return item.artist_id;

  if (Array.isArray(item?.artists) && item.artists.length > 0) {
    const firstArtist = item.artists[0];

    if (firstArtist && typeof firstArtist === "object") {
      return firstArtist._id || firstArtist.id || null;
    }

    return firstArtist || null;
  }

  return null;
};

const getArtistName = (item) => {
  if (typeof item?.artist === "string") {
    return item.artist;
  }

  return (
    item?.artist?.stageName ||
    item?.artist?.stage_name ||
    item?.artist?.name ||
    item?.artist?.username ||
    item?.artistName ||
    item?.artist_name ||
    item?.artists?.[0]?.stageName ||
    item?.artists?.[0]?.name ||
    "Unknown Artist"
  );
};

const getArtistDisplayName = (artist) =>
  artist?.stageName ||
  artist?.stage_name ||
  artist?.name ||
  artist?.username ||
  "Unknown Artist";

const getDate = (item) =>
  item?.releaseDate ||
  item?.release_date ||
  item?.createdAt ||
  item?.created_at ||
  item?.uploadedAt ||
  item?.updatedAt ||
  null;

const getPlayCount = (item) =>
  Number(
    item?.playCount ??
      item?.plays ??
      item?.totalPlays ??
      item?.play_count ??
      item?.streams ??
      0,
  ) || 0;

const formatCount = (value) => {
  const count = Number(value || 0);

  if (!Number.isFinite(count)) return "0";
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }

  return String(count);
};

const getRecentSong = (entry) =>
  entry?.song || entry?.track || entry?.songId || entry;

const deduplicateSongs = (items = []) => {
  const seen = new Set();

  return items.filter((song) => {
    const id = getId(song);

    if (id == null) return false;

    const normalizedId = String(id);

    if (seen.has(normalizedId)) return false;

    seen.add(normalizedId);
    return true;
  });
};

const getSongImage = (song) =>
  getImage(
    song?.coverImage ||
      song?.cover ||
      song?.thumbnail ||
      song?.album?.coverImage ||
      song?.album?.image ||
      song?.artist?.image,
  );

const getArtistImage = (artist) =>
  getImage(
    artist?.image ||
      artist?.profileImage ||
      artist?.profile_image ||
      artist?.avatar ||
      artist?.photo,
  );

const getAlbumImage = (album) =>
  getImage(
    album?.coverImage ||
      album?.cover ||
      album?.image ||
      album?.thumbnail,
  );

const isNewRelease = (item) => {
  const date = getDate(item);

  if (!date) return false;

  const timestamp = new Date(date).getTime();

  if (!Number.isFinite(timestamp)) return false;

  const age = (Date.now() - timestamp) / 86400000;

  return age >= 0 && age <= 30;
};

// ============================================================
// UNIQUE REACT KEY HELPER
// ============================================================

const getUniqueKey = (item, section, index) => {
  const id = getId(item);

  const identifier =
    id != null && String(id).trim()
      ? String(id)
      : item?.title || item?.name || "item";

  return `${section}-${identifier}-${index}`;
};

// ============================================================
// THEME
// ============================================================

const raised = {
  background: "var(--theme-surface, #252933)",
  boxShadow:
    "7px 7px 16px var(--theme-shadowDark, #0f141a), -5px -5px 14px var(--theme-shadowLight, #343b49)",
};

const inset = {
  background: "var(--theme-background, #252933)",
  boxShadow:
    "inset 4px 4px 9px var(--theme-shadowDark, #0f141a), inset -4px -4px 9px var(--theme-shadowLight, #343b49)",
};

const primaryText = {
  color: "var(--theme-text, #eef0f6)",
};

const mutedText = {
  color: "var(--theme-textMuted, #a3adbd)",
};

const primaryColor = "var(--theme-primary, #8c7cf7)";
const secondaryColor = "var(--theme-secondary, #2bd4c4)";

// ============================================================
// IMAGE WITH FALLBACK
// ============================================================

const MediaImage = ({
  src,
  alt = "",
  fallback: Fallback = Music2,
  className = "",
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className}`}
        style={{
          background: "var(--theme-background, #252933)",
          color: primaryColor,
        }}
      >
        <Fallback size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
};

// ============================================================
// SECTION HEADING
// ============================================================

const SectionHeading = ({
  icon: Icon,
  title,
  subtitle,
  action,
}) => (
  <div className="mb-5 flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ ...raised, color: primaryColor }}
      >
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <h2
          className="text-lg font-bold tracking-tight sm:text-xl"
          style={primaryText}
        >
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm" style={mutedText}>
            {subtitle}
          </p>
        )}
      </div>
    </div>

    {action}
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({ message }) => (
  <div
    className="flex min-h-36 flex-col items-center justify-center rounded-2xl p-6 text-center"
    style={inset}
  >
    <Music2 size={30} className="mb-3" style={{ color: primaryColor }} />

    <p className="max-w-md text-sm leading-6" style={mutedText}>
      {message}
    </p>
  </div>
);

// ============================================================
// SONG CARD
// ============================================================

const SongCard = ({
  song,
  songs,
  index,
  onPlay,
  currentSong,
  playing,
}) => {
  const id = getId(song);
  const currentId = getId(currentSong);

  const isCurrent =
    Boolean(id && currentId) &&
    String(id) === String(currentId);

  const isPlaying = isCurrent && Boolean(playing);

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group w-40 shrink-0 rounded-2xl p-3 sm:w-48"
      style={raised}
    >
      <button
        type="button"
        onClick={() => onPlay(song, index, songs)}
        className="relative mb-3 block aspect-square w-full overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2"
        style={{ "--tw-ring-color": primaryColor }}
        aria-label={`Play ${song?.title || "song"}`}
      >
        <MediaImage
          src={getSongImage(song)}
          alt={song?.title || "Song cover"}
          fallback={Music2}
        />

        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(180deg, transparent 35%, rgba(0,0,0,.65) 100%)",
          }}
        />

        <span
          className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
            isPlaying
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          }`}
          style={{
            background: primaryColor,
            color: "#252933",
            boxShadow: "0 6px 18px #0005",
          }}
        >
          {isPlaying ? (
            <Waves size={20} />
          ) : (
            <Play size={19} fill="currentColor" />
          )}
        </span>

        {isPlaying && (
          <span
            className="absolute left-3 top-3 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(0,0,0,.65)",
              color: secondaryColor,
            }}
          >
            Playing
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onPlay(song, index, songs)}
        className="block w-full truncate text-left text-sm font-semibold focus-visible:outline-none focus-visible:underline"
        style={primaryText}
      >
        {song?.title || "Untitled Song"}
      </button>

      <p className="mt-1 truncate text-xs" style={mutedText}>
        {getArtistName(song)}
      </p>

      {getPlayCount(song) > 0 && (
        <p
          className="mt-2 flex items-center gap-1 text-[11px]"
          style={mutedText}
        >
          <Headphones size={12} />
          {formatCount(getPlayCount(song))} plays
        </p>
      )}
    </motion.article>
  );
};

// ============================================================
// ARTIST CARD — CLICK TO OPEN ARTIST PROFILE
// ============================================================

const ArtistCard = ({ artist, onClick }) => {
  const artistId = getId(artist);
  const artistName = getArtistDisplayName(artist);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="w-36 shrink-0 rounded-2xl p-4 text-center"
      style={raised}
    >
      <button
        type="button"
        onClick={() => onClick(artist)}
        disabled={!artistId}
        aria-label={`View ${artistName}'s profile`}
        className="w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ "--tw-ring-color": primaryColor }}
      >
        <div
          className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full p-1"
          style={inset}
        >
          <div className="h-full w-full overflow-hidden rounded-full">
            <MediaImage
              src={getArtistImage(artist)}
              alt={artistName}
              fallback={Mic2}
              className="rounded-full"
            />
          </div>
        </div>

        <h3 className="truncate text-sm font-semibold" style={primaryText}>
          {artistName}
        </h3>

        <p className="mt-1 text-xs" style={mutedText}>
          {formatCount(artist?.followers)} followers
        </p>

        <span
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: secondaryColor }}
        >
          View profile
          <ArrowUpRight size={13} />
        </span>
      </button>
    </motion.article>
  );
};

// ============================================================
// ALBUM CARD — CLICK TO PLAY ALBUM SONGS
// ============================================================

const AlbumCard = ({ album, onPlayAlbum }) => {
  const albumName = album?.title || album?.name || "Untitled Album";

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group w-40 shrink-0 rounded-2xl p-3 sm:w-48"
      style={raised}
    >
      <button
        type="button"
        onClick={() => onPlayAlbum(album)}
        className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2"
        style={{ "--tw-ring-color": primaryColor }}
        aria-label={`Play songs from ${albumName}`}
      >
        <div className="relative mb-3 aspect-square overflow-hidden rounded-xl">
          <MediaImage
            src={getAlbumImage(album)}
            alt={`${albumName} cover`}
            fallback={Disc3}
          />

          <div
            className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: primaryColor,
                color: "#252933",
                boxShadow: "0 6px 18px #0005",
              }}
            >
              <Play size={20} fill="currentColor" />
            </span>
          </div>
        </div>

        <h3 className="truncate text-sm font-semibold" style={primaryText}>
          {albumName}
        </h3>

        <p className="mt-1 truncate text-xs" style={mutedText}>
          {getArtistName(album)}
        </p>

        <span
          className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
          style={{ ...inset, color: secondaryColor }}
        >
          <Play size={13} fill="currentColor" />
          Play album
        </span>
      </button>
    </motion.article>
  );
};

// ============================================================
// PLAYLIST / COLLECTION CARD
// ============================================================

const PlaylistCard = ({ playlist, collection = false }) => {
  const id = getId(playlist);

  const path = collection
    ? "/collections"
    : id
      ? `/playlists/${id}`
      : "/playlists";

  const image = getImage(
    playlist?.coverImage || playlist?.cover || playlist?.image,
  );

  return (
    <Link
      to={path}
      className="group flex min-w-0 items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-1"
      style={raised}
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <MediaImage
          src={image}
          alt={playlist?.name || playlist?.title || ""}
          fallback={collection ? Music2 : ListMusic}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold" style={primaryText}>
          {playlist?.name || playlist?.title || "Untitled"}
        </h3>

        <p className="mt-1 text-xs" style={mutedText}>
          {Array.isArray(playlist?.songs)
            ? `${playlist.songs.length} songs`
            : collection
              ? "Music collection"
              : "Playlist"}
        </p>
      </div>

      <ArrowUpRight
        size={18}
        className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        style={{ color: secondaryColor }}
      />
    </Link>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const Suggestions = () => {
  const navigate = useNavigate();

  const { playSong, currentSong, playing } = usePlayer();

  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [collections, setCollections] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // FETCH DATA
  // ----------------------------------------------------------

  const fetchSuggestions = useCallback(
    async ({ background = false } = {}) => {
      if (!API) {
        setError("API URL is missing. Check config/api.js.");
        setLoading(false);
        return;
      }

      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const fetchEndpoint = async (path) => {
        try {
          const response = await axios.get(`${API}${path}`, {
            headers,
            timeout: REQUEST_TIMEOUT,
          });

          return getArray(response);
        } catch (requestError) {
          console.warn(
            `[Suggestions] Request failed: ${path}`,
            requestError?.response?.status || requestError.message,
          );

          return null;
        }
      };

      try {
        const [
          songResults,
          artistResults,
          albumResults,
          playlistResults,
          collectionResults,
          recentResults,
        ] = await Promise.all([
          fetchEndpoint("/api/songs"),
          fetchEndpoint("/api/artists"),
          fetchEndpoint("/api/albums"),
          fetchEndpoint("/api/playlists"),
          fetchEndpoint("/api/collections"),
          token
            ? fetchEndpoint("/api/profile/listening")
            : Promise.resolve([]),
        ]);

        const safeSongs = songResults ?? [];
        const safeArtists = artistResults ?? [];
        const safeAlbums = albumResults ?? [];
        const safePlaylists = playlistResults ?? [];
        const safeCollections = collectionResults ?? [];
        const safeRecent = recentResults ?? [];

        setSongs(safeSongs);
        setArtists(safeArtists);
        setAlbums(safeAlbums);
        setPlaylists(safePlaylists);
        setCollections(safeCollections);

        const normalizedRecent = safeRecent
  .filter(Boolean)
  .map((entry) => {
    const song = getRecentSong(entry);

    return {
      ...entry,
      song:
        song && typeof song === "object"
          ? song
          : null,
    };
  })
  .filter((entry) => entry.song && getId(entry.song));

// Remove duplicate song IDs while preserving their original order.
const uniqueRecent = [];
const seenRecentIds = new Set();

for (const entry of normalizedRecent) {
  const songId = String(getId(entry.song));

  if (seenRecentIds.has(songId)) continue;

  seenRecentIds.add(songId);
  uniqueRecent.push(entry);
}

setRecentSongs(uniqueRecent);

        const hasAnyData =
          safeSongs.length > 0 ||
          safeArtists.length > 0 ||
          safeAlbums.length > 0 ||
          safePlaylists.length > 0 ||
          safeCollections.length > 0 ||
          safeRecent.length > 0;

        if (!hasAnyData) {
          setError(
            "No data is available. Check your backend connection and API routes.",
          );
        }
      } catch (requestError) {
        console.error("[Suggestions] Loading failed:", requestError);
        setError("Unable to load suggestions. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // ----------------------------------------------------------
  // DERIVED LISTS
  // ----------------------------------------------------------

  const trendingSongs = useMemo(
    () =>
      [...songs]
        .sort((a, b) => getPlayCount(b) - getPlayCount(a))
        .slice(0, MAX_ITEMS),
    [songs],
  );

  const newReleases = useMemo(() => {
    const sorted = [...songs].sort((a, b) => {
      const dateA = new Date(getDate(a) || 0).getTime();
      const dateB = new Date(getDate(b) || 0).getTime();

      return (
        (Number.isFinite(dateB) ? dateB : 0) -
        (Number.isFinite(dateA) ? dateA : 0)
      );
    });

    const recent = sorted.filter(isNewRelease);

    return (recent.length ? recent : sorted).slice(0, MAX_ITEMS);
  }, [songs]);

  const recommendedSongs = useMemo(() => {
    const recentIds = new Set(
      recentSongs
        .map((entry) => getId(getRecentSong(entry)))
        .filter(Boolean)
        .map(String),
    );

    const unseen = songs.filter(
      (song) => !recentIds.has(String(getId(song) || "")),
    );

    return (unseen.length ? unseen : songs).slice(0, MAX_ITEMS);
  }, [songs, recentSongs]);

  const popularArtists = useMemo(
    () =>
      [...artists]
        .sort(
          (a, b) =>
            Number(b?.followers || 0) - Number(a?.followers || 0),
        )
        .slice(0, MAX_ITEMS),
    [artists],
  );

  const sortedAlbums = useMemo(
    () =>
      [...albums]
        .sort((a, b) => {
          const dateA = new Date(getDate(a) || 0).getTime();
          const dateB = new Date(getDate(b) || 0).getTime();

          return (
            (Number.isFinite(dateB) ? dateB : 0) -
            (Number.isFinite(dateA) ? dateA : 0)
          );
        })
        .slice(0, 8),
    [albums],
  );

  const featuredSong = trendingSongs[0] || songs[0] || null;

  // ----------------------------------------------------------
  // DUPLICATE-ID DIAGNOSTICS
  // ----------------------------------------------------------

  useEffect(() => {
    const checkDuplicates = (items, listName) => {
      const seen = new Set();
      const duplicates = new Set();

      items.forEach((item) => {
        const id = getId(item);

        if (id == null) return;

        const normalizedId = String(id);

        if (seen.has(normalizedId)) {
          duplicates.add(normalizedId);
        }

        seen.add(normalizedId);
      });

      if (duplicates.size > 0) {
        console.warn(
          `[Suggestions] Duplicate IDs in ${listName}:`,
          [...duplicates],
        );
      }
    };

    checkDuplicates(trendingSongs, "Trending Songs");
    checkDuplicates(newReleases, "New Releases");
    checkDuplicates(recommendedSongs, "Recommended For You");
    checkDuplicates(
      recentSongs.map(getRecentSong).filter(Boolean),
      "Recently Played",
    );
  }, [
    trendingSongs,
    newReleases,
    recommendedSongs,
    recentSongs,
  ]);

  // ----------------------------------------------------------
  // PLAY SONG
  // ----------------------------------------------------------

 const playSelectedSong = (song, index, list = songs) => {
  if (!song) return;

  const songId = song._id || song.id;

  if (!songId) {
    console.error("Cannot play song: missing song ID", song);
    return;
  }

  if (typeof playSong !== "function") {
    console.error("playSong is not available in PlayerContext");
    return;
  }

  const songList = Array.isArray(list) && list.length > 0
    ? list
    : [song];

  const songIndex = songList.findIndex(
    (item) => String(item._id || item.id) === String(songId)
  );

  playSong(
    song,
    songIndex >= 0 ? songIndex : 0,
    songList
  );
};

  // ----------------------------------------------------------
  // OPEN ARTIST PROFILE
  // ----------------------------------------------------------

  const openArtistProfile = useCallback(
    (artist) => {
      const artistId = getId(artist);

      if (!artistId) {
        setError("This artist does not have a valid profile ID.");
        return;
      }

      setError("");
      navigate(`/artists/${artistId}`);
    },
    [navigate],
  );

  // ----------------------------------------------------------
  // MATCH ALBUM SONGS
  // ----------------------------------------------------------

  const getAlbumSongs = useCallback(
    (album) => {
      const albumId = getId(album);
      const albumName = album?.title || album?.name || "";

      const albumArtistId = getArtistId(album);
      const albumArtistName = getArtistName(album);

      return songs.filter((song) => {
        const songAlbum = song?.album;

        const songAlbumId =
          songAlbum && typeof songAlbum === "object"
            ? getId(songAlbum)
            : song?.albumId ||
              song?.album_id ||
              (typeof songAlbum === "string" ? songAlbum : null);

        const songAlbumName =
          songAlbum && typeof songAlbum === "object"
            ? songAlbum.title || songAlbum.name
            : typeof songAlbum === "string"
              ? songAlbum
              : song?.albumName || song?.album_name;

        const matchesAlbumId =
          Boolean(albumId && songAlbumId) &&
          String(albumId) === String(songAlbumId);

        const matchesAlbumName =
          Boolean(albumName && songAlbumName) &&
          String(albumName).trim().toLowerCase() ===
            String(songAlbumName).trim().toLowerCase();

        // Some APIs expose album as an ID string. Do not match an
        // unrelated song just because its album title is missing.
        if (matchesAlbumId || matchesAlbumName) {
          if (albumArtistId) {
            const songArtistId = getArtistId(song);

            if (
              songArtistId &&
              String(songArtistId) !== String(albumArtistId)
            ) {
              return false;
            }
          } else if (
            albumArtistName &&
            albumArtistName !== "Unknown Artist"
          ) {
            const songArtistName = getArtistName(song);

            if (
              songArtistName !== "Unknown Artist" &&
              songArtistName.trim().toLowerCase() !==
                albumArtistName.trim().toLowerCase()
            ) {
              return false;
            }
          }

          return true;
        }

        return false;
      });
    },
    [songs],
  );

  // ----------------------------------------------------------
  // PLAY ALBUM
  // ----------------------------------------------------------

  const playAlbum = useCallback(
    (album) => {
      const albumName = album?.title || album?.name || "Untitled Album";
      const albumSongs = getAlbumSongs(album);

      if (!albumSongs.length) {
        setError(
          `No songs could be matched to "${albumName}". Check the album references returned by your song and album APIs.`,
        );
        return;
      }

      setError("");
      playSelectedSong(albumSongs[0], 0, albumSongs);
    },
    [getAlbumSongs, playSelectedSong],
  );

  // ----------------------------------------------------------
  // PLAY SONG LIST
  // ----------------------------------------------------------

  const playSongList = useCallback(
    (list, requestedIndex = 0) => {
      const playableSongs = list.filter((song) => getId(song));

      if (!playableSongs.length) {
        setError("No playable songs are available for this selection.");
        return;
      }

      const safeIndex = Math.max(
        0,
        Math.min(requestedIndex, playableSongs.length - 1),
      );

      playSelectedSong(
        playableSongs[safeIndex],
        safeIndex,
        playableSongs,
      );
    },
    [playSelectedSong],
  );

  // ----------------------------------------------------------
  // SONG SECTION
  // ----------------------------------------------------------

  const renderSongSection = (
    title,
    subtitle,
    Icon,
    list,
    sectionKey,
  ) => (
    <section key={sectionKey} className="mb-10">
      <SectionHeading
        icon={Icon}
        title={title}
        subtitle={subtitle}
      />

      {list.length === 0 ? (
        <EmptyState message="No songs available yet." />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4 pt-1">
          {list.map((song, index) => (
            <SongCard
              key={getUniqueKey(song, sectionKey, index)}
              song={song}
              songs={list}
              index={index}
              onPlay={playSelectedSong}
              currentSong={currentSong}
              playing={playing}
            />
          ))}
        </div>
      )}
    </section>
  );

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <main
      className="min-h-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{
        background: "var(--theme-background, #252933)",
        color: "var(--theme-text, #eef0f6)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* HERO */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mb-10 overflow-hidden rounded-[28px] p-6 sm:p-9 lg:p-10"
          style={raised}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: primaryColor }}
          />

          <div
            className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full opacity-15 blur-3xl"
            style={{ background: secondaryColor }}
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_280px]">
            <div className="relative min-w-0">
              {/* EYEBROW */}
              <div
                className="mb-5 inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.2em] sm:text-xs"
                style={{
                  ...inset,
                  color: secondaryColor,
                }}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    background: "var(--theme-surface, #252933)",
                    boxShadow:
                      "3px 3px 7px var(--theme-shadowDark, #0f141a), -2px -2px 6px var(--theme-shadowLight, #343b49)",
                  }}
                >
                  <Sparkles size={14} />
                </span>

                Your personal music universe
              </div>

              {/* HEADLINE */}
              <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                <span className="block" style={primaryText}>
                  Find your
                </span>

                <span
                  className="mt-2 block"
                  style={{
                    background: `linear-gradient(100deg, ${primaryColor}, ${secondaryColor})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  next favorite sound.
                </span>
              </h1>

              {/* DESCRIPTION */}
              <p
                className="mt-5 max-w-lg text-sm leading-7 sm:text-base"
                style={mutedText}
              >
                Your next obsession is one play away. Discover trending
                tracks, explore incredible artists, and find the sounds
                that feel like you.
              </p>

              {/* PLAYLIST AND COLLECTION LINKS */}
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  to="/playlists"
                  className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 sm:p-5"
                  style={raised}
                >
                  <div
                    className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
                    style={{ background: primaryColor }}
                  />

                  <div
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
                    style={{
                      background: "var(--theme-background, #252933)",
                      boxShadow:
                        "inset 3px 3px 7px var(--theme-shadowDark, #0f141a), inset -3px -3px 7px var(--theme-shadowLight, #343b49)",
                      color: primaryColor,
                    }}
                  >
                    <ListMusic size={24} strokeWidth={1.8} />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <h3
                      className="text-sm font-bold sm:text-base"
                      style={primaryText}
                    >
                      Your Playlists
                    </h3>

                    <p className="mt-1 text-xs leading-5" style={mutedText}>
                      Your music, your mood
                    </p>
                  </div>

                  <ChevronRight
                    size={19}
                    className="relative shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: primaryColor }}
                  />
                </Link>

                <Link
                  to="/collections"
                  className="group relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 sm:p-5"
                  style={raised}
                >
                  <div
                    className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
                    style={{ background: secondaryColor }}
                  />

                  <div
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
                    style={{
                      background: "var(--theme-background, #252933)",
                      boxShadow:
                        "inset 3px 3px 7px var(--theme-shadowDark, #0f141a), inset -3px -3px 7px var(--theme-shadowLight, #343b49)",
                      color: secondaryColor,
                    }}
                  >
                    <Heart size={23} strokeWidth={1.8} />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <h3
                      className="text-sm font-bold sm:text-base"
                      style={primaryText}
                    >
                      Collections
                    </h3>

                    <p className="mt-1 text-xs leading-5" style={mutedText}>
                      Music worth keeping
                    </p>
                  </div>

                  <ChevronRight
                    size={19}
                    className="relative shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: secondaryColor }}
                  />
                </Link>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchSuggestions({ background: true })}
                  disabled={loading || refreshing}
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: `linear-gradient(110deg, ${primaryColor}, var(--theme-primary, #8c7cf7))`,
                    color: "#101018",
                    boxShadow: "0 7px 20px rgba(0,0,0,.2)",
                  }}
                >
                  <RefreshCw
                    size={16}
                    className={loading || refreshing ? "animate-spin" : ""}
                  />

                  {refreshing ? "Refreshing..." : "Refresh Discoveries"}
                </button>

                <span
                  className="inline-flex items-center gap-2 text-xs"
                  style={mutedText}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: secondaryColor,
                      boxShadow: `0 0 10px ${secondaryColor}`,
                    }}
                  />

                  Made for your next discovery
                </span>
              </div>
            </div>

            {/* FEATURED TRACK */}
            {featuredSong ? (
              <motion.div
                whileHover={{ y: -4 }}
                className="relative mx-auto w-full max-w-[280px] rounded-3xl p-4"
                style={inset}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                    style={{ color: secondaryColor }}
                  >
                    <Radio size={15} />
                    Featured track
                  </span>

                  <Sparkles size={17} style={{ color: primaryColor }} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const list = trendingSongs.length
                      ? trendingSongs
                      : songs;

                    const index = list.findIndex(
                      (song) =>
                        String(getId(song)) ===
                        String(getId(featuredSong)),
                    );

                    playSongList(list, Math.max(index, 0));
                  }}
                  className="block aspect-square w-full overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2"
                  style={{ "--tw-ring-color": primaryColor }}
                  aria-label={`Play ${featuredSong.title || "featured song"}`}
                >
                  <MediaImage
                    src={getSongImage(featuredSong)}
                    alt={featuredSong.title || "Featured track"}
                    fallback={Disc3}
                  />
                </button>

                <h2
                  className="mt-4 truncate text-base font-bold"
                  style={primaryText}
                >
                  {featuredSong.title || "Featured Song"}
                </h2>

                <p className="mt-1 truncate text-sm" style={mutedText}>
                  {getArtistName(featuredSong)}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className="flex items-center gap-1.5 text-xs"
                    style={mutedText}
                  >
                    <Headphones size={14} />
                    {formatCount(getPlayCount(featuredSong))} plays
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const list = trendingSongs.length
                        ? trendingSongs
                        : songs;

                      const index = list.findIndex(
                        (song) =>
                          String(getId(song)) ===
                          String(getId(featuredSong)),
                      );

                      playSongList(list, Math.max(index, 0));
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: primaryColor,
                      color: "#171520",
                      "--tw-ring-color": secondaryColor,
                    }}
                    aria-label={`Play ${featuredSong.title || "featured song"}`}
                  >
                    <Play size={19} fill="currentColor" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div
                className="hidden min-h-48 items-center justify-center rounded-3xl lg:flex"
                style={inset}
              >
                <div className="text-center">
                  <Music size={42} style={{ color: primaryColor }} />

                  <p className="mt-3 text-sm" style={mutedText}>
                    Your next favorite is waiting.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.header>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm"
            style={{
              ...raised,
              border: "1px solid #e58a8a55",
            }}
          >
            <AlertCircle size={19} className="shrink-0 text-red-400" />

            <span className="min-w-0 flex-1" style={primaryText}>
              {error}
            </span>

            <button
              type="button"
              onClick={() => fetchSuggestions({ background: true })}
              className="font-bold"
              style={{ color: secondaryColor }}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="space-y-10" aria-label="Loading suggestions">
            {[1, 2, 3].map((section) => (
              <section key={section}>
                <div
                  className="mb-5 h-10 w-52 animate-pulse rounded-xl"
                  style={inset}
                />

                <div className="flex gap-4 overflow-hidden pb-3">
                  {[1, 2, 3, 4, 5].map((card) => (
                    <div
                      key={card}
                      className="w-40 shrink-0 rounded-2xl p-3 sm:w-48"
                      style={raised}
                    >
                      <div
                        className="aspect-square animate-pulse rounded-xl"
                        style={inset}
                      />

                      <div
                        className="mt-4 h-3 animate-pulse rounded"
                        style={inset}
                      />

                      <div
                        className="mt-2 h-3 w-2/3 animate-pulse rounded"
                        style={inset}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <>
            {/* 1. TRENDING SONGS */}
            {renderSongSection(
              "Trending Songs",
              "The tracks getting attention in your library",
              TrendingUp,
              trendingSongs,
              "trending",
            )}

            {/* 2. POPULAR ARTISTS */}
            <section className="mb-10">
              <SectionHeading
                icon={Mic2}
                title="Popular Artists"
                subtitle="Discover the artists behind your favorite sounds"
              />

              {popularArtists.length === 0 ? (
                <EmptyState message="Artists will appear here when available." />
              ) : (
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4 pt-1">
                  {popularArtists.map((artist, index) => (
                    <ArtistCard
                      key={getUniqueKey(artist, "artist", index)}
                      artist={artist}
                      onClick={openArtistProfile}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 3. NEW RELEASES */}
            <section className="mb-10">
              <SectionHeading
                icon={Disc3}
                title="New Releases"
                subtitle="Fresh additions to your music collection"
              />

              {sortedAlbums.length > 0 && (
                <div className="mb-5 flex gap-4 overflow-x-auto px-1 pb-3 pt-1">
                  {sortedAlbums.map((album, index) => (
                    <AlbumCard
                      key={getUniqueKey(album, "album", index)}
                      album={album}
                      onPlayAlbum={playAlbum}
                    />
                  ))}
                </div>
              )}

              {newReleases.length === 0 ? (
                <EmptyState message="New releases will appear here when available." />
              ) : (
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4 pt-1">
                  {newReleases.map((song, index) => (
                    <SongCard
                      key={getUniqueKey(song, "release", index)}
                      song={song}
                      songs={newReleases}
                      index={index}
                      onPlay={playSelectedSong}
                      currentSong={currentSong}
                      playing={playing}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 4. RECOMMENDED */}
            {renderSongSection(
              "Recommended For You",
              "A few more tracks worth discovering",
              Headphones,
              recommendedSongs,
              "recommended",
            )}

            {/* 5. RECENTLY PLAYED */}
            <section className="mb-10">
              <SectionHeading
                icon={Clock3}
                title="Recently Played"
                subtitle="Pick up where you left off"
                action={
                  <Link
                    to="/history"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors hover:opacity-80 sm:px-4 sm:text-sm"
                    style={{
                      ...raised,
                      color: secondaryColor,
                    }}
                  >
                    View All
                    <ChevronRight size={16} />
                  </Link>
                }
              />

              {recentSongs.length === 0 ? (
                <EmptyState message="Your recent listening history will appear here when the history API returns your tracks." />
              ) : (
                <div className="grid grid-cols-2 gap-4 px-1 pb-4 pt-1 sm:grid-cols-3 lg:grid-cols-6">
                  {recentSongs
                    .map(getRecentSong)
                    .filter(
                      (song) =>
                        song &&
                        typeof song === "object" &&
                        getId(song),
                    )
                    .slice(0, 6)
                    .map((song, index, list) => (
                      <SongCard
                        key={getUniqueKey(song, "recent", index)}
                        song={song}
                        songs={list}
                        index={index}
                        onPlay={playSelectedSong}
                        currentSong={currentSong}
                        playing={playing}
                      />
                    ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default Suggestions;
