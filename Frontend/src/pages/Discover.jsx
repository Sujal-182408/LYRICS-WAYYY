import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Play,
  Pause,
  Music2,
  Headphones,
  TrendingUp,
  Clock3,
  ListMusic,
  RefreshCw,
  AlertCircle,
  Radio,
  Disc3,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";

import { usePlayer } from "../context/PlayerContext";

import {
  getTrendingAudiusTracks,
  searchAudiusTracks,
} from "../services/audiusService";

// ============================================================
// HELPERS
// ============================================================

const formatDuration = (seconds) => {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) {
    return "--:--";
  }

  const minutes = Math.floor(value / 60);
  const remainingSeconds = Math.floor(value % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getTrackId = (track) => {
  if (!track) return "";

  return String(
    track.externalTrackId ||
      String(track._id || "").replace(/^audius:/, ""),
  );
};

const getArtwork = (track) =>
  track?.coverImage ||
  track?.image ||
  track?.albumImage ||
  track?.externalMetadata?.artwork ||
  "";

const normalizeTrack = (track) => ({
  ...track,
  _id: String(track._id).startsWith("audius:")
    ? track._id
    : `audius:${getTrackId(track)}`,
  source: "audius",
  externalTrackId: getTrackId(track),
});

// ============================================================
// NEUMORPHIC BUTTON
// ============================================================

const SoftButton = ({
  children,
  onClick,
  title,
  className = "",
  disabled = false,
  type = "button",
}) => (
  <button
    type={type}
    title={title}
    aria-label={title}
    disabled={disabled}
    onClick={onClick}
    className={`
      inline-flex items-center justify-center gap-2
      rounded-xl border border-white/[0.04]
      bg-[#20252e] text-gray-300
      shadow-[5px_5px_10px_#12151b,-5px_-5px_10px_#2c333d]
      transition-all duration-200
      hover:text-purple-300
      hover:shadow-[inset_3px_3px_6px_#12151b,inset_-3px_-3px_6px_#2c333d]
      active:scale-[0.97]
      disabled:cursor-not-allowed disabled:opacity-40
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-purple-400
      ${className}
    `}
  >
    {children}
  </button>
);

// ============================================================
// TRACK CARD
// ============================================================

const TrackCard = ({
  track,
  index,
  currentSong,
  playing,
  onPlay,
  onAddToQueue,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const isCurrent =
    String(currentSong?._id || "") === String(track._id || "");

  const isPlaying = isCurrent && playing;

  const artwork = getArtwork(track);

  useEffect(() => {
    setImageFailed(false);
  }, [artwork]);

  return (
    <article
      className={`
        group relative flex min-w-0 flex-col
        overflow-hidden rounded-2xl
        border border-white/[0.035]
        bg-[#20252e] p-3 sm:p-4
        shadow-[6px_6px_14px_#12151b,-6px_-6px_14px_#2c333d]
        transition-all duration-300
        hover:-translate-y-1
        hover:border-purple-400/20
        hover:shadow-[8px_8px_18px_#11141a,-8px_-8px_18px_#303744]
      `}
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-[#191d24] shadow-[inset_4px_4px_8px_#11141a,inset_-4px_-4px_8px_#292f39]">
        {artwork && !imageFailed ? (
          <img
            src={artwork}
            alt={`${track.title || "Track"} artwork`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={`
              h-full w-full object-cover
              transition-transform duration-500
              group-hover:scale-105
              ${isCurrent ? "opacity-90" : ""}
            `}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2
              size={42}
              className="text-purple-300/60"
              aria-hidden="true"
            />
          </div>
        )}

        {isCurrent && playing && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-white/10 bg-black/65 px-2 py-1 text-[10px] font-semibold text-teal-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" />
            NOW PLAYING
          </div>
        )}

        <button
          type="button"
          onClick={() => onPlay(track)}
          aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title}`}
          className="
            absolute bottom-3 right-3 flex h-11 w-11
            items-center justify-center rounded-full
            border border-white/10 bg-purple-500
            text-white shadow-[0_5px_18px_rgba(139,92,246,0.35)]
            transition-all duration-200
            hover:scale-110 hover:bg-purple-400
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-white
          "
        >
          {isPlaying ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h3
          title={track.title}
          className={`
            truncate text-sm font-bold sm:text-base
            ${isCurrent ? "text-purple-300" : "text-gray-100"}
          `}
        >
          {track.title || "Untitled Track"}
        </h3>

        <p
          title={track.artist}
          className="mt-1 truncate text-xs text-gray-400 sm:text-sm"
        >
          {track.artist || "Unknown Artist"}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-gray-500">
            <Clock3 size={12} className="shrink-0" />
            {formatDuration(track.duration)}
          </span>

          <button
            type="button"
            title="Add to queue"
            aria-label={`Add ${track.title} to queue`}
            onClick={() => onAddToQueue(track)}
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-lg bg-[#20252e] text-gray-400
              shadow-[3px_3px_6px_#12151b,-3px_-3px_6px_#2c333d]
              transition-all hover:text-teal-300
              hover:shadow-[inset_2px_2px_4px_#12151b,inset_-2px_-2px_4px_#2c333d]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-teal-400
            "
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      {track.permalink && (
        <a
          href={track.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-3 inline-flex items-center gap-1
            text-[11px] text-gray-500 transition-colors
            hover:text-purple-300
          "
        >
          View on Audius
          <ExternalLink size={11} />
        </a>
      )}
    </article>
  );
};

// ============================================================
// TRACK ROW
// ============================================================

const TrackRow = ({
  track,
  index,
  currentSong,
  playing,
  onPlay,
  onAddToQueue,
}) => {
  const artwork = getArtwork(track);

  const isCurrent =
    String(currentSong?._id || "") === String(track._id || "");

  const isPlaying = isCurrent && playing;

  return (
    <div
      className={`
        group flex min-w-0 items-center gap-3
        rounded-xl border border-transparent
        px-3 py-3 transition-all duration-200
        hover:border-white/[0.04] hover:bg-white/[0.025]
        ${isCurrent ? "bg-purple-400/[0.06]" : ""}
      `}
    >
      <span className="w-5 shrink-0 text-center text-xs text-gray-500">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#191d24]">
        {artwork ? (
          <img
            src={artwork}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Music2 size={20} className="text-purple-300/70" />
          </div>
        )}

        <button
          type="button"
          onClick={() => onPlay(track)}
          aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title}`}
          className="
            absolute inset-0 flex items-center justify-center
            bg-black/60 text-white opacity-0
            transition-opacity group-hover:opacity-100
            focus-visible:opacity-100
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-purple-400
          "
        >
          {isPlaying ? (
            <Pause size={17} />
          ) : (
            <Play size={17} fill="currentColor" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={() => onPlay(track)}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <p
          className={`
            truncate text-sm font-semibold
            ${isCurrent ? "text-purple-300" : "text-gray-200"}
          `}
        >
          {track.title || "Untitled Track"}
        </p>

        <p className="mt-1 truncate text-xs text-gray-500">
          {track.artist || "Unknown Artist"}
        </p>
      </button>

      <span className="hidden shrink-0 text-xs text-gray-500 sm:block">
        {track.genre || "Music"}
      </span>

      <span className="w-12 shrink-0 text-right text-xs text-gray-500">
        {formatDuration(track.duration)}
      </span>

      <button
        type="button"
        title="Add to queue"
        aria-label={`Add ${track.title} to queue`}
        onClick={() => onAddToQueue(track)}
        className="
          flex h-9 w-9 shrink-0 items-center justify-center
          rounded-lg text-gray-400
          transition-colors hover:bg-white/5 hover:text-teal-300
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-teal-400
        "
      >
        <Plus size={17} />
      </button>
    </div>
  );
};

// ============================================================
// DISCOVER PAGE
// ============================================================

const Discover = () => {
  const {
    currentSong,
    playing,
    playSong,
    addToQueue,
    queue,
  } = usePlayer();

  const [tracks, setTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [timeRange, setTimeRange] = useState("week");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const searchInputRef = useRef(null);
  const requestIdRef = useRef(0);
  const searchTimerRef = useRef(null);

  const displayedTracks =
    activeTab === "search" ? searchResults : tracks;

  // ----------------------------------------------------------
  // LOAD TRENDING
  // ----------------------------------------------------------

  const loadTrending = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const result = await getTrendingAudiusTracks({
        limit: 30,
        offset: 0,
        time: timeRange,
      });

      if (requestId !== requestIdRef.current) return;

      setTracks(
        Array.isArray(result)
          ? result.map(normalizeTrack).filter((track) => track.externalTrackId)
          : [],
      );
    } catch (err) {
      console.error("Could not load Audius trending tracks:", err);

      if (requestId !== requestIdRef.current) return;

      setError(
        err?.message ||
          "Unable to load trending tracks. Please try again.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [timeRange]);

  useEffect(() => {
    loadTrending();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadTrending]);

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const runSearch = useCallback(async (searchTerm) => {
    const term = String(searchTerm || "").trim();

    if (!term) {
      setActiveTab("trending");
      setSearchResults([]);
      setSearching(false);
      setError("");
      return;
    }

    const requestId = ++requestIdRef.current;

    setSearching(true);
    setError("");
    setActiveTab("search");

    try {
      const result = await searchAudiusTracks(term, {
        limit: 30,
        offset: 0,
      });

      if (requestId !== requestIdRef.current) return;

      setSearchResults(
        Array.isArray(result)
          ? result.map(normalizeTrack).filter((track) => track.externalTrackId)
          : [],
      );
    } catch (err) {
      console.error("Audius search failed:", err);

      if (requestId !== requestIdRef.current) return;

      setSearchResults([]);
      setError(
        err?.message ||
          "Search failed. Check your connection and try again.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
      }
    }
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setQuery(value);
    setError("");
    setNotice("");

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!value.trim()) {
      requestIdRef.current += 1;
      setActiveTab("trending");
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setActiveTab("search");
    setSearching(true);

    searchTimerRef.current = setTimeout(() => {
      runSearch(value);
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    runSearch(query);
  };

  const clearSearch = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    requestIdRef.current += 1;

    setQuery("");
    setSearchResults([]);
    setActiveTab("trending");
    setSearching(false);
    setError("");
    setNotice("");

    searchInputRef.current?.focus();
  };

  // ----------------------------------------------------------
  // PLAYBACK
  // ----------------------------------------------------------

  const handlePlay = async (track) => {
    if (!track?.externalTrackId) {
      setError("This track does not have a valid Audius track ID.");
      return;
    }

    setError("");
    setNotice("");

    try {
      // Keep the provider's track metadata and ID intact.
      const normalized = normalizeTrack(track);

      const list = displayedTracks.map(normalizeTrack);

      const index = list.findIndex(
        (item) => String(item._id) === String(normalized._id),
      );

      await playSong(
        normalized,
        index >= 0 ? index : 0,
        list.length ? list : [normalized],
      );
    } catch (err) {
      console.error("Audius playback failed:", err);

      setError(
        "Could not start this track. Please try another track.",
      );
    }
  };

  const handleAddToQueue = (track) => {
    if (!track?.externalTrackId) {
      setError("This track cannot be added to the queue.");
      return;
    }

    try {
      const normalized = normalizeTrack(track);

      addToQueue(normalized);

      setNotice(
        queue.some(
          (item) => String(item?._id) === String(normalized._id),
        )
          ? "This track is already in your queue."
          : `"${normalized.title}" added to your queue.`,
      );

      window.setTimeout(() => {
        setNotice("");
      }, 2500);
    } catch (err) {
      console.error("Could not add track to queue:", err);
      setError("Could not add this track to the queue.");
    }
  };

  const handleTimeRange = (range) => {
    setTimeRange(range);
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#191d24] px-4 py-6 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20252e] text-purple-300 shadow-[4px_4px_8px_#11141a,-4px_-4px_8px_#292f39]">
                <Headphones size={19} />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.25em] text-purple-300">
                JOY MUSIC
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Discover{" "}
              <span className="bg-gradient-to-r from-purple-300 to-teal-300 bg-clip-text text-transparent">
                Music
              </span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
              Discover trending tracks and find your next favorite
              sound.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl border border-white/[0.03] bg-[#20252e] px-4 py-3 shadow-[5px_5px_10px_#12151b,-5px_-5px_10px_#2c333d] sm:self-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#20252e] text-teal-300 shadow-[inset_3px_3px_6px_#12151b,inset_-3px_-3px_6px_#2c333d]">
              <Radio size={18} />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-200">
                Audius Discovery
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                External music catalog
              </p>
            </div>
          </div>
        </header>

        {/* SEARCH */}
        <section className="mb-7">
          <form
            onSubmit={submitSearch}
            className="
              flex items-center gap-3 rounded-2xl
              border border-white/[0.035] bg-[#20252e]
              p-3 shadow-[inset_5px_5px_10px_#12151b,inset_-5px_-5px_10px_#2c333d]
              sm:p-4
            "
          >
            <Search
              size={21}
              className="ml-1 shrink-0 text-purple-300"
            />

            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={handleSearchChange}
              placeholder="Search songs, artists, or sounds..."
              aria-label="Search music"
              className="
                min-w-0 flex-1 bg-transparent
                py-2 text-sm text-gray-100
                outline-none placeholder:text-gray-500
              "
            />

            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <X size={17} />
              </button>
            )}

            <SoftButton
              type="submit"
              disabled={!query.trim() || searching}
              className="h-10 shrink-0 rounded-lg px-4 text-xs font-bold sm:px-5"
            >
              {searching ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                "Search"
              )}
            </SoftButton>
          </form>
        </section>

        {/* NOTICES */}
        {notice && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-xl border border-teal-300/10 bg-teal-400/[0.06] px-4 py-3 text-sm text-teal-300"
          >
            <ListMusic size={17} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-300"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-200">
                Something went wrong
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-red-200/70">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");

                if (activeTab === "search" && query.trim()) {
                  runSearch(query);
                } else {
                  loadTrending();
                }
              }}
              className="shrink-0 text-xs font-semibold text-red-200 underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <section className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <SoftButton
              onClick={() => {
                setActiveTab("trending");

                if (query) {
                  setQuery("");
                  setSearchResults([]);
                  setSearching(false);
                }
              }}
              className={`
                h-10 px-4 text-xs font-semibold
                ${
                  activeTab === "trending"
                    ? "text-purple-300 shadow-[inset_3px_3px_6px_#12151b,inset_-3px_-3px_6px_#2c333d]"
                    : ""
                }
              `}
            >
              <TrendingUp size={15} />
              Trending
            </SoftButton>

            <SoftButton
              onClick={() => {
                searchInputRef.current?.focus();

                if (query.trim()) {
                  runSearch(query);
                }
              }}
              className={`
                h-10 px-4 text-xs font-semibold
                ${
                  activeTab === "search"
                    ? "text-purple-300 shadow-[inset_3px_3px_6px_#12151b,inset_-3px_-3px_6px_#2c333d]"
                    : ""
                }
              `}
            >
              <Search size={15} />
              Search Results
            </SoftButton>
          </div>

          {activeTab === "trending" && (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-gray-500 sm:block">
                Trending period
              </span>

              <select
                value={timeRange}
                onChange={(event) => handleTimeRange(event.target.value)}
                aria-label="Trending period"
                className="
                  h-10 max-w-full rounded-lg border
                  border-white/[0.04] bg-[#20252e] px-3
                  text-xs text-gray-300 outline-none
                  shadow-[3px_3px_6px_#12151b,-3px_-3px_6px_#2c333d]
                  focus:ring-2 focus:ring-purple-400
                "
              >
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="allTime">All time</option>
              </select>

              <SoftButton
                onClick={loadTrending}
                disabled={loading}
                title="Refresh trending tracks"
                className="h-10 w-10"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
              </SoftButton>
            </div>
          )}
        </section>

        {/* SECTION TITLE */}
        <section className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              {activeTab === "search" ? (
                <Search size={15} />
              ) : (
                <TrendingUp size={15} />
              )}

              {activeTab === "search"
                ? "Music Search"
                : "Discover What's Trending"}
            </div>

            <h2 className="text-xl font-bold sm:text-2xl">
              {activeTab === "search"
                ? `Results${query.trim() ? ` for "${query.trim()}"` : ""}`
                : "Trending Tracks"}
            </h2>
          </div>

          <span className="shrink-0 text-xs text-gray-500">
            {loading || searching
              ? "Loading..."
              : `${displayedTracks.length} tracks`}
          </span>
        </section>

        {/* LOADING SKELETON */}
        {(activeTab === "trending" ? loading : searching) && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/[0.03] bg-[#20252e] p-3 shadow-[5px_5px_10px_#12151b,-5px_-5px_10px_#2c333d]"
              >
                <div className="aspect-square animate-pulse rounded-xl bg-white/[0.04]" />

                <div className="mt-4 h-4 animate-pulse rounded bg-white/[0.05]" />

                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />

                <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !searching &&
          !error &&
          displayedTracks.length === 0 && (
            <div className="rounded-2xl border border-white/[0.035] bg-[#20252e] px-5 py-16 text-center shadow-[inset_5px_5px_10px_#12151b,inset_-5px_-5px_10px_#2c333d]">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#20252e] text-purple-300 shadow-[5px_5px_10px_#12151b,-5px_-5px_10px_#2c333d]">
                <Disc3 size={30} />
              </div>

              <h3 className="text-lg font-bold text-gray-200">
                {activeTab === "search"
                  ? "No tracks found"
                  : "No trending tracks available"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {activeTab === "search"
                  ? "Try another song title or artist name."
                  : "We couldn't find tracks for this period. Try refreshing or selecting another period."}
              </p>

              {activeTab === "search" ? (
                <SoftButton
                  onClick={clearSearch}
                  className="mx-auto mt-5 h-10 px-5 text-xs font-semibold"
                >
                  Explore Trending
                </SoftButton>
              ) : (
                <SoftButton
                  onClick={loadTrending}
                  className="mx-auto mt-5 h-10 px-5 text-xs font-semibold"
                >
                  <RefreshCw size={15} />
                  Try Again
                </SoftButton>
              )}
            </div>
          )}

        {/* TRACK GRID */}
        {!loading &&
          !searching &&
          displayedTracks.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                {displayedTracks.slice(0, 10).map((track, index) => (
                  <TrackCard
                    key={track._id}
                    track={track}
                    index={index}
                    currentSong={currentSong}
                    playing={playing}
                    onPlay={handlePlay}
                    onAddToQueue={handleAddToQueue}
                  />
                ))}
              </div>

              {displayedTracks.length > 10 && (
                <section className="mt-10">
                  <div className="mb-4 flex items-center gap-2">
                    <ListMusic size={19} className="text-teal-300" />

                    <h2 className="text-lg font-bold">
                      More Tracks
                    </h2>
                  </div>

                  <div className="rounded-2xl border border-white/[0.035] bg-[#20252e] p-2 shadow-[5px_5px_10px_#12151b,-5px_-5px_10px_#2c333d] sm:p-3">
                    {displayedTracks.slice(10).map((track, index) => (
                      <TrackRow
                        key={track._id}
                        track={track}
                        index={index + 10}
                        currentSong={currentSong}
                        playing={playing}
                        onPlay={handlePlay}
                        onAddToQueue={handleAddToQueue}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

        {/* CURRENT PLAYER STATUS */}
        {currentSong && (
          <section className="mt-10">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.035] bg-[#20252e] p-4 shadow-[inset_4px_4px_8px_#12151b,inset_-4px_-4px_8px_#2c333d] sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#191d24]">
                  {getArtwork(currentSong) ? (
                    <img
                      src={getArtwork(currentSong)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Music2
                      size={22}
                      className="text-purple-300"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-300">
                    {playing ? "Now Playing" : "Currently Selected"}
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-gray-100">
                    {currentSong.title || "Untitled Track"}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-500">
                    {currentSong.artist || "Unknown Artist"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {playing ? "Music is playing" : "Playback paused"}
                </span>

                <SoftButton
                  onClick={() => playSong(currentSong)}
                  className="h-10 px-4 text-xs font-semibold"
                >
                  {playing ? (
                    <Pause size={15} />
                  ) : (
                    <Play size={15} fill="currentColor" />
                  )}

                  {playing ? "Replay Track" : "Play Track"}
                </SoftButton>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-10 border-t border-white/[0.04] py-5">
          <div className="flex flex-col gap-2 text-center text-[11px] leading-5 text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>
              Discover music through Audius. Track availability may vary.
            </p>

            <a
              href="https://audius.co"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 transition-colors hover:text-purple-300"
            >
              Explore Audius
              <ExternalLink size={11} />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default Discover;