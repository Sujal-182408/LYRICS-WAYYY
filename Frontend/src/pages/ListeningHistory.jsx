import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Clock3,
  History,
  Music2,
  Play,
  Search,
  CheckCircle2,
  CalendarDays,
  Headphones,
  RefreshCw,
  Trash2,
  Eraser,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getListeningHistory,
  deleteListeningHistoryEntry,
  clearListeningHistory,
} from "../services/profileService";

import { usePlayer } from "../context/PlayerContext";
import { BASE_URL } from "../config/api";

// =====================================================
// CONFIGURATION
// =====================================================

const ITEMS_PER_PAGE = 15;

// =====================================================
// THEME STYLES
// Uses existing ThemeContext CSS variables.
// =====================================================

const raisedStyle = {
  background: "var(--theme-surface)",
  boxShadow:
    "8px 8px 18px var(--theme-shadow-dark), -8px -8px 18px var(--theme-shadow-light)",
  border: "1px solid var(--theme-border)",
  transition: "all 0.3s ease",
};

const pressedStyle = {
  background: "var(--theme-surface)",
  boxShadow:
    "inset 5px 5px 11px var(--theme-shadow-dark), inset -5px -5px 11px var(--theme-shadow-light)",
  border: "1px solid var(--theme-border)",
  transition: "all 0.3s ease",
};

const smallRaisedStyle = {
  background: "var(--theme-surface)",
  boxShadow:
    "5px 5px 10px var(--theme-shadow-dark), -5px -5px 10px var(--theme-shadow-light)",
  border: "1px solid var(--theme-border)",
  transition: "all 0.3s ease",
};

const accentStyle = {
  color: "var(--theme-primary)",
};

const secondaryAccentStyle = {
  color: "var(--theme-secondary)",
};

const mutedTextStyle = {
  color: "var(--theme-text-muted)",
};

const mainTextStyle = {
  color: "var(--theme-text)",
};

// =====================================================
// MEDIA URL
// =====================================================

const getMediaUrl = (path) => {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");

  const baseUrl = String(BASE_URL || "").replace(/\/+$/, "");

  return `${baseUrl}/${cleanPath}`;
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatSeconds = (seconds = 0) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
};

// =====================================================
// DATE FORMATTING
// =====================================================

const formatDate = (date) => {
  if (!date) {
    return "Unknown date";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Unknown date";
  }

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) {
    return "";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =====================================================
// PAGINATION BUTTON
// =====================================================

function PaginationButton({
  children,
  onClick,
  disabled = false,
  active = false,
  label,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
      style={{
        ...(active ? pressedStyle : smallRaisedStyle),
        color: active ? "var(--theme-primary)" : "var(--theme-text)",
      }}
    >
      {children}
    </button>
  );
}

// =====================================================
// COMPONENT
// =====================================================

export default function ListeningHistory() {
  const navigate = useNavigate();
  const { playSong } = usePlayer();

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // ===================================================
  // LOAD ALL HISTORY PAGES
  // ===================================================

  const loadHistory = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      const allHistory = [];

      let page = 1;
      let serverPages = 1;

      do {
        const response = await getListeningHistory({
          page,
          limit: 100,
        });

        if (!response?.success) {
          throw new Error(
            response?.message || "Unable to load listening history.",
          );
        }

        if (Array.isArray(response.history)) {
          allHistory.push(...response.history);
        }

        serverPages = Math.max(1, Number(response.pages) || 1);

        page += 1;
      } while (page <= serverPages);

      setHistory(allHistory);
      setCurrentPage(1);
    } catch (err) {
      console.error("LISTENING HISTORY ERROR:", err);

      setError(err?.message || "Failed to load listening history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return history;
    }

    return history.filter((item) => {
      const song = item.song;

      const title = song?.title?.toLowerCase() || "";

      const artist =
        song?.artist?.name?.toLowerCase() ||
        item.artist?.name?.toLowerCase() ||
        (typeof song?.artist === "string" ? song.artist.toLowerCase() : "");

      const albumValue = song?.album;

      const album =
        typeof albumValue === "string"
          ? albumValue.toLowerCase()
          : (albumValue?.name || albumValue?.title || "").toLowerCase();

      return (
        title.includes(query) || artist.includes(query) || album.includes(query)
      );
    });
  }, [history, search]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    Math.max(totalPages, 1),
  );

  const paginatedHistory = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;

    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, safeCurrentPage]);

  const startEntry =
    filteredHistory.length === 0
      ? 0
      : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endEntry = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    filteredHistory.length,
  );

  // Reset pagination whenever search changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Automatically correct the page after deletion.
  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const totalListeningSeconds = useMemo(
    () =>
      history.reduce(
        (total, item) => total + Number(item.listenedSeconds || 0),
        0,
      ),
    [history],
  );

  const completedCount = useMemo(
    () => history.filter((item) => item.completed).length,
    [history],
  );

  // ===================================================
  // PLAY SONG
  // ===================================================

  const handlePlay = (song) => {
    if (!song) {
      setError("This song is no longer available.");
      return;
    }

    try {
      if (typeof playSong === "function") {
        playSong(song);
      } else {
        setError("The music player is unavailable.");
      }
    } catch (err) {
      console.error("PLAY SONG ERROR:", err);
      setError("Unable to play this song.");
    }
  };

  // ===================================================
  // DELETE SINGLE HISTORY ENTRY
  // ===================================================

  const handleDeleteHistoryEntry = async (historyId) => {
    if (!historyId || deletingId || clearing) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this listening history entry? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(historyId);
      setError("");
      setSuccessMessage("");

      await deleteListeningHistoryEntry(historyId);

      setHistory((current) =>
        current.filter((item) => String(item._id) !== String(historyId)),
      );

      setSuccessMessage("Listening history entry deleted.");
    } catch (err) {
      console.error("DELETE HISTORY ENTRY ERROR:", err);

      setError(err?.message || "Unable to delete this history entry.");
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // CLEAR ALL HISTORY
  // ===================================================

  const handleClearHistory = async () => {
    if (!history.length || clearing || deletingId) {
      return;
    }

    try {
      setClearing(true);
      setError("");
      setSuccessMessage("");

      await clearListeningHistory();

      setHistory([]);
      setSearch("");
      setCurrentPage(1);

      setShowClearConfirmation(false);

      setSuccessMessage("Your listening history has been cleared.");
    } catch (err) {
      console.error("CLEAR HISTORY ERROR:", err);

      setError(err?.message || "Unable to clear listening history.");
    } finally {
      setClearing(false);
    }
  };

  // ===================================================
  // PAGINATION CONTROLS
  // ===================================================

  const renderPagination = () => {
    if (totalPages <= 1) {
      return null;
    }

    let pages = [];

    // Keep the visible page buttons compact on mobile.
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      safeCurrentPage - Math.floor(maxVisiblePages / 2),
    );

    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    startPage = Math.max(1, endPage - maxVisiblePages + 1);

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    return (
      <div
        className="mt-8 flex flex-col items-center gap-4 rounded-3xl p-4 sm:flex-row sm:justify-between"
        style={raisedStyle}
      >
        <p className="text-xs text-center sm:text-left" style={mutedTextStyle}>
          Showing{" "}
          <span className="font-bold" style={mainTextStyle}>
            {startEntry}–{endEntry}
          </span>{" "}
          of{" "}
          <span className="font-bold" style={mainTextStyle}>
            {filteredHistory.length}
          </span>{" "}
          entries
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <PaginationButton
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
            label="Previous page"
          >
            <ChevronLeft size={17} />
          </PaginationButton>

          {startPage > 1 && (
            <>
              <PaginationButton onClick={() => setCurrentPage(1)}>
                1
              </PaginationButton>

              {startPage > 2 && (
                <span className="px-1 text-sm" style={mutedTextStyle}>
                  ...
                </span>
              )}
            </>
          )}

          {pages.map((page) => (
            <PaginationButton
              key={page}
              active={safeCurrentPage === page}
              onClick={() => setCurrentPage(page)}
              label={`Page ${page}`}
            >
              {page}
            </PaginationButton>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-1 text-sm" style={mutedTextStyle}>
                  ...
                </span>
              )}

              <PaginationButton onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </PaginationButton>
            </>
          )}

          <PaginationButton
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={safeCurrentPage === totalPages}
            label="Next page"
          >
            <ChevronRight size={17} />
          </PaginationButton>
        </div>
      </div>
    );
  };

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <div
        className="mt-20 flex min-h-screen items-center justify-center px-4"
        style={{
          background: "var(--theme-background)",
          color: "var(--theme-text)",
          transition: "all 0.3s ease",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={raisedStyle}
          >
            <History size={24} className="animate-pulse" style={accentStyle} />
          </div>

          <p className="text-sm" style={mutedTextStyle}>
            Loading your listening history...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div
      className="mt-20 min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{
        background: "var(--theme-background)",
        color: "var(--theme-text)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadHistory(true)}
                disabled={refreshing || clearing}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
                style={raisedStyle}
                title="Refresh history"
                aria-label="Refresh listening history"
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                  style={refreshing ? accentStyle : mutedTextStyle}
                />
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirmation(true)}
                disabled={!history.length || clearing || Boolean(deletingId)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-red-400 transition hover:scale-105 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                style={raisedStyle}
              >
                <Eraser size={17} />
                Clear History
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={pressedStyle}
              >
                <History size={23} style={accentStyle} />
              </div>

              <div>
                <h1
                  className="text-2xl font-bold sm:text-3xl"
                  style={mainTextStyle}
                >
                  Listening History
                </h1>

                <p className="mt-1 text-sm" style={mutedTextStyle}>
                  Everything you've listened to
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs" style={mutedTextStyle}>
              {history.length} {history.length === 1 ? "play" : "plays"}{" "}
              recorded
            </p>
          </div>
        </div>

        {/* STATISTICS */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl p-5" style={raisedStyle}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={pressedStyle}
              >
                <Headphones size={19} style={accentStyle} />
              </div>

              <div>
                <p
                  className="text-xs uppercase tracking-wider"
                  style={mutedTextStyle}
                >
                  Plays
                </p>

                <p className="text-xl font-bold" style={mainTextStyle}>
                  {history.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-5" style={raisedStyle}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={pressedStyle}
              >
                <Clock3 size={19} style={secondaryAccentStyle} />
              </div>

              <div>
                <p
                  className="text-xs uppercase tracking-wider"
                  style={mutedTextStyle}
                >
                  Listening
                </p>

                <p className="text-xl font-bold" style={mainTextStyle}>
                  {formatSeconds(totalListeningSeconds)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl p-5" style={raisedStyle}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={pressedStyle}
              >
                <CheckCircle2 size={19} className="text-green-400" />
              </div>

              <div>
                <p
                  className="text-xs uppercase tracking-wider"
                  style={mutedTextStyle}
                >
                  Completed
                </p>

                <p className="text-xl font-bold" style={mainTextStyle}>
                  {completedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="mb-7 rounded-3xl p-3" style={pressedStyle}>
          <div className="flex items-center gap-3 px-3">
            <Search size={19} className="shrink-0" style={mutedTextStyle} />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search songs, artists or albums..."
              className="w-full border-none bg-transparent py-2 text-sm outline-none"
              style={{
                color: "var(--theme-text)",
              }}
              aria-label="Search listening history"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:scale-105"
                style={mutedTextStyle}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl p-4 text-sm text-red-400"
            style={pressedStyle}
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl p-4 text-sm text-green-400"
            style={pressedStyle}
          >
            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {filteredHistory.length === 0 ? (
          <div
            className="rounded-[2rem] px-6 py-20 text-center"
            style={raisedStyle}
          >
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={pressedStyle}
            >
              <Music2 size={30} style={mutedTextStyle} />
            </div>

            <h2 className="mb-2 text-xl font-semibold" style={mainTextStyle}>
              {search ? "No matching songs" : "No listening history yet"}
            </h2>

            <p className="mx-auto max-w-md text-sm" style={mutedTextStyle}>
              {search
                ? "Try another song, artist, or album name."
                : "Start listening to songs and your history will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold transition hover:scale-105"
                style={{
                  ...raisedStyle,
                  color: "var(--theme-primary)",
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* RESULTS COUNT */}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold" style={mainTextStyle}>
                {search ? "Search Results" : "Recently Played"}
              </h2>

              <span className="text-xs" style={mutedTextStyle}>
                Showing {startEntry}–{endEntry} of {filteredHistory.length}{" "}
                entries
              </span>
            </div>

            {/* HISTORY LIST */}

            <div className="space-y-4">
              {paginatedHistory.map((item, index) => {
                const song = item.song;
                const artist = song?.artist || item.artist;

                const cover = getMediaUrl(song?.coverImage || artist?.image);

                const historyId = item._id;

                const isDeleting = String(deletingId) === String(historyId);

                return (
                  <div
                    key={historyId || `${song?._id || "song"}-${index}`}
                    className="group rounded-3xl p-4 transition-all duration-300 hover:-translate-y-0.5 sm:p-5"
                    style={{
                      ...raisedStyle,
                      opacity: isDeleting ? 0.55 : 1,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      {/* COVER */}

                      <div
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20"
                        style={smallRaisedStyle}
                      >
                        {cover ? (
                          <img
                            src={cover}
                            alt={song?.title || "Song cover"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              background: "var(--theme-surface)",
                            }}
                          >
                            <Music2 size={24} style={mutedTextStyle} />
                          </div>
                        )}

                        {/* COVER PLAY BUTTON */}

                        <button
                          type="button"
                          onClick={() => handlePlay(song)}
                          disabled={!song || isDeleting}
                          className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 disabled:cursor-not-allowed"
                          aria-label={`Play ${song?.title || "song"}`}
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10"
                            style={{
                              background: "var(--theme-primary)",
                              boxShadow: "0 0 18px var(--theme-glow-primary)",
                            }}
                          >
                            <Play
                              size={17}
                              fill="white"
                              className="ml-0.5 text-white"
                            />
                          </div>
                        </button>
                      </div>

                      {/* SONG INFORMATION */}

                      <div className="min-w-0 flex-1">
                        <h3
                          className="truncate font-semibold"
                          style={mainTextStyle}
                        >
                          {song?.title || "Unknown song"}
                        </h3>

                        <p
                          className="mt-1 truncate text-sm"
                          style={mutedTextStyle}
                        >
                          {artist?.name || "Unknown artist"}
                        </p>

                        <div
                          className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                          style={mutedTextStyle}
                        >
                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} />
                            {formatDate(item.startedAt)}
                          </span>

                          <span className="flex items-center gap-1">
                            <Clock3 size={13} />
                            {formatSeconds(item.listenedSeconds)}
                          </span>

                          {item.completed && (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 size={13} />
                              Completed
                            </span>
                          )}
                        </div>

                        <p
                          className="mt-2 text-xs md:hidden"
                          style={mutedTextStyle}
                        >
                          {formatDateTime(item.startedAt)}
                        </p>
                      </div>

                      {/* DESKTOP TIME */}

                      <div className="hidden shrink-0 text-right md:block">
                        <p className="text-xs" style={mutedTextStyle}>
                          Played
                        </p>

                        <p className="mt-1 text-sm" style={mainTextStyle}>
                          {formatDateTime(item.startedAt)}
                        </p>
                      </div>

                      {/* PLAY BUTTON */}

                      <button
                        type="button"
                        onClick={() => handlePlay(song)}
                        disabled={!song || isDeleting}
                        className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-40 sm:flex"
                        style={raisedStyle}
                        aria-label={`Play ${song?.title || "song"}`}
                        title="Play song"
                      >
                        <Play
                          size={17}
                          style={accentStyle}
                          fill="currentColor"
                        />
                      </button>

                      {/* DELETE ENTRY */}

                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryEntry(historyId)}
                        disabled={!historyId || Boolean(deletingId) || clearing}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-400 transition hover:scale-105 hover:text-red-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                        style={raisedStyle}
                        aria-label={`Delete ${song?.title || "history entry"}`}
                        title="Delete this entry"
                      >
                        {isDeleting ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}

            {renderPagination()}
          </>
        )}
      </div>

      {/* CLEAR HISTORY CONFIRMATION */}

      {showClearConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !clearing) {
              setShowClearConfirmation(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-history-title"
            className="w-full max-w-md rounded-3xl p-6 sm:p-7"
            style={{
              ...raisedStyle,
              boxShadow:
                "12px 12px 28px var(--theme-shadow-dark), -8px -8px 24px var(--theme-shadow-light)",
            }}
          >
            <div className="mb-5 flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-red-400"
                style={pressedStyle}
              >
                <Eraser size={22} />
              </div>

              <div>
                <h2
                  id="clear-history-title"
                  className="text-lg font-bold"
                  style={mainTextStyle}
                >
                  Clear listening history?
                </h2>

                <p className="mt-2 text-sm leading-6" style={mutedTextStyle}>
                  This will permanently delete all{" "}
                  <span className="font-semibold" style={mainTextStyle}>
                    {history.length}
                  </span>{" "}
                  listening history entries from your account. This action
                  cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {/* CANCEL */}

              <button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                disabled={clearing}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:scale-105 disabled:opacity-50"
                style={{
                  ...raisedStyle,
                  color: "var(--theme-text)",
                }}
              >
                <X size={16} />
                Cancel
              </button>

              {/* CONFIRM DELETE */}

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing || history.length === 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:scale-105 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete All History
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
