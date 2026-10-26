
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Disc3,
  RefreshCw,
  CalendarDays,
  Music2,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";

import { BASE_URL } from "../../config/api";

// =====================================================
// CONFIGURATION
// =====================================================

const API_BASE = String(BASE_URL || "").replace(/\/+$/, "");

const DEFAULT_COVER = "/image/default-cover.jpg";

const COLORS = {
  background: "var(--theme-background, #252933)",
  surface: "var(--theme-surface, #252933)",
  surfaceLight: "var(--theme-surfaceLight, #2a3543)",
  primary: "var(--theme-primary, #8c7cf7)",
  secondary: "var(--theme-secondary, #2bd4c4)",
  text: "var(--theme-text, #f3f4f6)",
  muted: "var(--theme-textMuted, #9ca3af)",
  border: "var(--theme-border, rgba(255,255,255,0.06))",
  shadowDark: "var(--theme-shadowDark, #0f141a)",
  shadowLight: "var(--theme-shadowLight, #2a3543)",
  danger: "var(--theme-danger, #f87171)",
};

const raisedStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  boxShadow: `8px 8px 16px ${COLORS.shadowDark}, -8px -8px 16px ${COLORS.shadowLight}`,
};

const raisedSmallStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  boxShadow: `4px 4px 9px ${COLORS.shadowDark}, -4px -4px 9px ${COLORS.shadowLight}`,
};

const pressedStyle = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  boxShadow: `inset 4px 4px 8px ${COLORS.shadowDark}, inset -4px -4px 8px ${COLORS.shadowLight}`,
};

const gradientStyle = {
  background:
    "var(--theme-gradient, linear-gradient(135deg, var(--theme-primary, #8c7cf7), var(--theme-secondary, #2bd4c4)))",
  color: "#fff",
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getCoverUrl = (coverImage) => {
  if (!coverImage || typeof coverImage !== "string") {
    return DEFAULT_COVER;
  }

  const path = coverImage.trim();

  if (!path) return DEFAULT_COVER;

  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  return `${API_BASE}/${path.replace(/^\/+/, "")}`;
};

const formatDate = (date) => {
  if (!date) return "No release date";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No release date";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const Albums = () => {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchAlbums = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setNotice("");

      const response = await axios.get(
        `${API_BASE}/api/albums/my`,
        {
          headers: getAuthHeaders(),
        }
      );

      const responseAlbums = response.data?.albums;

      if (!Array.isArray(responseAlbums)) {
        throw new Error(
          response.data?.message || "Invalid album response from server."
        );
      }

      setAlbums(responseAlbums);
    } catch (err) {
      console.error("FETCH ALBUMS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load your albums."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();

    return undefined;
  }, [fetchAlbums]);

  // =====================================================
  // DELETE ALBUM
  // =====================================================

  const handleDelete = async (album) => {
    if (!album?._id || deleting) return;

    const confirmed = window.confirm(
      `Delete "${album.title || "this album"}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(album._id);
      setError("");
      setNotice("");

      await axios.delete(
        `${API_BASE}/api/albums/${encodeURIComponent(album._id)}`,
        {
          headers: getAuthHeaders(),
        }
      );

      setAlbums((previous) =>
        previous.filter((item) => item._id !== album._id)
      );

      setNotice("Album deleted successfully.");
    } catch (err) {
      console.error("DELETE ALBUM ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete album."
      );
    } finally {
      setDeleting(null);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredAlbums = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return albums;

    return albums.filter((album) => {
      const title = album.title?.toLowerCase() || "";
      const artistName = album.artist?.name?.toLowerCase() || "";
      const genre = album.genre?.toLowerCase() || "";

      return (
        title.includes(query) ||
        artistName.includes(query) ||
        genre.includes(query)
      );
    });
  }, [albums, search]);

  const totalAlbums = albums.length;

  const genreCount = useMemo(
    () =>
      new Set(
        albums
          .map((album) => album.genre?.trim())
          .filter(Boolean)
      ).size,
    [albums]
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main
      className="min-w-0 space-y-6 pb-10"
      style={{
        background: COLORS.background,
        color: COLORS.text,
      }}
    >
      {/* HEADER */}
      <header
        className="rounded-3xl p-5 md:p-7"
        style={raisedStyle}
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={pressedStyle}
            >
              <Disc3
                size={29}
                style={{ color: COLORS.primary }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  My Albums
                </h1>

                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    ...pressedStyle,
                    color: COLORS.secondary,
                  }}
                >
                  {totalAlbums} {totalAlbums === 1 ? "Album" : "Albums"}
                </span>
              </div>

              <p
                className="mt-2 text-sm leading-6"
                style={{ color: COLORS.muted }}
              >
                Organize your music, manage album artwork, and keep your
                releases in one place.
              </p>

              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs"
                style={{ color: COLORS.muted }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Disc3
                    size={14}
                    style={{ color: COLORS.primary }}
                  />
                  {totalAlbums} total albums
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Music2
                    size={14}
                    style={{ color: COLORS.secondary }}
                  />
                  {genreCount} genres
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/artist/albums/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-transform active:scale-95 hover:brightness-110"
            style={{
              ...gradientStyle,
              boxShadow: `0 5px 18px color-mix(in srgb, ${COLORS.primary} 20%, transparent)`,
            }}
          >
            <Plus size={19} />
            Add Album
          </Link>
        </div>
      </header>

      {/* SEARCH AND REFRESH */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3.5 rounded-2xl"
          style={pressedStyle}
        >
          <Search
            size={19}
            className="shrink-0"
            style={{ color: COLORS.muted }}
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search albums, artists, or genres..."
            aria-label="Search albums"
            className="w-full min-w-0 bg-transparent outline-none text-sm"
            style={{
              color: COLORS.text,
              colorScheme: "dark",
            }}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="shrink-0 p-1 rounded-lg"
              style={{ color: COLORS.muted }}
            >
              <X size={17} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => fetchAlbums(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-transform active:scale-95 disabled:opacity-50"
          style={raisedSmallStyle}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
            style={{ color: COLORS.secondary }}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* NOTICES */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl text-sm"
          style={{
            ...pressedStyle,
            color: COLORS.danger,
          }}
        >
          <AlertCircle size={19} className="shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0 break-words">
            {error}
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="shrink-0"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 rounded-2xl text-sm"
          style={{
            ...pressedStyle,
            color: COLORS.secondary,
          }}
        >
          <CheckCircle2 size={19} className="shrink-0" />
          <span className="flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* RESULTS SUMMARY */}
      {!loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-sm"
            style={{ color: COLORS.muted }}
          >
            {search.trim()
              ? `${filteredAlbums.length} matching ${
                  filteredAlbums.length === 1 ? "album" : "albums"
                }`
              : "Your album library"}
          </p>

          {search.trim() && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-semibold underline underline-offset-4"
              style={{ color: COLORS.primary }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl p-4 animate-pulse"
              style={raisedStyle}
            >
              <div
                className="aspect-square rounded-2xl"
                style={pressedStyle}
              />

              <div className="space-y-3 mt-5">
                <div
                  className="h-4 w-3/4 rounded-full"
                  style={pressedStyle}
                />

                <div
                  className="h-3 w-1/2 rounded-full"
                  style={pressedStyle}
                />

                <div
                  className="h-11 rounded-xl"
                  style={pressedStyle}
                />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        /* EMPTY STATE */
        <section
          className="min-h-80 md:min-h-96 rounded-3xl flex flex-col items-center justify-center text-center px-5 py-12"
          style={raisedStyle}
        >
          <div
            className="w-20 h-20 flex items-center justify-center rounded-3xl mb-5"
            style={pressedStyle}
          >
            {search ? (
              <Search
                size={32}
                style={{ color: COLORS.primary }}
              />
            ) : (
              <Disc3
                size={35}
                style={{ color: COLORS.primary }}
              />
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold">
            {search ? "No albums found" : "Your music journey starts here"}
          </h2>

          <p
            className="mt-3 max-w-md text-sm leading-6"
            style={{ color: COLORS.muted }}
          >
            {search
              ? "Try a different album title, artist name, or genre."
              : "Create your first album to bring your releases together in one place."}
          </p>

          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold"
              style={raisedSmallStyle}
            >
              <X size={17} />
              Clear Search
            </button>
          ) : (
            <Link
              to="/artist/albums/new"
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-transform active:scale-95"
              style={gradientStyle}
            >
              <Plus size={18} />
              Create Your First Album
            </Link>
          )}
        </section>
      ) : (
        /* ALBUM GRID */
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {filteredAlbums.map((album) => (
            <AlbumCard
              key={album._id}
              album={album}
              deleting={deleting === album._id}
              deleteDisabled={deleting !== null}
              onDelete={() => handleDelete(album)}
            />
          ))}
        </section>
      )}
    </main>
  );
};

// =====================================================
// ALBUM CARD
// =====================================================

const AlbumCard = ({
  album,
  deleting,
  deleteDisabled,
  onDelete,
}) => {
  const [coverFailed, setCoverFailed] = useState(false);

  const coverUrl = getCoverUrl(album.coverImage);

  return (
    <article
      className="group overflow-hidden rounded-3xl min-w-0 transition-transform duration-300 hover:-translate-y-1"
      style={raisedStyle}
    >
      {/* ALBUM ARTWORK */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ background: COLORS.surface }}
      >
        {!coverFailed && coverUrl ? (
          <img
            src={coverUrl}
            alt={`${album.title || "Album"} cover`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={pressedStyle}
          >
            <Disc3
              size={55}
              strokeWidth={1.2}
              style={{ color: COLORS.primary }}
            />

            <span
              className="text-xs"
              style={{ color: COLORS.muted }}
            >
              Album artwork
            </span>
          </div>
        )}

        {/* ARTWORK OVERLAY */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, var(--theme-background, #252933) 0%, color-mix(in srgb, var(--theme-background, #252933) 82%, transparent) 30%, transparent 100%)",
          }}
        />

        {/* ALBUM TITLE */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-xl md:text-2xl font-bold truncate">
            {album.title || "Untitled album"}
          </h2>

          <p
            className="text-sm truncate mt-1"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            {album.artist?.name || "Unknown Artist"}
          </p>
        </div>

        {/* ALBUM BADGE */}
        <div
          className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{
            background: "var(--theme-background, #252933)",
            color: COLORS.secondary,
            border: `1px solid ${COLORS.border}`,
            boxShadow: `3px 3px 7px ${COLORS.shadowDark}, -3px -3px 7px ${COLORS.shadowLight}`,
          }}
        >
          {album.genre || "Uncategorized"}
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={pressedStyle}
          >
            <CalendarDays
              size={16}
              style={{ color: COLORS.secondary }}
            />
          </div>

          <div className="min-w-0">
            <p
              className="text-[11px]"
              style={{ color: COLORS.muted }}
            >
              Release date
            </p>

            <p className="text-sm font-medium mt-0.5 truncate">
              {formatDate(album.releaseDate)}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <Link
            to={`/artist/albums/edit/${album._id}`}
            aria-label={`Edit ${album.title || "album"}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-transform active:scale-95"
            style={{
              ...raisedSmallStyle,
              color: COLORS.primary,
            }}
          >
            <Pencil size={16} />
            Edit
          </Link>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleteDisabled}
            aria-label={`Delete ${album.title || "album"}`}
            title="Delete album"
            className="w-12 flex items-center justify-center rounded-2xl transition-transform active:scale-95 disabled:opacity-40"
            style={{
              ...raisedSmallStyle,
              color: COLORS.danger,
            }}
          >
            {deleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default Albums;
