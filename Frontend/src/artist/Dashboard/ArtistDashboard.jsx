import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Disc3,
  Folder,
  Loader2,
  Mic2,
  Music2,
  Plus,
  RefreshCw,
  TrendingUp,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";

import ThemeSwitcher from "../../assets/utility/ThemeSwitcher";
import { BASE_URL } from "../../config/api";

// =====================================================
// THEME-AWARE NEUMORPHIC STYLES
// Uses the CSS variables supplied by ThemeContext.jsx.
// =====================================================

const neuRaised = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "8px 8px 16px var(--theme-shadowDark), -8px -8px 16px var(--theme-shadowLight)",
  color: "var(--theme-text)",
};

const neuRaisedSmall = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
};

const neuInset = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
};

const primaryTextStyle = {
  color: "var(--theme-primary)",
};

const secondaryTextStyle = {
  color: "var(--theme-secondary)",
};

const mutedTextStyle = {
  color: "var(--theme-textMuted)",
};

const primaryGradientStyle = {
  background: "var(--theme-gradient)",
  color: "var(--theme-text)",
};

// =====================================================
// DURATION HELPERS
// =====================================================

function getDurationSeconds(song) {
  const rawDuration =
    song?.durationSeconds ??
    song?.duration ??
    song?.audioDuration ??
    song?.length ??
    0;

  if (typeof rawDuration === "number") {
    return Number.isFinite(rawDuration) && rawDuration > 0
      ? rawDuration
      : 0;
  }

  if (typeof rawDuration !== "string") {
    return 0;
  }

  const value = rawDuration.trim();

  if (!value) {
    return 0;
  }

  // Numeric duration in seconds, e.g. "245" or "245.5".
  if (/^\d+(\.\d+)?$/.test(value)) {
    const seconds = Number(value);

    return Number.isFinite(seconds) && seconds > 0
      ? seconds
      : 0;
  }

  // MM:SS or HH:MM:SS.
  if (/^\d+(\.\d+)?(:\d+(\.\d+)?){1,2}$/.test(value)) {
    const parts = value.split(":").map(Number);

    if (
      parts.some(
        (part) => !Number.isFinite(part) || part < 0,
      )
    ) {
      return 0;
    }

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

function formatTotalPlayTime(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds || 0));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

// =====================================================
// IMAGE URL HELPER
// =====================================================

function getImageUrl(image) {
  if (!image || typeof image !== "string") {
    return "";
  }

  const trimmedImage = image.trim();

  if (!trimmedImage) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedImage)) {
    return trimmedImage;
  }

  const baseUrl = BASE_URL.replace(/\/+$/, "");
  const imagePath = trimmedImage.replace(/^\/+/, "");

  return `${baseUrl}/${imagePath}`;
}

// =====================================================
// ARTIST DASHBOARD
// =====================================================

const ArtistDashboard = () => {
  const navigate = useNavigate();

  // ===================================================
  // STATE
  // ===================================================

  const [artist, setArtist] = useState(null);

  const [stats, setStats] = useState({
    songs: 0,
    albums: 0,
    collections: 0,
    duration: "0s",
    genres: 0,
  });

  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ===================================================
  // AUTH HEADERS
  // ===================================================

  const getHeaders = () => {
    const currentToken = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    };
  };

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        navigate("/signin", { replace: true });
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const baseUrl = BASE_URL.replace(/\/+$/, "");

        const artistUrl = `${baseUrl}/api/songs/my/artist`;
        const statsUrl = `${baseUrl}/api/songs/stats/dashboard`;
        const songsUrl = `${baseUrl}/api/songs/my`;

        const headers = getHeaders();

        // Fetch artist profile, statistics, and songs.
        const [artistResponse, statsResponse, songsResponse] =
          await Promise.all([
            axios.get(artistUrl, headers),
            axios.get(statsUrl, headers),
            axios.get(songsUrl, headers),
          ]);

        // -----------------------------------------------
        // ARTIST DATA
        // -----------------------------------------------

        const artistData =
          artistResponse.data?.artist ||
          statsResponse.data?.artist ||
          statsResponse.data?.data?.artist ||
          null;

        setArtist(artistData);

        // -----------------------------------------------
        // DASHBOARD STATISTICS
        // -----------------------------------------------

        const dashboard =
          statsResponse.data?.stats ||
          statsResponse.data?.data?.stats ||
          statsResponse.data?.data ||
          statsResponse.data ||
          {};

        const songsFromApi =
          songsResponse.data?.songs ||
          songsResponse.data?.data?.songs ||
          (Array.isArray(songsResponse.data?.data)
            ? songsResponse.data.data
            : null) ||
          statsResponse.data?.recentSongs ||
          statsResponse.data?.data?.recentSongs ||
          [];

        const allSongs = Array.isArray(songsFromApi)
          ? songsFromApi
          : [];

        // -----------------------------------------------
        // TOTAL UPLOADED MUSIC DURATION
        // -----------------------------------------------

        const totalPlayTimeSeconds = allSongs.reduce(
          (total, song) => total + getDurationSeconds(song),
          0,
        );

        const calculatedDuration =
          formatTotalPlayTime(totalPlayTimeSeconds);

        const backendDuration =
          dashboard.totalDuration ??
          dashboard.duration ??
          dashboard.totalDurationFormatted ??
          dashboard.formattedDuration ??
          null;

        const finalDuration =
          typeof backendDuration === "string" &&
          backendDuration.trim() &&
          backendDuration !== "0:00" &&
          backendDuration !== "0s"
            ? backendDuration
            : calculatedDuration;

        // Count genres from songs if the backend doesn't
        // provide a genre count.
        const genreCountFromSongs = new Set(
          allSongs
            .map((song) =>
              typeof song?.genre === "string"
                ? song.genre.trim().toLowerCase()
                : "",
            )
            .filter(Boolean),
        ).size;

        const normalizedStats = {
          songs:
            Number(
              dashboard.totalSongs ??
                dashboard.songs ??
                dashboard.songCount ??
                statsResponse.data?.totalSongs ??
                allSongs.length,
            ) || 0,

          albums:
            Number(
              dashboard.totalAlbums ??
                dashboard.albums ??
                dashboard.albumCount ??
                statsResponse.data?.totalAlbums ??
                0,
            ) || 0,

          collections:
            Number(
              dashboard.totalCollections ??
                dashboard.collections ??
                dashboard.collectionCount ??
                0,
            ) || 0,

          duration: finalDuration,

          genres:
            Number(
              dashboard.totalGenres ??
                dashboard.genres ??
                dashboard.genreCount ??
                statsResponse.data?.totalGenres ??
                genreCountFromSongs,
            ) || 0,
        };

        setStats(normalizedStats);

        // -----------------------------------------------
        // RECENT SONGS
        // -----------------------------------------------

        setRecentSongs(allSongs.slice(0, 5));
      } catch (err) {
        console.error(
          "Artist dashboard request failed:",
          err,
        );

        // -----------------------------------------------
        // UNAUTHORIZED SESSION
        // -----------------------------------------------

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          localStorage.removeItem("isAuthenticated");

          navigate("/signin", { replace: true });
          return;
        }

        if (err?.response?.status === 403) {
          console.error(
            "Artist access forbidden:",
            err?.response?.data?.message,
          );
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate],
  );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date) => {
    if (!date) {
      return "Recently";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Recently";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ===================================================
  // STAT CARDS
  // ===================================================

  const statCards = [
    {
      title: "Total Songs",
      value: stats.songs,
      icon: Music2,
      accent: "primary",
    },
    {
      title: "Albums",
      value: stats.albums,
      icon: Disc3,
      accent: "secondary",
    },
    {
      title: "Collections",
      value: stats.collections,
      icon: Folder,
      accent: "primary",
    },
    {
      title: "Genres",
      value: stats.genres,
      icon: BarChart3,
      accent: "secondary",
    },
  ];

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center rounded-3xl p-6"
        style={{
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={neuInset}
          >
            <Loader2
              size={34}
              className="animate-spin"
              style={primaryTextStyle}
            />
          </div>

          <p className="text-sm" style={mutedTextStyle}>
            Loading your artist dashboard...
          </p>
        </div>
      </div>
    );
  }
    // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  return (
    <div
      className="mx-auto w-full max-w-7xl p-1 sm:p-2"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* ARTIST INFORMATION AND THEME SWITCHER */}

        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* ARTIST IMAGE */}

            <div
              className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
              style={neuRaised}
            >
              {artist?.image ? (
                <img
                  src={getImageUrl(artist.image)}
                  alt={artist.name || "Artist"}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    console.error(
                      "Artist image failed:",
                      event.currentTarget.src,
                    );
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound
                    size={27}
                    style={mutedTextStyle}
                  />
                </div>
              )}
            </div>

            {/* ARTIST NAME */}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="text-2xl font-bold tracking-tight sm:text-3xl"
                  style={{ color: "var(--theme-text)" }}
                >
                  Welcome, {artist?.name || "Artist"}
                </h1>

                {artist?.verified && (
                  <CheckCircle2
                    size={21}
                    aria-label="Verified artist"
                    style={secondaryTextStyle}
                  />
                )}
              </div>

              <p
                className="mt-1 text-sm"
                style={mutedTextStyle}
              >
                Manage your music and track your artist activity.
              </p>
            </div>
          </div>

        </div>

        {/* DASHBOARD ACTIONS */}

        <div className="flex flex-wrap items-center gap-3">
          {/* THEME SWITCHER */}

          <div className="flex shrink-0 items-center justify-start sm:justify-end">
            <ThemeSwitcher />
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              ...neuRaisedSmall,
              color: "var(--theme-text)",
            }}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/artist/songs/new"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
            style={{
              ...neuRaisedSmall,
              color: "var(--theme-primary)",
            }}
          >
            <Plus size={18} />
            Add Song
          </Link>
        </div>
      </header>

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-danger)",
            color: "var(--theme-danger)",
            boxShadow:
              "4px 4px 8px var(--theme-shadowDark), -4px -4px 8px var(--theme-shadowLight)",
          }}
        >
          <XCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="min-w-0">
            <p className="font-semibold">
              Dashboard request failed
            </p>

            <p className="mt-1 break-words text-xs">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          ARTIST PROFILE SUMMARY
      ================================================= */}

      <section
        className="mb-8 rounded-3xl p-5 sm:p-6"
        style={neuRaised}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          {/* PROFILE DETAILS */}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Mic2
                size={19}
                style={primaryTextStyle}
              />

              <span
                className="text-sm font-medium"
                style={mutedTextStyle}
              >
                Artist Profile
              </span>
            </div>

            <h2
              className="mt-2 text-xl font-semibold"
              style={{ color: "var(--theme-text)" }}
            >
              {artist?.name || "Artist"}
            </h2>

            {artist?.bio ? (
              <p
                className="mt-1 max-w-2xl whitespace-pre-wrap break-words text-sm"
                style={mutedTextStyle}
              >
                {artist.bio}
              </p>
            ) : (
              <p
                className="mt-1 text-sm"
                style={mutedTextStyle}
              >
                No artist bio added yet.
              </p>
            )}
          </div>

          {/* PROFILE STATISTICS */}

          <div className="flex flex-wrap gap-3">
            <div
              className="min-w-28 rounded-xl px-4 py-3 text-center"
              style={neuInset}
            >
              <p
                className="text-lg font-bold"
                style={{ color: "var(--theme-text)" }}
              >
                {artist?.followers ?? 0}
              </p>

              <p
                className="text-xs"
                style={mutedTextStyle}
              >
                Followers
              </p>
            </div>

            <div
              className="min-w-28 rounded-xl px-4 py-3 text-center"
              style={neuInset}
            >
              <p
                className="text-lg font-bold"
                style={{
                  color: artist?.verified
                    ? "var(--theme-secondary)"
                    : "var(--theme-text)",
                }}
              >
                {artist?.verified ? "Verified" : "Unverified"}
              </p>

              <p
                className="text-xs"
                style={mutedTextStyle}
              >
                Status
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <section
        aria-label="Music statistics"
        className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;

          const iconColor =
            card.accent === "secondary"
              ? "var(--theme-secondary)"
              : "var(--theme-primary)";

          return (
            <div
              key={card.title}
              className="rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
              style={neuRaised}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-sm"
                    style={mutedTextStyle}
                  >
                    {card.title}
                  </p>

                  <p
                    className="mt-2 break-words text-3xl font-bold"
                    style={{ color: "var(--theme-text)" }}
                  >
                    {card.value}
                  </p>
                </div>

                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={neuInset}
                >
                  <Icon
                    size={23}
                    style={{ color: iconColor }}
                  />
                </div>
              </div>

              <div
                className="mt-4 h-1 overflow-hidden rounded-full"
                style={neuInset}
              >
                <div
                  className="h-full w-2/3 rounded-full"
                  style={{
                    background: "var(--theme-gradient)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* =================================================
          PERFORMANCE CARDS
      ================================================= */}

      <section
        aria-label="Music performance"
        className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {/* TOTAL MUSIC DURATION */}

        <div
          className="rounded-2xl p-6"
          style={neuRaised}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={neuInset}
            >
              <Clock3
                size={20}
                style={primaryTextStyle}
              />
            </div>

            <div className="min-w-0">
              <p
                className="text-xs"
                style={mutedTextStyle}
              >
                Total Music Duration
              </p>

              <p
                className="mt-1 text-xl font-bold"
                style={{ color: "var(--theme-text)" }}
              >
                {stats.duration}
              </p>
            </div>
          </div>
        </div>

        {/* UPLOADED SONGS */}

        <div
          className="rounded-2xl p-6"
          style={neuRaised}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={neuInset}
            >
              <Upload
                size={20}
                style={secondaryTextStyle}
              />
            </div>

            <div className="min-w-0">
              <p
                className="text-xs"
                style={mutedTextStyle}
              >
                Uploaded Songs
              </p>

              <p
                className="mt-1 text-xl font-bold"
                style={{ color: "var(--theme-text)" }}
              >
                {stats.songs}
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT ACTIVITY */}

        <div
          className="rounded-2xl p-6"
          style={neuRaised}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={neuInset}
            >
              <TrendingUp
                size={20}
                style={primaryTextStyle}
              />
            </div>

            <div className="min-w-0">
              <p
                className="text-xs"
                style={mutedTextStyle}
              >
                Current Activity
              </p>

              <p
                className="mt-1 text-xl font-bold"
                style={{
                  color: recentSongs.length
                    ? "var(--theme-secondary)"
                    : "var(--theme-text)",
                }}
              >
                {recentSongs.length > 0
                  ? "Active"
                  : "No uploads"}
              </p>
            </div>
          </div>
        </div>
      </section>
            {/* =================================================
          RECENT SONGS
      ================================================= */}

      <section
        className="rounded-3xl p-5 sm:p-6"
        style={neuRaised}
      >
        {/* SECTION HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={neuInset}
            >
              <Music2
                size={21}
                style={primaryTextStyle}
              />
            </div>

            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--theme-text)" }}
              >
                Recent Songs
              </h2>

              <p
                className="mt-1 text-sm"
                style={mutedTextStyle}
              >
                Your latest uploaded tracks
              </p>
            </div>
          </div>

          <Link
            to="/artist/songs"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] sm:self-auto"
            style={{
              ...neuRaisedSmall,
              color: "var(--theme-primary)",
            }}
          >
            View All
            <Music2 size={16} />
          </Link>
        </div>

        {/* EMPTY STATE */}

        {recentSongs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-5 py-12 text-center"
            style={neuInset}
          >
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
              style={neuRaised}
            >
              <Disc3
                size={36}
                style={primaryTextStyle}
              />
            </div>

            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--theme-text)" }}
            >
              Your music journey starts here
            </h3>

            <p
              className="mt-2 max-w-md text-sm"
              style={mutedTextStyle}
            >
              You haven't uploaded any songs yet. Add your first track
              to start building your music collection.
            </p>

            <Link
              to="/artist/songs/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
              style={{
                ...neuRaisedSmall,
                color: "var(--theme-primary)",
              }}
            >
              <Plus size={18} />
              Add Your First Song
            </Link>
          </div>
        ) : (
          /* SONG LIST */

          <div className="space-y-3">
            {recentSongs.map((song, index) => {
              const songImage =
                song.coverImage ||
                song.cover ||
                song.thumbnail ||
                song.album?.coverImage;

              const songTitle =
                song.title ||
                song.name ||
                "Untitled Song";

              const artistName =
                song.artist?.name ||
                song.artistName ||
                artist?.name ||
                "Unknown Artist";

              const songGenre =
                typeof song.genre === "string"
                  ? song.genre
                  : song.genre?.name || "Unknown Genre";

              const songDate =
                song.createdAt ||
                song.uploadedAt ||
                song.updatedAt;

              const durationSeconds = getDurationSeconds(song);

              const formattedDuration =
                durationSeconds > 0
                  ? formatTotalPlayTime(durationSeconds)
                  : song.duration || "--:--";

              return (
                <div
                  key={song._id || song.id || `${songTitle}-${index}`}
                  className="group flex min-w-0 flex-col gap-4 rounded-2xl p-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between"
                  style={neuRaisedSmall}
                >
                  {/* SONG DETAILS */}

                  <div className="flex min-w-0 items-center gap-4">
                    {/* COVER IMAGE */}

                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                      style={neuInset}
                    >
                      {songImage ? (
                        <img
                          src={getImageUrl(songImage)}
                          alt={`${songTitle} cover`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}

                      <div
                        className="absolute inset-0 -z-0 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Music2
                          size={22}
                          style={mutedTextStyle}
                        />
                      </div>
                    </div>

                    {/* TITLE, ARTIST AND GENRE */}

                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-sm font-semibold sm:text-base"
                        style={{ color: "var(--theme-text)" }}
                        title={songTitle}
                      >
                        {songTitle}
                      </h3>

                      <p
                        className="mt-1 truncate text-sm"
                        style={mutedTextStyle}
                      >
                        {artistName}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span
                          className="inline-flex items-center gap-1 text-xs"
                          style={secondaryTextStyle}
                        >
                          <Disc3 size={13} />
                          {songGenre}
                        </span>

                        {songDate && (
                          <span
                            className="text-xs"
                            style={mutedTextStyle}
                          >
                            {formatDate(songDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DURATION AND TRACK NUMBER */}

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <span
                      className="text-xs"
                      style={mutedTextStyle}
                    >
                      Track {String(index + 1).padStart(2, "0")}
                    </span>

                    <div
                      className="flex min-w-20 items-center justify-center gap-2 rounded-lg px-3 py-2"
                      style={neuInset}
                    >
                      <Clock3
                        size={14}
                        style={primaryTextStyle}
                      />

                      <span
                        className="text-sm font-medium tabular-nums"
                        style={{ color: "var(--theme-text)" }}
                      >
                        {formattedDuration}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =================================================
          DASHBOARD FOOTER
      ================================================= */}

      <footer
        className="mt-6 flex flex-col items-center justify-between gap-2 px-2 py-4 text-center text-xs sm:flex-row sm:text-left"
        style={mutedTextStyle}
      >
        <p>
          © {new Date().getFullYear()} LYRICS WAYYY
        </p>

        <p className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: "var(--theme-secondary)",
              boxShadow: "0 0 8px var(--theme-glowSecondary)",
            }}
          />
          Artist Dashboard
        </p>
      </footer>
    </div>
  );
};

export default ArtistDashboard;