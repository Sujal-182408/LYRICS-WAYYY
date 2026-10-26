import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Music2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Play,
  RefreshCw,
  X,
  Disc3,
  AlertCircle,
  Music,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../../config/api";

/* =========================================================
   THEME-AWARE NEUMORPHIC STYLES
   Uses the variables already supplied by ThemeContext.
========================================================= */

const neuRaised = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "8px 8px 16px var(--theme-shadowDark), -8px -8px 16px var(--theme-shadowLight)",
};

const neuRaisedSmall = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "4px 4px 9px var(--theme-shadowDark), -4px -4px 9px var(--theme-shadowLight)",
};

const neuPressed = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 5px 5px 10px var(--theme-shadowDark), inset -5px -5px 10px var(--theme-shadowLight)",
};

const primaryText = { color: "var(--theme-primary)" };
const secondaryText = { color: "var(--theme-secondary)" };
const mutedText = { color: "var(--theme-textMuted)" };

const primaryButtonStyle = {
  background: "var(--theme-gradient)",
  color: "var(--theme-text)",
  border: "1px solid var(--theme-border)",
};

const API_BASE = BASE_URL.replace(/\/+$/, "");
const DEFAULT_COVER = "/image/default-cover.jpg";

const getToken = () => localStorage.getItem("token");

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const getMediaUrl = (path) => {
  if (!path || typeof path !== "string") return "";

  const value = path.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_BASE}/${value.replace(/^\/+/, "")}`;
};

/* =========================================================
   REUSABLE ICON BUTTON
========================================================= */

const IconButton = ({
  children,
  title,
  onClick,
  disabled = false,
  danger = false,
  className = "",
}) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    style={{
      ...neuRaisedSmall,
      color: danger ? "var(--theme-danger)" : "var(--theme-primary)",
    }}
  >
    {children}
  </button>
);

/* =========================================================
   SONG COVER
========================================================= */

const SongCover = ({ song }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const coverUrl = getMediaUrl(song.coverImage);

  const imageSource =
    !imageFailed && coverUrl ? coverUrl : DEFAULT_COVER;

  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={neuPressed}
    >
      <Music2
        size={24}
        className="absolute"
        style={{ color: "var(--theme-primary)" }}
        aria-hidden="true"
      />

      <img
        src={imageSource}
        alt={`${song.title || "Song"} cover`}
        loading="lazy"
        className="relative z-10 h-full w-full object-cover"
        onError={() => {
          if (!imageFailed) {
            setImageFailed(true);
          }
        }}
      />
    </div>
  );
};

/* =========================================================
   SONGS PAGE
========================================================= */

const Songs = () => {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =======================================================
     FETCH MY SONGS
  ======================================================= */

  const fetchMySongs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      const response = await axios.get(
        `${API_BASE}/api/songs/my`,
        getAuthConfig(),
      );

      if (response.data?.success) {
        setSongs(response.data.songs || []);
      } else {
        setSongs([]);
        setError(response.data?.message || "Unable to load your songs.");
      }
    } catch (err) {
      console.error("GET MY SONGS ERROR:", err);

      setError(
        err.response?.data?.message || "Failed to load your songs.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMySongs();
  }, [fetchMySongs]);

  /* =======================================================
     DELETE SONG
  ======================================================= */

  const handleDelete = async (song) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title || "this song"}"?`,
    );

    if (!confirmed) return;

    try {
      setDeleting(song._id);
      setError("");
      setSuccessMessage("");

      await axios.delete(
        `${API_BASE}/api/songs/${song._id}`,
        getAuthConfig(),
      );

      setSongs((previous) =>
        previous.filter((item) => item._id !== song._id),
      );

      setSuccessMessage(
        `"${song.title || "Song"}" was deleted successfully.`,
      );
    } catch (err) {
      console.error("DELETE SONG ERROR:", err);

      setError(
        err.response?.data?.message || "Failed to delete the song.",
      );
    } finally {
      setDeleting(null);
    }
  };

  /* =======================================================
     FILTER SONGS
  ======================================================= */

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return songs;

    return songs.filter((song) => {
      const title = song.title?.toLowerCase() || "";

      const artist =
        typeof song.artist === "string"
          ? song.artist.toLowerCase()
          : song.artist?.name?.toLowerCase() || "";

      const album =
        typeof song.album === "string"
          ? song.album.toLowerCase()
          : song.album?.title?.toLowerCase() || "";

      const genre = song.genre?.toLowerCase() || "";

      return (
        title.includes(query) ||
        artist.includes(query) ||
        album.includes(query) ||
        genre.includes(query)
      );
    });
  }, [songs, search]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="min-h-screen space-y-7 pb-10"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      {/* HEADER */}

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={secondaryText}
          >
            Artist Studio
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Songs
          </h1>

          <p className="mt-2 text-sm" style={mutedText}>
            Manage your music, organize your releases, and keep your library
            up to date.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fetchMySongs(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
            style={neuRaisedSmall}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/artist/songs/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 active:scale-[0.98]"
            style={primaryButtonStyle}
          >
            <Plus size={19} />
            Add Song
          </Link>
        </div>
      </header>

      {/* SUMMARY CARDS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Songs",
            value: songs.length,
            icon: Music2,
            accent: primaryText,
          },
          {
            label: "Search Results",
            value: filteredSongs.length,
            icon: Search,
            accent: secondaryText,
          },
          {
            label: "Genres",
            value: new Set(
              songs.map((song) => song.genre?.trim()).filter(Boolean),
            ).size,
            icon: Disc3,
            accent: primaryText,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl p-5"
              style={neuRaised}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={neuPressed}
              >
                <Icon size={22} style={stat.accent} />
              </div>

              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="mt-1 text-xs" style={mutedText}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* SEARCH */}

      <div
        className="flex items-center gap-3 rounded-2xl px-4"
        style={neuPressed}
      >
        <Search size={20} className="shrink-0" style={mutedText} />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by song, artist, album, or genre..."
          aria-label="Search your songs"
          className="w-full min-w-0 bg-transparent py-4 text-sm outline-none placeholder:opacity-60"
          style={{ color: "var(--theme-text)" }}
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="rounded-lg p-2 transition"
            style={mutedText}
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl p-4 text-sm"
          style={{
            ...neuPressed,
            color: "var(--theme-danger)",
          }}
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <p className="min-w-0 flex-1">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl p-4 text-sm"
          style={{
            ...neuPressed,
            color: "var(--theme-secondary)",
          }}
        >
          <Music size={18} />
          <p className="flex-1">{successMessage}</p>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SONG LIBRARY */}

      <section className="overflow-hidden rounded-3xl" style={neuRaised}>
        {/* TABLE HEADER */}

        <div
          className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_100px] gap-4 border-b px-6 py-4 text-xs font-bold uppercase tracking-wider md:grid"
          style={{
            borderColor: "var(--theme-border)",
            color: "var(--theme-textMuted)",
          }}
        >
          <span>Song</span>
          <span>Artist</span>
          <span>Album</span>
          <span className="text-right">Actions</span>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-10 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={neuPressed}
            >
              <RefreshCw
                size={25}
                className="animate-spin"
                style={primaryText}
              />
            </div>

            <p className="mt-5 text-sm" style={mutedText}>
              Loading your music library...
            </p>
          </div>
        ) : filteredSongs.length === 0 ? (
          /* EMPTY STATE */

          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-3xl"
              style={neuPressed}
            >
              <Music2 size={35} style={primaryText} />
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {search ? "No songs found" : "Your music library is empty"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6" style={mutedText}>
              {search
                ? "Try a different search term or clear your search."
                : "Upload your first song and start building your artist library."}
            </p>

            {!search && (
              <Link
                to="/artist/songs/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
                style={primaryButtonStyle}
              >
                <Plus size={18} />
                Upload Your First Song
              </Link>
            )}
          </div>
        ) : (
          /* SONG ROWS */

          <div>
            {filteredSongs.map((song) => {
              const artistName =
                typeof song.artist === "string"
                  ? song.artist
                  : song.artist?.name || "Unknown Artist";

              const albumName =
                typeof song.album === "string"
                  ? song.album
                  : song.album?.title || "—";

              return (
                <article
                  key={song._id}
                  className="group grid grid-cols-1 items-center gap-4 border-b px-4 py-4 transition-colors duration-200 last:border-b-0 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_100px]"
                  style={{
                    borderColor: "var(--theme-border)",
                  }}
                >
                  {/* SONG */}

                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative shrink-0">
                      <SongCover song={song} />

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: "var(--theme-surface)",
                            color: "var(--theme-primary)",
                            border: "1px solid var(--theme-border)",
                            boxShadow:
                              "4px 4px 8px var(--theme-shadowDark)",
                          }}
                        >
                          <Play size={15} fill="currentColor" />
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold sm:text-base">
                        {song.title || "Untitled Song"}
                      </h3>

                      <p className="mt-1 truncate text-xs" style={mutedText}>
                        {song.genre || "Unknown genre"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 md:hidden">
                        <span
                          className="max-w-full truncate rounded-lg px-2 py-1 text-xs"
                          style={neuPressed}
                        >
                          {artistName}
                        </span>

                        <span
                          className="max-w-full truncate rounded-lg px-2 py-1 text-xs"
                          style={neuPressed}
                        >
                          {albumName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ARTIST */}

                  <div
                    className="hidden truncate text-sm md:block"
                    style={mutedText}
                  >
                    {artistName}
                  </div>

                  {/* ALBUM */}

                  <div
                    className="hidden truncate text-sm md:block"
                    style={mutedText}
                  >
                    {albumName}
                  </div>

                  {/* ACTIONS */}

                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/artist/songs/edit/${song._id}`}
                      title={`Edit ${song.title || "song"}`}
                      aria-label={`Edit ${song.title || "song"}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:-translate-y-0.5"
                      style={{
                        ...neuRaisedSmall,
                        color: "var(--theme-primary)",
                      }}
                    >
                      <Pencil size={16} />
                    </Link>

                    <IconButton
                      title={`Delete ${song.title || "song"}`}
                      danger
                      disabled={deleting === song._id}
                      onClick={() => handleDelete(song)}
                    >
                      {deleting === song._id ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </IconButton>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* COUNT */}

      {!loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span style={mutedText}>
            Showing {filteredSongs.length} of {songs.length} songs
          </span>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-1 font-semibold transition"
              style={primaryText}
            >
              <X size={14} />
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Songs;