import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Disc3,
  ExternalLink,
  Heart,
  Loader2,
  Music2,
  Pause,
  Play,
  Radio,
  Search,
  Share2,
  Shuffle,
  Users,
  AlertCircle,
  Globe,
  Camera,
  RefreshCw,
} from "lucide-react";

import { usePlayer } from "../context/PlayerContext";
import { BASE_URL } from "../config/api";

/* =========================================================
   API AND MEDIA HELPERS
========================================================= */

const API = String(BASE_URL || "").replace(/\/+$/, "");

const mediaUrl = (value) => {
  if (!value || typeof value !== "string") return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  return `${API}/${value.replace(/^\/+/, "")}`;
};

const idOf = (x) => String(x?._id || x?.id || x?.artistId || x?.songId || "");

const nameOf = (x) =>
  typeof x === "string" ? x : x?.name || x?.artistName || x?.username || "";

const artistIdOf = (x) =>
  typeof x?.artist === "string"
    ? x.artist
    : idOf(x?.artist) || String(x?.artistId || x?.artist_id || "");

const audioOf = (song) =>
  song?.audioFile ||
  song?.audioUrl ||
  song?.audioURL ||
  song?.audio ||
  song?.fileUrl ||
  song?.url ||
  song?.src ||
  "";

const coverOf = (item) =>
  mediaUrl(
    item?.coverImage ||
      item?.cover ||
      item?.thumbnail ||
      item?.image ||
      item?.imageUrl ||
      item?.artwork ||
      item?.album?.coverImage,
  );

const number = (value) => {
  const n = Number(value) || 0;

  if (n >= 1e6) {
    return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (n >= 1e3) {
    return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return n.toLocaleString();
};

const duration = (value) => {
  if (value === "" || value == null) return "--:--";

  let seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }

  if (typeof value === "string" && value.includes(":")) {
    const parts = value.split(":").map(Number);

    if (!parts.every(Number.isFinite)) return "--:--";

    seconds = parts.reduce((total, part) => total * 60 + part, 0);
  }

  return `${Math.floor(seconds / 60)}:${String(
    Math.floor(seconds % 60),
  ).padStart(2, "0")}`;
};

const listFrom = (payload, keys) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  for (const key of keys) {
    if (Array.isArray(payload?.data?.[key])) {
      return payload.data[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const dateLabel = (value) => {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
};

/* =========================================================
   THEME-AWARE CLASS HELPERS

   Uses your existing ThemeContext CSS variables.
   No additional theme state or context is needed.
========================================================= */

const surfaceClass =
  "bg-[var(--theme-surface)] border border-[var(--theme-border)]";

const raisedShadow =
  "shadow-[7px_7px_16px_var(--theme-shadowDark),-7px_-7px_16px_var(--theme-shadowLight)]";

const raisedShadowSmall =
  "shadow-[5px_5px_10px_var(--theme-shadowDark),-5px_-5px_10px_var(--theme-shadowLight)]";

const insetShadow =
  "shadow-[inset_4px_4px_8px_var(--theme-shadowDark),inset_-4px_-4px_8px_var(--theme-shadowLight)]";

const mutedText = "text-[var(--theme-textMuted)]";
const primaryText = "text-[var(--theme-primary)]";
const secondaryText = "text-[var(--theme-secondary)]";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl " +
  "bg-[var(--theme-gradient)] px-5 py-3 text-sm font-bold text-white " +
  "transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40";

const secondaryButton =
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 ` +
  `text-sm font-semibold text-[var(--theme-text)] ${raisedShadowSmall} ` +
  `transition hover:text-[var(--theme-primary)] active:scale-[0.98] ` +
  `disabled:cursor-not-allowed disabled:opacity-40`;

const sectionHeading =
  "mt-2 text-2xl font-black text-[var(--theme-text)] sm:text-3xl";

/* =========================================================
   MEDIA CARD
========================================================= */

function MediaCard({ item, type, onPlay }) {
  const title =
    item?.title ||
    item?.name ||
    item?.albumName ||
    item?.collectionName ||
    "Untitled";

  const image = coverOf(item);

  const count = Array.isArray(item?.songs)
    ? item.songs.length
    : Number(item?.songCount || item?.tracksCount || 0);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className={`group min-w-0 rounded-2xl p-3 ${surfaceClass} ${raisedShadow} transition-colors duration-300 `}
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-xl bg-(--theme-surfaceLight)  ${insetShadow}`}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Disc3 className={`h-12 w-12 ${primaryText}`} />
          </div>
        )}

        {type === "album" &&
          Array.isArray(item?.songs) &&
          item.songs.length > 0 && (
            <button
              type="button"
              onClick={() => onPlay?.(item.songs[0], item.songs)}
              className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-primary)] text-white shadow-lg transition hover:scale-105"
              aria-label={`Play ${title}`}
            >
              <Play size={18} fill="currentColor" />
            </button>
          )}
      </div>

      <h3 className="mt-3 truncate text-sm font-bold text-[var(--theme-text)]">
        {title}
      </h3>

      <p className={`mt-1 truncate text-xs capitalize ${mutedText}`}>
        {type === "album"
          ? `${count} track${count === 1 ? "" : "s"}`
          : item?.description || "Artist collection"}
      </p>
    </motion.article>
  );
}

/* =========================================================
   EMPTY SECTION
========================================================= */

function EmptySection({ title, text }) {
  return (
    <div
      className={`rounded-3xl px-5 py-16 text-center ${surfaceClass} ${raisedShadow}`}
    >
      <Disc3 className={`mx-auto mb-4 h-10 w-10 ${primaryText}`} />

      <h3 className="text-xl font-bold text-[var(--theme-text)]">{title}</h3>

      <p className={`mt-2 text-sm ${mutedText}`}>{text}</p>
    </div>
  );
}

/* =========================================================
   ARTIST PROFILE
========================================================= */

export default function ArtistProfile() {
  const { id, artistId } = useParams();

  const profileId = artistId || id;

  const navigate = useNavigate();

  const player = usePlayer() || {};

  const { currentSong, isPlaying, playSong, togglePlayPause } = player;

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [collections, setCollections] = useState([]);
  const [totalPlays, setTotalPlays] = useState(0);

  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);

  const [error, setError] = useState("");
  const [contentError, setContentError] = useState("");

  const [activeTab, setActiveTab] = useState("songs");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [shareMessage, setShareMessage] = useState("");

  const [imageFailed, setImageFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const [visibleCount, setVisibleCount] = useState(10);

  /* -------------------------------------------------------
     FETCH ARTIST
  ------------------------------------------------------- */

  const fetchArtist = useCallback(async () => {
    if (!profileId) {
      setError("Artist ID is missing from the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let found = null;

      try {
        const detail = await axios.get(`${API}/api/artists/${profileId}`);

        const payload = detail.data;

        found =
          payload?.artist || payload?.data?.artist || payload?.data || payload;

        const playsCount = Number(
          payload?.stats?.totalPlays ??
            payload?.artist?.totalPlays ??
            payload?.artist?.plays ??
            0,
        );

        setTotalPlays(
          Number.isFinite(playsCount) ? Math.max(0, playsCount) : 0,
        );

        if (
          found &&
          idOf(found) !== String(profileId) &&
          !found?.name &&
          !found?.artistName
        ) {
          found = null;
        }
      } catch {
        // Some backends expose only GET /api/artists.
      }

      if (!found) {
        const response = await axios.get(`${API}/api/artists`);

        found = listFrom(response.data, ["artists", "results"]).find(
          (item) => idOf(item) === String(profileId),
        );
      }

      if (!found) {
        throw new Error(
          "Artist profile was not found. Check the artist ID and public artist API.",
        );
      }

      setArtist(found);
      setImageFailed(false);
      setCoverFailed(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to load artist profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  /* -------------------------------------------------------
     FETCH SONGS, ALBUMS AND COLLECTIONS
  ------------------------------------------------------- */

  const fetchContent = useCallback(async () => {
    if (!profileId) return;

    setContentLoading(true);
    setContentError("");

    const requests = await Promise.allSettled([
      axios.get(`${API}/api/songs`),
      axios.get(`${API}/api/albums`),
      axios.get(`${API}/api/collections`),
    ]);

    const [songResult, albumResult, collectionResult] = requests;

    const wantedName = nameOf(artist).trim().toLowerCase();

    const matchesArtist = (item) => {
      const itemArtistId = artistIdOf(item);

      const itemArtistName = nameOf(
        item?.artist || item?.artistName || item?.artist_name,
      )
        .trim()
        .toLowerCase();

      return (
        (itemArtistId && itemArtistId === String(profileId)) ||
        (itemArtistName && wantedName && itemArtistName === wantedName)
      );
    };

    if (songResult.status === "fulfilled") {
      const allSongs = listFrom(songResult.value.data, ["songs", "results"]);

      setSongs(allSongs.filter(matchesArtist));
    } else {
      setSongs([]);

      setContentError(
        songResult.reason?.response?.data?.message || "Could not load songs.",
      );
    }

    if (albumResult.status === "fulfilled") {
      setAlbums(
        listFrom(albumResult.value.data, ["albums", "results"]).filter(
          matchesArtist,
        ),
      );
    } else {
      setAlbums([]);
    }

    if (collectionResult.status === "fulfilled") {
      setCollections(
        listFrom(collectionResult.value.data, [
          "collections",
          "results",
        ]).filter(matchesArtist),
      );
    } else {
      setCollections([]);
    }

    setContentLoading(false);
  }, [profileId, artist]);

  useEffect(() => {
    fetchArtist();
  }, [fetchArtist]);

  useEffect(() => {
    if (artist) fetchContent();
  }, [artist, fetchContent]);

  /* -------------------------------------------------------
     FOLLOW STATUS
  ------------------------------------------------------- */

 /* -------------------------------------------------------
   FOLLOW STATUS
------------------------------------------------------- */
useEffect(() => {
  let cancelled = false;

  const getFollowStatus = async () => {
    const token = localStorage.getItem("token");

    if (!token || !profileId) {
      setFollowing(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API}/api/profile/followed-artists/${profileId}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!cancelled && response.data?.success) {
        setFollowing(Boolean(response.data.following));
      }
    } catch (err) {
      console.error(
        "Failed to fetch artist follow status:",
        err.response?.data || err.message,
      );
    }
  };

  getFollowStatus();

  return () => {
    cancelled = true;
  };
}, [profileId]);
  /* -------------------------------------------------------
     FILTER AND SORT SONGS
  ------------------------------------------------------- */

  const filteredSongs = useMemo(() => {
    const search = query.trim().toLowerCase();

    const result = songs.filter((song) => {
      const albumName =
        typeof song.album === "string"
          ? song.album
          : song.album?.title || song.album?.name || "";

      return (
        !search ||
        [song.title, song.name, albumName, song.genre].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search),
        )
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "title") {
        return String(a.title || a.name || "").localeCompare(
          String(b.title || b.name || ""),
        );
      }

      if (sortBy === "popular") {
        return (
          Number(b.playCount || b.plays || 0) -
          Number(a.playCount || a.plays || 0)
        );
      }

      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [songs, query, sortBy]);

  /* -------------------------------------------------------
     MUSIC PLAYBACK
  ------------------------------------------------------- */

  const handlePlaySong = useCallback(
    (song, queue = filteredSongs) => {
      if (!song || typeof playSong !== "function") return;

      const playable = (Array.isArray(queue) ? queue : []).filter((item) =>
        audioOf(item),
      );

      const finalQueue = playable.length
        ? playable
        : audioOf(song)
          ? [song]
          : [];

      if (!finalQueue.length) {
        window.alert("This track does not have an audio file available.");
        return;
      }

      const index = finalQueue.findIndex((item) => idOf(item) === idOf(song));

      const startIndex = index >= 0 ? index : 0;

      playSong(finalQueue[startIndex], startIndex, finalQueue);
    },
    [playSong, filteredSongs],
  );

  const playAll = () => {
    if (!filteredSongs.length) return;

    handlePlaySong(filteredSongs[0], filteredSongs);
  };

  const shufflePlay = () => {
    if (!filteredSongs.length) return;

    const shuffled = [...filteredSongs];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    handlePlaySong(shuffled[0], shuffled);
  };

/* -------------------------------------------------------
   FOLLOW / UNFOLLOW
------------------------------------------------------- */
const handleFollow = async () => {
  if (!artist?._id || followLoading) return;

  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/signin");
    return;
  }

  setFollowLoading(true);

  try {
    const url = `${API}/api/profile/followed-artists/${artist._id}`;

    const response = following
      ? await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      : await axios.post(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

    if (response.data?.success) {
      const nextFollowing = Boolean(response.data.following);

      setFollowing(nextFollowing);

      // Prefer the server's updated follower count.
      if (response.data.followers != null) {
        setArtist((prev) => ({
          ...prev,
          followers: Number(response.data.followers),
          followersCount: Number(response.data.followers),
        }));
      } else {
        // Fallback if the API doesn't return the count.
        setArtist((prev) => ({
          ...prev,
          followers: Math.max(
            0,
            (Number(prev?.followersCount ?? prev?.followers) || 0) +
              (nextFollowing ? 1 : -1),
          ),
        }));
      }
    }
  } catch (err) {
    console.error(
      "Follow/unfollow artist failed:",
      err.response?.data || err.message,
    );
  } finally {
    setFollowLoading(false);
  }
};
  /* -------------------------------------------------------
     SHARE PROFILE
  ------------------------------------------------------- */

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: nameOf(artist) || "Artist",
          text: `Discover ${nameOf(artist) || "this artist"} on LYRICS WAYYY`,
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);

        setShareMessage("Profile link copied!");

        setTimeout(() => setShareMessage(""), 2500);
      } else {
        window.prompt("Copy this artist profile link:", url);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setShareMessage(
          "Unable to share automatically. Copy the page link from your browser.",
        );

        setTimeout(() => setShareMessage(""), 3000);
      }
    }
  };

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-3 bg-[var(--theme-background)] px-4 text-[var(--theme-text)]">
        <Loader2 className={`h-9 w-9 animate-spin ${primaryText}`} />

        <span className={`text-sm ${mutedText}`}>Loading artist profile…</span>
      </div>
    );
  }

  /* -------------------------------------------------------
     ERROR STATE
  ------------------------------------------------------- */

  if (error || !artist) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--theme-background)] px-5 text-[var(--theme-text)]">
        <div
          className={`w-full max-w-lg rounded-3xl p-8 text-center ${surfaceClass} ${raisedShadow}`}
        >
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />

          <h2 className="text-xl font-bold">Unable to load artist</h2>

          <p className={`mt-3 break-words text-sm ${mutedText}`}>
            {error || "Artist not found."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={secondaryButton}
            >
              Go back
            </button>

            <button
              type="button"
              onClick={fetchArtist}
              className={primaryButton}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     DERIVED ARTIST DATA
  ------------------------------------------------------- */

  const artistName = nameOf(artist) || "Unknown Artist";

  const artistImage = mediaUrl(
    artist.image ||
      artist.profileImage ||
      artist.avatar ||
      artist.imageUrl ||
      artist.photo,
  );

  const banner = mediaUrl(
    artist.coverImage || artist.banner || artist.backgroundImage,
  );

  const bio =
    artist.bio ||
    artist.description ||
    artist.about ||
    "This artist hasn't added a biography yet.";

  const followers = Number(artist.followersCount ?? artist.followers ?? 0);

  const verified = Boolean(artist.verified || artist.isVerified);

  const plays = totalPlays;

  const tabs = [
    { id: "songs", label: "Songs", Icon: Music2 },
    { id: "albums", label: "Albums", Icon: Disc3 },
    { id: "collections", label: "Collections", Icon: Radio },
    { id: "about", label: "About", Icon: Users },
  ];

  /* =======================================================
     RENDER PROFILE
  ======================================================= */

  return (
    <main className="artist-profile-page relative mt-20 min-h-screen overflow-x-hidden bg-[var(--theme-background)] px-3 py-5 text-[var(--theme-text)] transition-colors duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            ARTIST HERO
        ================================================= */}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`artist-hero relative isolate overflow-hidden rounded-[2rem] ${surfaceClass} ${raisedShadow} transition-colors duration-300`}
        >
          {banner && !coverFailed && (
            <img
              src={banner}
              alt=""
              onError={() => setCoverFailed(true)}
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20"
            />
          )}

          {/* Theme-aware banner gradient */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: `linear-gradient(
                135deg,
                color-mix(in srgb, var(--theme-primary) 24%, transparent),
                color-mix(in srgb, var(--theme-background) 78%, transparent),
                color-mix(in srgb, var(--theme-secondary) 16%, transparent)
              )`,
            }}
          />

          {/* Primary decorative ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border sm:h-96 sm:w-96"
            style={{
              borderColor:
                "color-mix(in srgb, var(--theme-primary) 28%, transparent)",
              boxShadow:
                "0 0 90px color-mix(in srgb, var(--theme-primary) 12%, transparent)",
            }}
          />

          {/* Secondary decorative ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 -top-12 -z-10 h-52 w-52 rounded-full border sm:h-72 sm:w-72"
            style={{
              borderColor:
                "color-mix(in srgb, var(--theme-secondary) 22%, transparent)",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--theme-primary), var(--theme-secondary), transparent)",
            }}
          />

          <div className="flex flex-col items-center gap-7 p-5 sm:p-9 lg:flex-row lg:items-end lg:p-12">
            {/* Artist avatar */}
            <div
              className="relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] bg-[var(--theme-surface)] sm:h-56 sm:w-56 lg:h-60 lg:w-60"
              style={{
                borderColor: "var(--theme-surface)",
                boxShadow: `
                  10px 10px 22px var(--theme-shadowDark),
                  -10px -10px 22px var(--theme-shadowLight),
                  0 0 0 1px color-mix(in srgb, var(--theme-primary) 35%, transparent)
                `,
              }}
            >
              {artistImage && !imageFailed ? (
                <img
                  src={artistImage}
                  alt={artistName}
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Music2 className={`h-16 w-16 ${primaryText}`} />
              )}
            </div>

            {/* Artist identity */}
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span
                  className="rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em]"
                  style={{
                    color: "var(--theme-primary)",
                    borderColor:
                      "color-mix(in srgb, var(--theme-primary) 35%, transparent)",
                    background:
                      "color-mix(in srgb, var(--theme-primary) 10%, transparent)",
                  }}
                >
                  Artist profile
                </span>

                {verified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      color: "var(--theme-secondary)",
                      background:
                        "color-mix(in srgb, var(--theme-secondary) 10%, transparent)",
                    }}
                  >
                    <BadgeCheck size={16} />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="break-words text-3xl font-black tracking-tight text-[var(--theme-text)] sm:text-5xl lg:text-6xl">
                {artistName}
              </h1>

              <p
                className={`mx-auto mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 sm:text-base lg:mx-0 ${mutedText}`}
              >
                {bio}
              </p>

              {/* Artist statistics */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                {[
                  {
                    Icon: Users,
                    value: number(followers),
                    label: "Followers",
                  },
                  {
                    Icon: Music2,
                    value: number(songs.length),
                    label: "Songs",
                  },
                  {
                    Icon: Disc3,
                    value: number(albums.length),
                    label: "Albums",
                  },
                  {
                    Icon: Play,
                    value: number(plays),
                    label: "Plays",
                  },
                ].map(({ Icon, value, label }) => (
                  <div
                    key={label}
                    className={`flex min-w-[100px] items-center gap-2 rounded-xl px-3 py-3 ${surfaceClass} ${raisedShadowSmall}`}
                  >
                    <Icon size={17} className={`shrink-0 ${primaryText}`} />

                    <div>
                      <p className="font-bold text-[var(--theme-text)]">
                        {value}
                      </p>

                      <p className={`text-[11px] ${mutedText}`}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Artist actions */}
              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={
                    following
                      ? `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold ${insetShadow} ${secondaryText} disabled:opacity-60`
                      : `${secondaryButton} min-h-12 px-6`
                  }
                >
                  {followLoading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : following ? (
                    <Check size={17} />
                  ) : (
                    <Heart size={17} />
                  )}

                  {following ? "Following" : "Follow artist"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={secondaryButton}
                >
                  <Share2 size={17} />
                  Share profile
                </button>
              </div>

              {shareMessage && (
                <p role="status" className={`mt-3 text-sm ${secondaryText}`}>
                  {shareMessage}
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* =================================================
            NAVIGATION TABS
        ================================================= */}

        <nav
          aria-label="Artist profile sections"
          className="mt-9 flex gap-1 overflow-x-auto border-b border-[var(--theme-border)]"
        >
          {tabs.map(({ id: tabId, label, Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`relative flex min-h-12 shrink-0 items-center gap-2 px-4 py-4 text-sm font-bold transition ${
                activeTab === tabId
                  ? primaryText
                  : `${mutedText} hover:text-[var(--theme-text)]`
              }`}
            >
              <Icon size={17} />

              {label}

              {activeTab === tabId && (
                <motion.span
                  layoutId="artist-tabs"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                  style={{
                    background: "var(--theme-gradient)",
                  }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* =================================================
            SONGS TAB
        ================================================= */}

        {activeTab === "songs" && (
          <section className="mt-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-[.2em] ${primaryText}`}
                >
                  Discography
                </p>

                <h2 className={sectionHeading}>Songs by {artistName}</h2>

                <p className={`mt-2 text-sm ${mutedText}`}>
                  Explore tracks released by this artist.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={playAll}
                  disabled={!filteredSongs.length}
                  className={primaryButton}
                >
                  <Play size={16} fill="currentColor" />
                  Play all
                </button>

                <button
                  type="button"
                  onClick={shufflePlay}
                  disabled={!filteredSongs.length}
                  className={secondaryButton}
                >
                  <Shuffle size={16} />
                  Shuffle
                </button>
              </div>
            </div>

            {/* Search and sort */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`}
                />

                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setVisibleCount(10);
                  }}
                  placeholder="Search songs, albums or genres"
                  className={`min-h-12 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] py-3 pl-11 pr-4 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-textMuted)] ${insetShadow} focus:border-[var(--theme-primary)]`}
                />
              </label>

              <label
                className={`flex min-h-12 items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 ${surfaceClass} ${raisedShadowSmall}`}
              >
                <span className={`text-xs ${mutedText}`}>Sort</span>

                <ChevronDown size={15} className={mutedText} />

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--theme-text)] outline-none"
                >
                  <option value="latest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="popular">Most popular</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            </div>

            {/* Song results */}
            {contentLoading && !songs.length ? (
              <div className={`flex justify-center gap-3 py-14 ${mutedText}`}>
                <Loader2 className={`animate-spin ${primaryText}`} />
                Loading discography…
              </div>
            ) : contentError && !songs.length ? (
              <div
                className={`rounded-2xl p-6 text-center text-sm text-red-400 ${surfaceClass} ${raisedShadow}`}
              >
                <AlertCircle className="mx-auto mb-3" />

                {contentError}

                <button
                  type="button"
                  onClick={fetchContent}
                  className={`ml-3 inline-flex items-center gap-1 ${primaryText}`}
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : filteredSongs.length === 0 ? (
              <div
                className={`rounded-3xl px-5 py-16 text-center ${surfaceClass} ${raisedShadow}`}
              >
                <Music2 className={`mx-auto mb-4 h-10 w-10 ${primaryText}`} />

                <h3 className="text-xl font-bold text-[var(--theme-text)]">
                  No songs found
                </h3>

                <p className={`mt-2 text-sm ${mutedText}`}>
                  {query
                    ? "Try a different search."
                    : "This artist hasn't published any songs yet."}
                </p>
              </div>
            ) : (
              <div
                className={`overflow-hidden rounded-2xl ${surfaceClass} ${raisedShadow}`}
              >
                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(90px,.5fr)_80px_48px] gap-4 border-b border-[var(--theme-border)] px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-[var(--theme-textMuted)] md:grid">
                  <span>Track</span>
                  <span>Album</span>
                  <span>Duration</span>
                  <span />
                </div>

                {filteredSongs.slice(0, visibleCount).map((song, index) => {
                  const songId = idOf(song) || String(index);

                  const title = song.title || song.name || "Untitled track";

                  const album =
                    typeof song.album === "string"
                      ? song.album
                      : song.album?.title || song.album?.name || "Single";

                  const current = idOf(currentSong) === songId && songId !== "";

                  const playing = current && isPlaying;

                  const songCover = coverOf(song);

                  return (
                    <motion.div
                      key={songId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-b border-[var(--theme-border)] p-3 last:border-0 transition-colors hover:bg-[var(--theme-surfaceLight)] sm:p-4 md:grid-cols-[minmax(0,1fr)_minmax(90px,.5fr)_80px_48px] md:gap-4 md:px-5 ${
                        current ? "bg-[var(--theme-surfaceLight)]" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--theme-surfaceLight)] ${insetShadow}`}
                        >
                          {songCover ? (
                            <img
                              src={songCover}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Music2 className={`h-5 w-5 ${primaryText}`} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-bold ${
                              current ? primaryText : "text-[var(--theme-text)]"
                            }`}
                          >
                            {title}
                          </p>

                          <p className={`mt-1 truncate text-xs ${mutedText}`}>
                            {artistName}
                            {song.genre ? ` · ${song.genre}` : ""}
                          </p>

                          <p
                            className={`mt-1 truncate text-xs md:hidden ${mutedText}`}
                          >
                            {album} ·{" "}
                            {duration(
                              song.durationSeconds ??
                                song.duration ??
                                song.length,
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`hidden truncate text-sm md:block ${mutedText}`}
                      >
                        {album}
                      </span>

                      <span className={`hidden text-sm md:block ${mutedText}`}>
                        {duration(
                          song.durationSeconds ?? song.duration ?? song.length,
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          current && typeof togglePlayPause === "function"
                            ? togglePlayPause()
                            : handlePlaySong(song, filteredSongs)
                        }
                        aria-label={`${playing ? "Pause" : "Play"} ${title}`}
                        className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                          current
                            ? "bg-[var(--theme-primary)] text-white"
                            : `text-[var(--theme-text)] ${raisedShadowSmall} hover:text-[var(--theme-primary)]`
                        }`}
                      >
                        {playing ? (
                          <Pause size={17} fill="currentColor" />
                        ) : (
                          <Play size={17} fill="currentColor" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {visibleCount < filteredSongs.length && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 10)}
                  className={secondaryButton}
                >
                  Load more songs
                </button>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            ALBUMS TAB
        ================================================= */}

        {activeTab === "albums" && (
          <section className="mt-8">
            <div className="mb-6">
              <p
                className={`text-xs font-bold uppercase tracking-[.2em] ${primaryText}`}
              >
                Releases
              </p>

              <h2 className={sectionHeading}>Albums</h2>

              <p className={`mt-2 text-sm ${mutedText}`}>
                Albums published by {artistName}.
              </p>
            </div>

            {contentLoading && !albums.length ? (
              <Loader2
                className={`mx-auto my-12 animate-spin ${primaryText}`}
              />
            ) : albums.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {albums.map((album, index) => (
                  <MediaCard
                    key={idOf(album) || index}
                    item={album}
                    type="album"
                    onPlay={handlePlaySong}
                  />
                ))}
              </div>
            ) : (
              <EmptySection
                title="No albums yet"
                text="Albums published by this artist will appear here."
              />
            )}
          </section>
        )}

        {/* =================================================
            COLLECTIONS TAB
        ================================================= */}

        {activeTab === "collections" && (
          <section className="mt-8">
            <div className="mb-6">
              <p
                className={`text-xs font-bold uppercase tracking-[.2em] ${secondaryText}`}
              >
                Curated music
              </p>

              <h2 className={sectionHeading}>Collections</h2>

              <p className={`mt-2 text-sm ${mutedText}`}>
                Collections published by {artistName}.
              </p>
            </div>

            {contentLoading && !collections.length ? (
              <Loader2
                className={`mx-auto my-12 animate-spin ${primaryText}`}
              />
            ) : collections.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {collections.map((collection, index) => (
                  <MediaCard
                    key={idOf(collection) || index}
                    item={collection}
                    type="collection"
                  />
                ))}
              </div>
            ) : (
              <EmptySection
                title="No public collections yet"
                text="Public artist collections will appear here when available."
              />
            )}
          </section>
        )}

        {/* =================================================
            ABOUT TAB
        ================================================= */}

        {activeTab === "about" && (
          <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            {/* Biography */}
            <div
              className={`rounded-3xl p-6 sm:p-8 ${surfaceClass} ${raisedShadow}`}
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--theme-surface)] ${insetShadow}`}
                >
                  <Users className={primaryText} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[var(--theme-text)]">
                    About {artistName}
                  </h2>

                  <p className={`text-xs ${mutedText}`}>Artist information</p>
                </div>
              </div>

              <p
                className={`whitespace-pre-line text-sm leading-8 ${mutedText}`}
              >
                {bio}
              </p>

              {artist.genres && (
                <div className="mt-6">
                  <h3
                    className={`mb-3 text-xs font-bold uppercase tracking-widest ${mutedText}`}
                  >
                    Genres
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(artist.genres)
                      ? artist.genres
                      : [artist.genres]
                    ).map((genre, index) => (
                      <span
                        key={`${genre}-${index}`}
                        className={`rounded-lg px-3 py-2 text-xs ${primaryText} ${raisedShadowSmall}`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Artist details */}
            <div
              className={`rounded-3xl p-6 sm:p-8 ${surfaceClass} ${raisedShadow}`}
            >
              <h3 className="mb-5 text-xl font-bold text-[var(--theme-text)]">
                Artist details
              </h3>

              <div className="space-y-3">
                {[
                  {
                    label: "Followers",
                    value: number(followers),
                  },
                  {
                    label: "Songs",
                    value: number(songs.length),
                  },
                  {
                    label: "Albums",
                    value: number(albums.length),
                  },
                  {
                    label: "Collections",
                    value: number(collections.length),
                  },
                  {
                    label: "Total plays",
                    value: number(plays),
                  },
                  ...(artist.createdAt
                    ? [
                        {
                          label: "Joined",
                          value: dateLabel(artist.createdAt),
                        },
                      ]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[var(--theme-surface)] ${insetShadow}`}
                  >
                    <span className={`text-sm ${mutedText}`}>{item.label}</span>

                    <span className={`text-sm font-bold ${primaryText}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {artist.website && (
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-5 inline-flex items-center gap-2 text-sm ${primaryText} hover:text-[var(--theme-secondary)]`}
                >
                  <Globe size={16} />
                  Official website
                  <ExternalLink size={14} />
                </a>
              )}

              {artist.socialLinks?.instagram && (
                <a
                  href={artist.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-4 flex items-center gap-2 text-sm ${mutedText} hover:text-[var(--theme-primary)]`}
                >
                  <Camera size={16} />
                  Instagram
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </section>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-14 border-t border-[var(--theme-border)] py-7 text-center">
          <Link
            to="/home"
            className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:text-[var(--theme-primary)]`}
          >
            <ArrowLeft size={16} />
            Back to music
          </Link>

          <p className={`mt-3 text-xs ${mutedText}`}>
            LYRICS WAYYY · Discover your next favorite track.
          </p>
        </footer>
      </div>
    </main>
  );
}
