
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
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
  UserRound,
  X,
} from "lucide-react";

import {
  getListeningHistory,
  deleteListeningHistoryEntry,
  clearListeningHistory,
} from "../services/profileService";

import { usePlayer } from "../context/PlayerContext";

import { BASE_URL } from "../config/api";

// =====================================================
// COLORS
// =====================================================

const BASE = "#252933";
const LIGHT = "#2a3543";
const DARK = "#0f141a";
const PRIMARY = "#8c7cf7";
const SECONDARY = "#2bd4c4";

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

  const cleanPath = path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  const baseUrl = BASE_URL.replace(/\/+$/, "");

  return `${baseUrl}/${cleanPath}`;
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatSeconds = (seconds = 0) => {
  const total = Math.max(
    0,
    Math.floor(Number(seconds) || 0)
  );

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
// DATE
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
// NEUMORPHIC STYLES
// =====================================================

const raisedShadow = `
  8px 8px 18px ${DARK},
  -8px -8px 18px ${LIGHT}
`;

const pressedShadow = `
  inset 5px 5px 11px ${DARK},
  inset -5px -5px 11px ${LIGHT}
`;

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
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] =
    useState(false);

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
      let totalPages = 1;

      do {
        const response = await getListeningHistory({
          page,
          limit: 100,
        });

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Unable to load listening history."
          );
        }

        if (Array.isArray(response.history)) {
          allHistory.push(...response.history);
        }

        totalPages = Math.max(
          1,
          Number(response.pages) || 1
        );

        page += 1;
      } while (page <= totalPages);

      setHistory(allHistory);
    } catch (err) {
      console.error("LISTENING HISTORY ERROR:", err);

      setError(
        err?.message ||
          "Failed to load listening history."
      );
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

      const title =
        song?.title?.toLowerCase() || "";

      const artist =
        song?.artist?.name?.toLowerCase() ||
        item.artist?.name?.toLowerCase() ||
        (typeof song?.artist === "string"
          ? song.artist.toLowerCase()
          : "");

      const albumValue = song?.album;
      const album =
        typeof albumValue === "string"
          ? albumValue.toLowerCase()
          : (
              albumValue?.name ||
              albumValue?.title ||
              ""
            ).toLowerCase();

      return (
        title.includes(query) ||
        artist.includes(query) ||
        album.includes(query)
      );
    });
  }, [history, search]);

  // ===================================================
  // STATS
  // ===================================================

  const totalListeningSeconds = useMemo(
    () =>
      history.reduce(
        (total, item) =>
          total + Number(item.listenedSeconds || 0),
        0
      ),
    [history]
  );

  const completedCount = useMemo(
    () =>
      history.filter((item) => item.completed).length,
    [history]
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
      "Delete this listening history entry? This cannot be undone."
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
        current.filter(
          (item) =>
            String(item._id) !== String(historyId)
        )
      );

      setSuccessMessage("Listening history entry deleted.");
    } catch (err) {
      console.error("DELETE HISTORY ENTRY ERROR:", err);

      setError(
        err?.message ||
          "Unable to delete this history entry."
      );
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
      setShowClearConfirmation(false);

      setSuccessMessage("Your listening history has been cleared.");
    } catch (err) {
      console.error("CLEAR HISTORY ERROR:", err);

      setError(
        err?.message ||
          "Unable to clear listening history."
      );
    } finally {
      setClearing(false);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: BASE }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              background: BASE,
              boxShadow: raisedShadow,
            }}
          >
            <History
              size={24}
              className="animate-pulse"
              style={{ color: PRIMARY }}
            />
          </div>

          <p className="text-sm text-gray-400">
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
      className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8 mt-20 "
      style={{
        background: BASE,
        color: "#fff",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}


        <div className="mb-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95"
              style={{
                background: BASE,
                boxShadow: raisedShadow,
              }}
              title="Back to profile"
              aria-label="Back to profile"
            >
              <ArrowLeft
                size={20}
                className="text-gray-300"
              />
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadHistory(true)}
                disabled={refreshing || clearing}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: BASE,
                  boxShadow: raisedShadow,
                }}
                title="Refresh history"
                aria-label="Refresh listening history"
              >
                <RefreshCw
                  size={18}
                  className={
                    refreshing
                      ? "animate-spin"
                      : "text-gray-300"
                  }
                  style={
                    refreshing
                      ? { color: PRIMARY }
                      : undefined
                  }
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowClearConfirmation(true)
                }
                disabled={!history.length || clearing || Boolean(deletingId)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background: BASE,
                  boxShadow: raisedShadow,
                }}
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
                style={{
                  background: BASE,
                  boxShadow: pressedShadow,
                }}
              >
                <History
                  size={23}
                  style={{ color: PRIMARY }}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Listening History
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  Everything you&apos;ve listened to
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {history.length}{" "}
              {history.length === 1 ? "play" : "plays"} recorded
            </p>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="rounded-3xl p-5"
            style={{
              background: BASE,
              boxShadow: raisedShadow,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background: BASE,
                  boxShadow: pressedShadow,
                }}
              >
                <Headphones
                  size={19}
                  style={{ color: PRIMARY }}
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Plays
                </p>

                <p className="text-xl font-bold">
                  {history.length}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl p-5"
            style={{
              background: BASE,
              boxShadow: raisedShadow,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background: BASE,
                  boxShadow: pressedShadow,
                }}
              >
                <Clock3
                  size={19}
                  style={{ color: SECONDARY }}
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Listening
                </p>

                <p className="text-xl font-bold">
                  {formatSeconds(totalListeningSeconds)}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl p-5"
            style={{
              background: BASE,
              boxShadow: raisedShadow,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background: BASE,
                  boxShadow: pressedShadow,
                }}
              >
                <CheckCircle2
                  size={19}
                  className="text-green-400"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Completed
                </p>

                <p className="text-xl font-bold">
                  {completedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div
          className="mb-7 rounded-3xl p-3"
          style={{
            background: BASE,
            boxShadow: pressedShadow,
          }}
        >
          <div className="flex items-center gap-3 px-3">
            <Search
              size={19}
              className="shrink-0 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search songs, artists or albums..."
              className="w-full border-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-gray-500"
              aria-label="Search listening history"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:text-white"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl p-4 text-sm text-red-300"
            style={{
              background: BASE,
              boxShadow: pressedShadow,
            }}
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-2xl p-4 text-sm text-green-300"
            style={{
              background: BASE,
              boxShadow: pressedShadow,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* EMPTY STATE */}

        {filteredHistory.length === 0 ? (
          <div
            className="rounded-[2rem] px-6 py-20 text-center"
            style={{
              background: BASE,
              boxShadow: raisedShadow,
            }}
          >
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: BASE,
                boxShadow: pressedShadow,
              }}
            >
              <Music2
                size={30}
                className="text-gray-500"
              />
            </div>

            <h2 className="mb-2 text-xl font-semibold">
              {search
                ? "No matching songs"
                : "No listening history yet"}
            </h2>

            <p className="mx-auto max-w-md text-sm text-gray-500">
              {search
                ? "Try another song, artist, or album name."
                : "Start listening to songs and your history will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{
                  color: PRIMARY,
                  background: BASE,
                  boxShadow: raisedShadow,
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
              <h2 className="text-sm font-semibold text-gray-300">
                {search
                  ? "Search Results"
                  : "Recently Played"}
              </h2>

              <span className="text-xs text-gray-500">
                Showing {filteredHistory.length}{" "}
                {filteredHistory.length === 1
                  ? "entry"
                  : "entries"}
              </span>
            </div>

            {/* HISTORY LIST */}

            <div className="space-y-4">
              {filteredHistory.map((item, index) => {
                const song = item.song;

                const artist =
                  song?.artist || item.artist;

                const cover = getMediaUrl(
                  song?.coverImage ||
                    artist?.image
                );

                const historyId = item._id;

                const isDeleting =
                  String(deletingId) === String(historyId);

                return (
                  <div
                    key={
                      historyId ||
                      `${song?._id || "song"}-${index}`
                    }
                    className="group rounded-3xl p-4 transition-all duration-200 hover:-translate-y-0.5 sm:p-5"
                    style={{
                      background: BASE,
                      boxShadow: raisedShadow,
                      opacity: isDeleting ? 0.55 : 1,
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      {/* COVER */}

                      <div
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20"
                        style={{
                          boxShadow: `
                            5px 5px 10px ${DARK},
                            -5px -5px 10px ${LIGHT}
                          `,
                        }}
                      >
                        {cover ? (
                          <img
                            src={cover}
                            alt={song?.title || "Song cover"}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              background: "#1d2128",
                            }}
                          >
                            <Music2
                              size={24}
                              className="text-gray-500"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePlay(song)}
                          disabled={!song || isDeleting}
                          className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Play ${song?.title || "song"}`}
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10"
                            style={{ background: PRIMARY }}
                          >
                            <Play
                              size={17}
                              fill="white"
                              className="ml-0.5"
                            />
                          </div>
                        </button>
                      </div>

                      {/* SONG INFO */}

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-white">
                          {song?.title || "Unknown song"}
                        </h3>

                        <p className="mt-1 truncate text-sm text-gray-400">
                          {artist?.name || "Unknown artist"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
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

                        <p className="mt-2 text-xs text-gray-500 md:hidden">
                          {formatDateTime(item.startedAt)}
                        </p>
                      </div>

                      {/* DESKTOP TIME */}

                      <div className="hidden shrink-0 text-right md:block">
                        <p className="text-xs text-gray-500">
                          Played
                        </p>

                        <p className="mt-1 text-sm text-gray-300">
                          {formatDateTime(item.startedAt)}
                        </p>
                      </div>

                      {/* PLAY BUTTON */}

                      <button
                        type="button"
                        onClick={() => handlePlay(song)}
                        disabled={!song || isDeleting}
                        className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95 disabled:opacity-40 sm:flex"
                        style={{
                          background: BASE,
                          boxShadow: raisedShadow,
                        }}
                        aria-label={`Play ${song?.title || "song"}`}
                        title="Play song"
                      >
                        <Play
                          size={17}
                          style={{ color: PRIMARY }}
                          fill="currentColor"
                        />
                      </button>

                      {/* DELETE ENTRY */}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteHistoryEntry(historyId)
                        }
                        disabled={
                          !historyId ||
                          Boolean(deletingId) ||
                          clearing
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-400 transition hover:scale-105 hover:text-red-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                        style={{
                          background: BASE,
                          boxShadow: raisedShadow,
                        }}
                        aria-label={`Delete ${song?.title || "history entry"}`}
                        title="Delete this entry"
                      >
                        {isDeleting ? (
                          <RefreshCw
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
              background: BASE,
              boxShadow: `
                12px 12px 28px ${DARK},
                -8px -8px 24px ${LIGHT}
              `,
            }}
          >
            <div className="mb-5 flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-red-400"
                style={{
                  background: BASE,
                  boxShadow: pressedShadow,
                }}
              >
                <Eraser size={22} />
              </div>

              <div>
                <h2
                  id="clear-history-title"
                  className="text-lg font-bold text-white"
                >
                  Clear listening history?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  This will permanently delete all{" "}
                  <span className="font-semibold text-white">
                    {history.length}
                  </span>{" "}
                  listening history entries from your account.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowClearConfirmation(false)
                }
                disabled={clearing}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-gray-300 transition hover:text-white disabled:opacity-50"
                style={{
                  background: BASE,
                  boxShadow: raisedShadow,
                }}
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing || history.length === 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {clearing ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
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
