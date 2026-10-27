import React, { memo, useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { motion, AnimatePresence } from "framer-motion";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Music2,
  X,
  Minus,
  Maximize2,
  Share2,
  Moon,
  Timer,
  Check,
  ListMusic,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Waves,
  Clock3,
} from "lucide-react";

import { usePlayer, usePlaybackProgress } from "../../context/PlayerContext";
import { BASE_URL } from "../../config/api";
import AddToPlaylistButton from "../utility/AddToPlaylistButton";
import {
  addFavorite,
  removeFavorite,
  getMyFavorites,
} from "../../services/profileService";

/* =========================================================
   HELPERS
========================================================= */

const getMediaUrl = (path) => {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");

  return `${BASE_URL}/${cleanPath}`;
};

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) {
    return "0:00";
  }

  const total = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(total / 60);

  const remainingSeconds = total % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

/* =========================================================
   TIMED LYRICS HELPERS
   Supports LRC text or arrays such as:
   [{ time: 0, text: "..." }, { time: 4.2, text: "..." }]
========================================================= */
const parseTimedLyrics = (song) => {
  const source = song?.syncedLyrics ?? song?.lyrics ?? song?.lyricLines;

  if (Array.isArray(source)) {
    return source
      .map((line) => {
        if (typeof line === "string") return null;
        const rawTime = line?.time ?? line?.startTime ?? line?.timestamp;
        let time = Number(rawTime);
        if (typeof rawTime === "string" && rawTime.includes(":")) {
          const parts = rawTime.split(":").map(Number);
          time = parts.length === 2 ? parts[0] * 60 + parts[1] : NaN;
        }
        const text = String(
          line?.text ?? line?.lyric ?? line?.line ?? "",
        ).trim();
        return Number.isFinite(time) && time >= 0 && text
          ? { time, text }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
  }

  if (typeof source !== "string") return [];

  // LRC format: [mm:ss.xx] lyric text
  return source
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(
        /^\s*\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/,
      );
      if (!match || !match[3].trim()) return null;
      return {
        time: Number(match[1]) * 60 + Number(match[2]),
        text: match[3].trim(),
      };
    })
    .filter((line) => line && Number.isFinite(line.time))
    .sort((a, b) => a.time - b.time);
};

/* =========================================================
   VISUALIZER
========================================================= */

const Visualizer = memo(function Visualizer({
  playing = false,
  compact = false,
}) {
  const bars = compact
    ? [1, 2, 3, 4, 5]
    : Array.from({ length: 16 }, (_, index) => index + 1);

  return (
    <div
      className={`music-visualizer ${compact ? "music-visualizer--compact" : ""} ${playing ? "is-playing" : "is-paused"}`}
      role="img"
      aria-label={
        playing ? "Music visualizer active" : "Music visualizer paused"
      }
      data-playing={playing ? "true" : "false"}
    >
      {bars.map((bar) => {
        const baseHeight = compact ? 8 + (bar % 3) * 3 : 12 + ((bar * 7) % 20);
        const duration = 0.42 + ((bar * 13) % 8) * 0.09;
        return (
          <span
            key={bar}
            className="music-visualizer-bar"
            style={{
              height: `${baseHeight}px`,
              background:
                bar % 3 === 0
                  ? "var(--theme-secondary, #2bd4c4)"
                  : "var(--theme-primary, #8c7cf7)",
              "--bar-duration": `${duration}s`,
              "--bar-delay": `${-(((bar * 17) % 11) * 0.095)}s`,
              animationName: playing ? "joyMusicBarPulse" : "none",
              animationDuration: `${duration}s`,
              animationTimingFunction: "ease-in-out",
              animationDelay: `${-(((bar * 17) % 11) * 0.095)}s`,
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationFillMode: "both",
              animationPlayState: playing ? "running" : "paused",
              transform: playing ? undefined : "scaleY(.22)",
              opacity: playing ? 1 : 0.5,
            }}
          />
        );
      })}
      <style>{`
        .music-visualizer{display:flex;align-items:center;justify-content:center;gap:3px;height:36px;width:100%;min-width:0;overflow:hidden;}
        .music-visualizer--compact{height:20px;width:auto;gap:2px;flex:0 0 auto;}
        .music-visualizer-bar{display:block;flex:0 0 3px;max-height:100%;border-radius:999px;transform-origin:center;will-change:transform;animation-iteration-count:infinite;}
        .music-visualizer--compact .music-visualizer-bar{flex-basis:2px;min-height:5px;}
        @keyframes joyMusicBarPulse{0%{transform:scaleY(.18)}25%{transform:scaleY(.8)}50%{transform:scaleY(.35)}75%{transform:scaleY(1)}100%{transform:scaleY(.48)}}
        @media(prefers-reduced-motion:reduce){.music-visualizer.is-playing .music-visualizer-bar{animation-duration:1.8s!important;}}
      `}</style>
    </div>
  );
});

/* =========================================================
   ARTWORK
========================================================= */

const AlbumArtwork = memo(function AlbumArtwork({
  song,
  playing,
  size = "large",
}) {
  const [imageError, setImageError] = useState(false);

  const coverUrl = useMemo(() => {
    if (!song) return "";

    return getMediaUrl(
      song.coverImage || song.image || song.albumImage || song.artist?.image,
    );
  }, [song]);

  useEffect(() => {
    setImageError(false);
  }, [coverUrl]);

  const sizeClass =
    size === "small"
      ? "w-14 h-14 rounded-2xl"
      : size === "medium"
        ? "w-24 h-24 sm:w-28 sm:h-28 rounded-3xl"
        : "w-36 h-36 sm:w-52 sm:h-52 lg:w-64 lg:h-64 rounded-[2.2rem]";

  return (
    <div className="relative shrink-0">
      {/* outer neumorphic ring */}
      <div
        className={`${sizeClass} p-2`}
        style={{
          background: "var(--theme-surface)",
          boxShadow:
            "10px 10px 22px var(--theme-shadowDark), -10px -10px 22px var(--theme-shadowLight)",
        }}
      >
        <div
          className="relative w-full h-full overflow-hidden rounded-[inherit]"
          style={{
            background:
              "linear-gradient(145deg, var(--theme-surfaceLight), var(--theme-background))",
          }}
        >
          {coverUrl && !imageError ? (
            <img
              src={coverUrl}
              alt={song?.title || "Album cover"}
              className={`w-full h-full object-cover ${
                playing ? "scale-[1.02]" : ""
              } transition-transform duration-700`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                color: "var(--theme-primary)",
              }}
            >
              <Music2 className={size === "small" ? "w-6 h-6" : "w-14 h-14"} />
            </div>
          )}

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(145deg, color-mix(in srgb, var(--theme-primary) 12%, transparent), transparent 50%, color-mix(in srgb, var(--theme-secondary) 10%, transparent))",
            }}
          />
        </div>
      </div>

      {/* animated glow */}
      {playing && size !== "small" && (
        <motion.div
          className="hidden sm:block absolute -inset-2 -z-10 rounded-[2.5rem] pointer-events-none"
          animate={{
            opacity: [0.18, 0.3, 0.18],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 30%, transparent), transparent 70%)",
          }}
        />
      )}
    </div>
  );
});

/* =========================================================
   CONTROL BUTTON
========================================================= */

const ControlButton = memo(function ControlButton({
  children,
  onClick,
  active = false,
  size = "normal",
  title,
  disabled = false,
}) {
  const sizeClass =
    size === "small"
      ? "w-9 h-9"
      : size === "large"
        ? "w-16 h-16 sm:w-[72px] sm:h-[72px]"
        : "w-11 h-11";

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`${sizeClass} rounded-full flex items-center justify-center transition-transform duration-150 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        color: active ? "var(--theme-primary)" : "var(--theme-textMuted)",
        background: "var(--theme-surface)",
        boxShadow: active
          ? "inset 4px 4px 9px var(--theme-shadowDark), inset -4px -4px 9px var(--theme-shadowLight)"
          : "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      {children}
    </button>
  );
});

/* =========================================================
   SLEEP TIMER
========================================================= */

const SleepTimerMenu = ({ active, display, onStart, onCancel, onClose }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(15);
  const quickTimers = [5, 10, 15, 30, 45, 60];

  const handleCustom = () => {
    const totalMinutes = Number(hours) * 60 + Number(minutes);
    if (totalMinutes > 0) onStart(totalMinutes);
  };

  const surface = {
    background: "var(--theme-surface)",
    color: "var(--theme-text)",
  };
  const raised = {
    ...surface,
    boxShadow:
      "6px 6px 12px var(--theme-shadowDark), -6px -6px 12px var(--theme-shadowLight)",
  };
  const inset = {
    ...surface,
    boxShadow:
      "inset 4px 4px 9px var(--theme-shadowDark), inset -4px -4px 9px var(--theme-shadowLight)",
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="sleep-timer-overlay fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-5"
        style={{ background: "rgba(4, 7, 12, 0.24)" }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.985 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sleep-timer-title"
          className="sleep-timer-popup w-full max-w-[430px] overflow-y-auto rounded-[24px] border p-5 sm:p-6"
          style={{
            ...surface,
            borderColor: "rgba(255,255,255,0.06)",
            boxShadow:
              "8px 8px 24px rgba(0,0,0,.38), -3px -3px 14px rgba(255,255,255,.025)",
          }}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ ...inset, color: "var(--theme-primary)" }}
              >
                <Moon size={21} />
              </div>
              <div>
                <p
                  className="mb-1 text-[9px] font-bold uppercase tracking-[.22em]"
                  style={{ color: "var(--theme-primary)" }}
                >
                  PLAYBACK TOOLS
                </p>
                <h3
                  id="sleep-timer-title"
                  className="text-lg font-bold tracking-tight"
                >
                  Sleep timer
                </h3>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  Drift off. We’ll stop the music.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sleep timer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ ...raised, color: "var(--theme-textMuted)" }}
            >
              <X size={16} />
            </button>
          </div>

          {active && (
            <div
              className="mb-5 flex items-center justify-between gap-3 rounded-2xl p-4"
              style={{ ...inset, border: "1px solid rgba(140,124,247,.18)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(140,124,247,.12)",
                    color: "var(--theme-primary)",
                  }}
                >
                  <Timer size={17} />
                  <span
                    className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--theme-secondary, #2bd4c4)" }}
                  />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--theme-textMuted)" }}
                  >
                    Timer is running
                  </p>
                  <p
                    className="mt-0.5 truncate text-lg font-bold"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    {display || "Active"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold"
                style={{ ...raised, color: "var(--theme-danger, #ff6b81)" }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[.18em]"
                style={{ color: "var(--theme-textMuted)" }}
              >
                Quick start
              </p>
              <span
                className="text-[10px]"
                style={{ color: "var(--theme-textMuted)" }}
              >
                Choose a duration
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {quickTimers.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onStart(value)}
                  className="group flex h-[58px] flex-col items-center justify-center rounded-2xl transition-transform active:scale-[.97]"
                  style={raised}
                >
                  <span className="text-base font-bold leading-none">
                    {value}
                  </span>
                  <span
                    className="mt-1 text-[9px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--theme-textMuted)" }}
                  >
                    minutes
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={inset}>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 size={15} style={{ color: "var(--theme-primary)" }} />
              <p
                className="text-[10px] font-bold uppercase tracking-[.18em]"
                style={{ color: "var(--theme-textMuted)" }}
              >
                Custom duration
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-xl px-3 py-2.5" style={raised}>
                <span
                  className="mb-1 block text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  Hours
                </span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(event) =>
                    setHours(
                      Math.max(
                        0,
                        Math.min(23, Number(event.target.value) || 0),
                      ),
                    )
                  }
                  className="w-full bg-transparent text-lg font-bold outline-none"
                  style={{ color: "var(--theme-text)" }}
                  aria-label="Timer hours"
                />
              </label>
              <label className="rounded-xl px-3 py-2.5" style={raised}>
                <span
                  className="mb-1 block text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  Minutes
                </span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(event) =>
                    setMinutes(
                      Math.max(
                        0,
                        Math.min(59, Number(event.target.value) || 0),
                      ),
                    )
                  }
                  className="w-full bg-transparent text-lg font-bold outline-none"
                  style={{ color: "var(--theme-text)" }}
                  aria-label="Timer minutes"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleCustom}
              disabled={Number(hours) * 60 + Number(minutes) <= 0}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "var(--theme-gradient)",
                color: "var(--theme-textDark, #10131a)",
                boxShadow: "4px 4px 10px var(--theme-shadowDark)",
              }}
            >
              <Timer size={16} /> Start timer
            </button>
          </div>

          <button
            type="button"
            onClick={() => onStart("end")}
            className="mt-3 flex h-12 w-full items-center justify-between rounded-2xl px-4 text-xs font-semibold"
            style={raised}
          >
            <span className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ ...inset, color: "var(--theme-primary)" }}
              >
                <Music2 size={14} />
              </span>
              At the end of this song
            </span>
            <ChevronDown
              size={15}
              style={{ color: "var(--theme-textMuted)" }}
            />
          </button>
        </motion.div>
        <style>{`
          .sleep-timer-overlay{animation:sleep-timer-backdrop .14s ease-out both;}
          .sleep-timer-popup{max-height:min(82vh,720px);animation:sleep-timer-popup-in .16s ease-out both;}
          @keyframes sleep-timer-backdrop{from{opacity:0}to{opacity:1}}
          @keyframes sleep-timer-popup-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
          @media(max-width:639px){.sleep-timer-overlay{padding:12px 12px 108px;align-items:flex-end}.sleep-timer-popup{max-height:calc(100dvh - 140px);}}
          @media(prefers-reduced-motion:reduce){.sleep-timer-overlay,.sleep-timer-popup{animation:none}}
        `}</style>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

/* =========================================================
   MUSIC PLAYER
========================================================= */

export default function MusicPlayer() {
  const {
    currentSong,
    playing,
    volume,
    muted,
    shuffle,
    repeat,

    togglePlay,
    nextSong,
    previousSong,
    seekSong,
    changeVolume,
    toggleMute,
    setShuffle,
    setRepeat,

    queue,
    playSong,
    removeFromQueue,
    clearQueue,

    sleepTimerActive,
    sleepTimerDisplay,
    startSleepTimer,
    cancelSleepTimer,
  } = usePlayer();

  // Playback time lives in a separate context to keep frequent progress updates lightweight.
  const { currentTime, duration } = usePlaybackProgress();
  const [suggestedSong, setSuggestedSong] = useState(null);
  const displaySong = currentSong || suggestedSong;

  // When there is no previously selected song, show a recommendation as a visual
  // fallback only. It is not sent to PlayerContext or saved as last-played.
  useEffect(() => {
    if (currentSong?._id || suggestedSong?._id) return undefined;
    const controller = new AbortController();

    const loadSuggestion = async () => {
      try {
        const response = await fetch(
          `${String(BASE_URL).replace(/\/+$/, "")}/api/songs`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) return;
        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.songs)
            ? payload.songs
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.results)
                ? payload.results
                : [];
        const candidate =
          list.find((song) => song?._id && song?.audioFile) ||
          list.find((song) => song?._id);
        if (candidate && !controller.signal.aborted)
          setSuggestedSong(candidate);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.warn("Could not load mini-player suggestion:", error);
        }
      }
    };

    void loadSuggestion();
    return () => controller.abort();
  }, [currentSong?._id, suggestedSong?._id]);

  const handlePlayerToggle = () => {
    if (!currentSong?._id && suggestedSong?._id) {
      void playSong(suggestedSong, 0, [suggestedSong]);
      return;
    }
    togglePlay();
  };

  // Keep dragging local so audio.currentTime is only changed when the user releases the timeline.
  const [seekingTime, setSeekingTime] = useState(null);
  const seekingTimeRef = useRef(null);
  const finishTimelineSeek = () => {
    const target = seekingTimeRef.current;
    if (target !== null && Number.isFinite(target)) seekSong(target);
    seekingTimeRef.current = null;
    setSeekingTime(null);
  };

  const [isOpen, setIsOpen] = useState(true);

  const [isMinimized, setIsMinimized] = useState(true);

  const [showSleepTimer, setShowSleepTimer] = useState(false);

  const [showQueue, setShowQueue] = useState(false);

  const [liked, setLiked] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [shareMessage, setShareMessage] = useState("");

  const [showMore, setShowMore] = useState(false);

  /* =======================================================
     KEEP PLAYER VISIBLE BUT MINIMIZED ON TRACK CHANGES
  ======================================================= */

  useEffect(() => {
    if (currentSong?._id) {
      setIsOpen(true);
      setIsMinimized(true);
    }
  }, [currentSong?._id]);

  /* =======================================================
     FAVORITE SYNC
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadFavoriteState = async () => {
      if (!currentSong?._id) {
        setLiked(false);
        return;
      }

      try {
        const response = await getMyFavorites();
        if (cancelled) return;

        const favorites = Array.isArray(response?.favorites)
          ? response.favorites
          : [];

        const isFavorite = favorites.some((item) => {
          if (typeof item === "string") return item === currentSong._id;
          return (
            item?.song?._id === currentSong._id ||
            item?.song === currentSong._id ||
            item?._id === currentSong._id
          );
        });

        setLiked(isFavorite);
      } catch (error) {
        if (!cancelled) setLiked(false);
        console.error("MUSIC PLAYER FAVORITE SYNC ERROR:", error);
      }
    };

    loadFavoriteState();

    return () => {
      cancelled = true;
    };
  }, [currentSong?._id]);

  /* =======================================================
     TOGGLE FAVORITE
  ======================================================= */

  const handleToggleFavorite = async () => {
    const songId = displaySong?._id;
    if (!songId || favoriteLoading) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setFavoriteLoading(true);

    try {
      if (nextLiked) {
        await addFavorite(songId);
      } else {
        await removeFavorite(songId);
      }
    } catch (error) {
      setLiked(!nextLiked);
      console.error(
        "MUSIC PLAYER FAVORITE ERROR:",
        error?.response?.data || error,
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  /* =======================================================
     CLOSE PLAYER
  ======================================================= */

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowSleepTimer(false);
    setShowQueue(false);

    if (playing) {
      togglePlay();
    }
  };

  /* =======================================================
     SHARE
  ======================================================= */

  const handleShare = async () => {
    if (!displaySong) return;

    const title = displaySong.title || "Music";

    const artist =
      displaySong.artist?.name || displaySong.artist || "Unknown Artist";

    const shareText = `${title} — ${artist}`;

    try {
      if (navigator.share && typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: shareText,
        });

        setShareMessage("Shared");
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);

        setShareMessage("Copied");
      }
    } catch {
      try {
        const textarea = document.createElement("textarea");

        textarea.value = shareText;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);

        setShareMessage("Copied");
      } catch {
        setShareMessage("Unable to share");
      }
    }

    window.setTimeout(() => {
      setShareMessage("");
    }, 1800);
  };

  /* =======================================================
     SONG DATA
  ======================================================= */

  const artistName =
    displaySong?.artist?.name || displaySong?.artist || "Unknown Artist";

  const albumName = displaySong?.album?.title || displaySong?.album || "Single";

  const timelineTime = seekingTime ?? currentTime;
  const timelineProgress =
    duration > 0
      ? Math.min(100, Math.max(0, (timelineTime / duration) * 100))
      : 0;
  const progress =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  /* =======================================================
     NO SONG
  ======================================================= */

  if (!displaySong || !isOpen) {
    return null;
  }

  /* =======================================================
     MINIMIZED PLAYER
  ======================================================= */

  if (isMinimized) {
    return (
      <>
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          className="fixed bottom-23 left-4 right-4 sm:left-auto sm:right-6 z-9998 sm:w-107.5"
        >
          <div
            className="relative overflow-hidden rounded-[1.8rem] p-3"
            style={{
              background: "var(--theme-surface)",
              boxShadow:
                "12px 12px 28px var(--theme-shadowDark), -12px -12px 28px var(--theme-shadowLight)",
              border: "1px solid var(--theme-border)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--theme-primary) 12%, transparent), transparent 50%), radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--theme-secondary) 10%, transparent), transparent 45%)",
              }}
            />

            <div className="relative flex items-center gap-3">
              <AlbumArtwork song={displaySong} playing={playing} size="small" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className="font-semibold text-sm truncate"
                    style={{
                      color: "var(--theme-text)",
                    }}
                  >
                    {displaySong.title}
                  </h4>

                  {playing && <Visualizer playing={playing} compact />}
                </div>

                <p
                  className="text-xs truncate mt-0.5"
                  style={{
                    color: "var(--theme-textMuted)",
                  }}
                >
                  {artistName}
                </p>

                <div
                  className="mt-2 h-1 rounded-full overflow-hidden"
                  style={{
                    background: "var(--theme-background)",
                    boxShadow: "inset 2px 2px 4px var(--theme-shadowDark)",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "100%",
                      transform: `scaleX(${progress / 100})`,
                      transformOrigin: "left center",
                      background: "var(--theme-gradient)",
                      willChange: "transform",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <ControlButton
                  size="small"
                  onClick={previousSong}
                  title="Previous"
                >
                  <SkipBack size={16} />
                </ControlButton>

                <ControlButton
                  size="small"
                  onClick={handlePlayerToggle}
                  title={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                </ControlButton>

                <ControlButton size="small" onClick={nextSong} title="Next">
                  <SkipForward size={16} />
                </ControlButton>

                <ControlButton
                  size="small"
                  onClick={() => setIsMinimized(false)}
                  title="Expand"
                >
                  <Maximize2 size={15} />
                </ControlButton>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  /* =======================================================
     FULL PLAYER
  ======================================================= */

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{
            opacity: 0,
            y: 70,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 70,
          }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 25,
          }}
          className="fixed bottom-4 left-2 right-2 sm:bottom-4 sm:left-5 sm:right-5 lg:left-6 lg:right-6 z-[9998] min-w-0"
        >
          <div
            className="music-player-shell relative max-h-[calc(100dvh-0.5rem)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.5rem] sm:rounded-[2.5rem]"
            style={{
              background: "var(--theme-background)",
              border: "1px solid var(--theme-border)",
              boxShadow:
                "18px 18px 40px var(--theme-shadowDark), -18px -18px 40px var(--theme-shadowLight)",
            }}
          >
            {/* =================================================
                BACKGROUND GLOW
            ================================================= */}

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 12% 10%, color-mix(in srgb, var(--theme-primary) 10%, transparent), transparent 28%), radial-gradient(circle at 85% 80%, color-mix(in srgb, var(--theme-secondary) 8%, transparent), transparent 30%)",
              }}
            />

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="relative flex min-w-0 items-center justify-between gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: "var(--theme-surface)",
                    boxShadow:
                      "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)",
                  }}
                >
                  <Waves
                    size={13}
                    style={{
                      color: "var(--theme-primary)",
                    }}
                  />

                  <span
                    className="text-[9px] sm:text-[10px] font-bold tracking-[0.18em] uppercase"
                    style={{
                      color: "var(--theme-textMuted)",
                    }}
                  >
                    Now Playing
                  </span>
                </div>

                {playing && <Visualizer playing={playing} compact />}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowQueue(!showQueue)}
                  className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    color: showQueue
                      ? "var(--theme-primary)"
                      : "var(--theme-textMuted)",
                    background: "var(--theme-surface)",
                    boxShadow:
                      "5px 5px 11px var(--theme-shadowDark), -5px -5px 11px var(--theme-shadowLight)",
                  }}
                  title="Queue"
                >
                  <ListMusic size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    color: "var(--theme-textMuted)",
                  }}
                  title="Minimize"
                >
                  <Minus size={17} />
                </button>
              </div>
            </div>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <div className="relative min-w-0 p-3 sm:p-6 lg:p-7">
              <div
                className={`grid min-w-0 gap-4 sm:gap-5 lg:gap-7 ${
                  showQueue
                    ? "lg:grid-cols-[0.9fr_1.35fr_0.9fr_0.72fr]"
                    : "lg:grid-cols-[0.9fr_1.4fr_0.9fr]"
                }`}
              >
                {/* ============================================
                    LEFT — ARTWORK / SONG
                ============================================ */}

                <div className="flex min-w-0 flex-col items-center justify-center">
                  <AlbumArtwork
                    song={displaySong}
                    playing={playing}
                    size="large"
                  />

                  <div className="text-center mt-5 max-w-[300px]">
                    <h2
                      className="font-bold text-xl sm:text-2xl truncate"
                      style={{
                        color: "var(--theme-text)",
                      }}
                      title={displaySong.title}
                    >
                      {displaySong.title}
                    </h2>

                    <p
                      className="mt-1 text-sm truncate"
                      style={{
                        color: "var(--theme-textMuted)",
                      }}
                    >
                      {artistName}
                    </p>

                    <p
                      className="text-xs mt-1 truncate"
                      style={{
                        color:
                          "color-mix(in srgb, var(--theme-textMuted) 65%, transparent)",
                      }}
                    >
                      {albumName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <ControlButton
                      size="small"
                      onClick={handleToggleFavorite}
                      active={liked}
                      disabled={favoriteLoading}
                      title={
                        favoriteLoading
                          ? "Updating favorite..."
                          : liked
                            ? "Remove from favorites"
                            : "Add to favorites"
                      }
                    >
                      <Heart
                        size={16}
                        className={favoriteLoading ? "animate-pulse" : ""}
                        fill={liked ? "currentColor" : "none"}
                      />
                    </ControlButton>

                    <ControlButton
                      size="small"
                      onClick={handleShare}
                      title="Share"
                    >
                      {shareMessage ? (
                        <Check size={16} />
                      ) : (
                        <Share2 size={16} />
                      )}
                    </ControlButton>

                    <ControlButton
                      size="small"
                      onClick={() => setShowSleepTimer(true)}
                      active={sleepTimerActive}
                      title="Sleep timer"
                    >
                      <Moon size={16} />
                    </ControlButton>

                    <AddToPlaylistButton song={displaySong} size="sm" />
                  </div>

                  {shareMessage && (
                    <motion.span
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="text-[10px] mt-2"
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                    >
                      {shareMessage}
                    </motion.span>
                  )}
                </div>

                {/* ============================================
                    CENTER — CONTROLS
                ============================================ */}

                <div className="flex flex-col justify-center min-w-0">
                  {/* UNIFIED VISUALIZER + SYNCED LYRICS SECTION */}
                  <div
                    className="grid grid-cols-5 gap-1.5 sm:gap-2 items-center rounded-full px-3 py-1 sm:px-3.5 sm:py-1.5 mb-2 min-w-0"
                    style={{
                      background: "var(--theme-surface)",
                      boxShadow:
                        "inset 5px 5px 10px var(--theme-shadowDark), inset -5px -5px 10px var(--theme-shadowLight)",
                      border: "1px solid var(--theme-border)",
                    }}
                  >
                    {/* Visualizer and lyrics share one continuous surface */}
                    <div
                      className="col-span-2 min-w-0 flex flex-col items-center justify-center pr-1.5 sm:pr-2 border-r"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                     
                      <Visualizer playing={playing} compact />
                      <span
                        className="text-[7px] mt-0.5 text-center leading-none"
                        style={{ color: "var(--theme-textMuted)" }}
                      >
                        {playing ? "Now playing" : "Paused"}
                      </span>
                    </div>

                    <div className="col-span-3 min-w-0 flex flex-col justify-center pl-1 sm:pl-1.5">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Music2
                          size={10}
                          style={{ color: "var(--theme-primary)" }}
                        />
                        <span
                          className="text-[8px] sm:text-[9px] uppercase tracking-[0.1em]"
                          style={{ color: "var(--theme-textMuted)" }}
                        >
                          Synced lyrics
                        </span>
                      </div>
                      {(() => {
                        const lines = parseTimedLyrics(displaySong);
                        let activeIndex = -1;
                        for (let index = 0; index < lines.length; index += 1) {
                          if (lines[index].time <= currentTime)
                            activeIndex = index;
                          else break;
                        }
                        const previousLine =
                          activeIndex > 0 ? lines[activeIndex - 1]?.text : "";
                        const currentLine =
                          activeIndex >= 0 ? lines[activeIndex]?.text : "";
                        const hasLyrics = lines.length > 0;
                        return (
                          <div
                            className="min-w-0 space-y-0"
                            aria-live="polite"
                            aria-atomic="true"
                          >

                            <p
                              className="min-h-0 text-[9px] sm:text-[11px] leading-tight wrap-break-word line-clamp-1"
                              style={{
                                color: "var(--theme-textMuted)",
                                opacity: previousLine ? 0.78 : 0.45,
                              }}
                            >
                              {previousLine ||
                                (hasLyrics ? "♪" : "Lyrics not available")}
                            </p>
                            <p
                              className="min-h-0 text-[11px] sm:text-xs font-semibold leading-tight wrap-break-word line-clamp-2"
                              style={{
                                color: currentLine
                                  ? "var(--theme-primary)"
                                  : "var(--theme-textMuted)",
                              }}
                            >
                              {currentLine ||
                                (hasLyrics
                                  ? "♪"
                                  : "Add timestamped lyrics to this song")}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* main controls */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <ControlButton
                      onClick={() => setShuffle(!shuffle)}
                      active={shuffle}
                      title="Shuffle"
                    >
                      <Shuffle size={18} />
                    </ControlButton>

                    <ControlButton onClick={previousSong} title="Previous">
                      <SkipBack size={20} fill="currentColor" />
                    </ControlButton>

                    <button
                      type="button"
                      onClick={handlePlayerToggle}
                      className="w-[68px] h-[68px] sm:w-[78px] sm:h-[78px] rounded-full flex items-center justify-center"
                      style={{
                        color: "var(--theme-textDark)",
                        background: "var(--theme-gradient)",
                        boxShadow:
                          "9px 9px 18px var(--theme-shadowDark), -9px -9px 18px var(--theme-shadowLight), 0 0 28px color-mix(in srgb, var(--theme-primary) 15%, transparent)",
                      }}
                    >
                      {playing ? (
                        <Pause size={26} fill="currentColor" />
                      ) : (
                        <Play size={28} fill="currentColor" />
                      )}
                    </button>

                    <ControlButton onClick={nextSong} title="Next">
                      <SkipForward size={20} fill="currentColor" />
                    </ControlButton>

                    <ControlButton
                      onClick={() =>
                        setRepeat(repeat === "one" ? "off" : "one")
                      }
                      active={repeat === "one"}
                      title="Repeat"
                    >
                      <Repeat size={18} />
                      {repeat === "one" && (
                        <span
                          className="absolute text-[7px] font-bold"
                          style={{
                            color: "var(--theme-primary)",
                          }}
                        >
                          1
                        </span>
                      )}
                    </ControlButton>
                  </div>

                  {/* progress */}
                  <div className="mt-6">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] tabular-nums w-9"
                        style={{
                          color: "var(--theme-textMuted)",
                        }}
                      >
                        {formatTime(timelineTime)}
                      </span>

                      <div className="relative flex-1 group">
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{
                            background: "var(--theme-background)",
                            boxShadow:
                              "inset 2px 2px 5px var(--theme-shadowDark), inset -1px -1px 3px var(--theme-shadowLight)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: "100%",
                              transform: `scaleX(${timelineProgress / 100})`,
                              transformOrigin: "left center",
                              background: "var(--theme-gradient)",
                            }}
                          />
                        </div>

                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          step="0.1"
                          value={timelineTime || 0}
                          onChange={(e) => {
                            const nextTime = Number(e.target.value);
                            seekingTimeRef.current = nextTime;
                            setSeekingTime(nextTime);
                          }}
                          onPointerUp={finishTimelineSeek}
                          onKeyUp={finishTimelineSeek}
                          onBlur={finishTimelineSeek}
                          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                          aria-label="Seek"
                        />
                      </div>

                      <span
                        className="text-[10px] tabular-nums w-9 text-right"
                        style={{
                          color: "var(--theme-textMuted)",
                        }}
                      >
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>

                  {/* track status */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: playing
                          ? "var(--theme-secondary)"
                          : "var(--theme-textMuted)",
                        boxShadow: playing
                          ? "0 0 10px var(--theme-secondary)"
                          : "none",
                      }}
                    />

                    <span
                      className="text-[10px] uppercase tracking-[0.16em]"
                      style={{
                        color: "var(--theme-textMuted)",
                      }}
                    >
                      {playing ? "Playing" : "Paused"}
                    </span>
                  </div>
                </div>

                {/* ============================================
                    RIGHT — VOLUME / TIMER
                ============================================ */}

                <div className="flex min-w-0 flex-col justify-center">
                  <div
                    className="min-w-0 rounded-xl p-1.5 sm:p-2"
                    style={{
                      background: "var(--theme-surface)",
                      boxShadow:
                        "8px 8px 18px var(--theme-shadowDark), -8px -8px 18px var(--theme-shadowLight)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <p
                          className="text-[9px] uppercase tracking-[0.12em]"
                          style={{
                            color: "var(--theme-textMuted)",
                          }}
                        >
                          Volume
                        </p>

                        <p
                          className="text-sm font-bold leading-none"
                          style={{
                            color: "var(--theme-text)",
                          }}
                        >
                          {muted ? 0 : Math.round((volume || 0) * 100)}%
                        </p>
                      </div>

                      <ControlButton
                        size="small"
                        onClick={toggleMute}
                        active={muted}
                        title={muted ? "Unmute" : "Mute"}
                      >
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </ControlButton>
                    </div>

                    <div className="mt-1.5 relative">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          background: "var(--theme-background)",
                          boxShadow:
                            "inset 2px 2px 5px var(--theme-shadowDark)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${muted ? 0 : (volume || 0) * 100}%`,
                            background: "var(--theme-gradient)",
                          }}
                        />
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={muted ? 0 : volume || 0}
                        onChange={(e) => changeVolume(Number(e.target.value))}
                        className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                        aria-label="Volume"
                      />
                    </div>
                  </div>

                  {/* One compact slot, split into two clear controls */}
                  <div
                    className="player-bottom-tools mt-4 grid grid-cols-2 gap-2 rounded-[1.35rem] p-2"
                    style={{
                      background: "var(--theme-surface)",
                      boxShadow:
                        "inset 4px 4px 9px var(--theme-shadowDark), inset -4px -4px 9px var(--theme-shadowLight)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowSleepTimer(true)}
                      aria-label="Open sleep timer"
                      className="player-bottom-tool min-w-0 rounded-xl px-2 py-2 sm:rounded-2xl sm:px-3 sm:py-3 text-left"
                      style={{
                        background: "var(--theme-surface)",
                        border: sleepTimerActive
                          ? "1px solid rgba(140,124,247,.34)"
                          : "1px solid rgba(255,255,255,.035)",
                        boxShadow: sleepTimerActive
                          ? "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)"
                          : "3px 3px 7px var(--theme-shadowDark), -3px -3px 7px var(--theme-shadowLight)",
                        color: sleepTimerActive
                          ? "var(--theme-primary)"
                          : "var(--theme-textMuted)",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl"
                          style={{
                            background: "var(--theme-surface)",
                            boxShadow:
                              "inset 2px 2px 5px var(--theme-shadowDark), inset -2px -2px 5px var(--theme-shadowLight)",
                          }}
                        >
                          <Timer size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="flex items-center gap-1.5 text-[11px] font-bold"
                            style={{ color: "var(--theme-text)" }}
                          >
                            Sleep timer
                            {sleepTimerActive && (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: "var(--theme-primary)" }}
                              />
                            )}
                          </span>
                          <span
                            className="mt-1 block truncate text-[9px]"
                            style={{ color: "var(--theme-textMuted)" }}
                          >
                            {sleepTimerActive
                              ? sleepTimerDisplay || "Timer active"
                              : "Set playback stop"}
                          </span>
                        </span>
                        <ChevronDown size={13} className="shrink-0" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMore((previous) => !previous)}
                      aria-expanded={showMore}
                      aria-controls="player-more-controls"
                      className="player-bottom-tool min-w-0 rounded-2xl px-3 py-3 text-left"
                      style={{
                        background: "var(--theme-surface)",
                        border: showMore
                          ? "1px solid rgba(140,124,247,.34)"
                          : "1px solid rgba(255,255,255,.035)",
                        boxShadow: showMore
                          ? "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)"
                          : "3px 3px 7px var(--theme-shadowDark), -3px -3px 7px var(--theme-shadowLight)",
                        color: showMore
                          ? "var(--theme-primary)"
                          : "var(--theme-textMuted)",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            background: "var(--theme-surface)",
                            boxShadow:
                              "inset 2px 2px 5px var(--theme-shadowDark), inset -2px -2px 5px var(--theme-shadowLight)",
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block text-[11px] font-bold"
                            style={{ color: "var(--theme-text)" }}
                          >
                            More controls
                          </span>
                          <span
                            className="mt-1 block truncate text-[9px]"
                            style={{ color: "var(--theme-textMuted)" }}
                          >
                            Queue · Shuffle · Repeat
                          </span>
                        </span>
                        {showMore ? (
                          <ChevronUp size={13} className="shrink-0" />
                        ) : (
                          <ChevronDown size={13} className="shrink-0" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ============================================
                    QUEUE
                ============================================ */}

                {showQueue && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: 20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    className="hidden lg:block min-w-0"
                  >
                    <div
                      className="h-full rounded-[1.8rem] p-4"
                      style={{
                        background: "var(--theme-surface)",
                        boxShadow:
                          "inset 5px 5px 11px var(--theme-shadowDark), inset -5px -5px 11px var(--theme-shadowLight)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ListMusic
                            size={16}
                            style={{
                              color: "var(--theme-primary)",
                            }}
                          />

                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: "var(--theme-text)",
                            }}
                          >
                            Queue
                          </span>
                        </div>

                        <span
                          className="text-[9px]"
                          style={{
                            color: "var(--theme-textMuted)",
                          }}
                        >
                          LIVE
                        </span>
                      </div>

                      <div
                        className="rounded-2xl p-3"
                        style={{
                          background: "var(--theme-background)",
                          boxShadow:
                            "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <AlbumArtwork
                            song={displaySong}
                            playing={playing}
                            size="small"
                          />

                          <div className="min-w-0">
                            <p
                              className="text-xs font-semibold truncate"
                              style={{
                                color: "var(--theme-text)",
                              }}
                            >
                              {displaySong.title}
                            </p>

                            <p
                              className="text-[10px] truncate mt-1"
                              style={{
                                color: "var(--theme-textMuted)",
                              }}
                            >
                              {artistName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        {queue?.length > 0 ? (
                          <div
                            className="space-y-2 max-h-[230px] overflow-y-auto pr-1"
                            style={{
                              scrollbarWidth: "thin",
                              scrollbarColor:
                                "var(--theme-primary) transparent",
                            }}
                          >
                            {queue.map((song, index) => {
                              const songArtist =
                                song?.artist?.name ||
                                song?.artist ||
                                "Unknown Artist";

                              return (
                                <motion.div
                                  key={song?._id || `${song?.title}-${index}`}
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="group flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                                  style={{
                                    background: "var(--theme-background)",
                                    boxShadow:
                                      "4px 4px 8px var(--theme-shadowDark), -4px -4px 8px var(--theme-shadowLight)",
                                  }}
                                  onClick={() => playSong(song)}
                                >
                                  <div
                                    className="w-5 shrink-0 text-center text-[10px] font-semibold"
                                    style={{ color: "var(--theme-textMuted)" }}
                                  >
                                    {index + 1}
                                  </div>

                                  <AlbumArtwork
                                    song={song}
                                    playing={false}
                                    size="small"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="text-[11px] font-semibold truncate"
                                      style={{ color: "var(--theme-text)" }}
                                      title={song?.title || "Unknown Song"}
                                    >
                                      {song?.title || "Unknown Song"}
                                    </p>
                                    <p
                                      className="text-[9px] truncate mt-0.5"
                                      style={{
                                        color: "var(--theme-textMuted)",
                                      }}
                                      title={songArtist}
                                    >
                                      {songArtist}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    aria-label={`Remove ${song?.title || "song"} from queue`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (song?._id) removeFromQueue(song._id);
                                    }}
                                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                                    style={{
                                      color: "var(--theme-textMuted)",
                                      background: "var(--theme-surface)",
                                      boxShadow:
                                        "3px 3px 7px var(--theme-shadowDark), -3px -3px 7px var(--theme-shadowLight)",
                                    }}
                                    title="Remove from queue"
                                  >
                                    <X size={12} />
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            className="rounded-xl p-4 text-center"
                            style={{
                              color: "var(--theme-textMuted)",
                              background: "var(--theme-background)",
                              boxShadow:
                                "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)",
                            }}
                          >
                            <ListMusic
                              size={20}
                              className="mx-auto mb-2 opacity-50"
                            />
                            <p className="text-[10px]">Queue is empty</p>
                            <p className="text-[9px] mt-1 opacity-60">
                              Add songs from your collection
                            </p>
                          </div>
                        )}

                        {queue?.length > 0 && (
                          <button
                            type="button"
                            onClick={clearQueue}
                            className="w-full mt-2 h-8 rounded-xl text-[9px] font-semibold transition-transform active:scale-[0.98]"
                            style={{
                              color: "var(--theme-textMuted)",
                              background: "var(--theme-surface)",
                              boxShadow:
                                "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)",
                            }}
                          >
                            Clear Queue
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ================================================
                  MOBILE EXTRA CONTROLS
              ================================================= */}

              {showMore &&
                createPortal(
                  <div
                    className="player-more-overlay"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget)
                        setShowMore(false);
                    }}
                    onTouchStart={(event) => {
                      if (event.target === event.currentTarget)
                        setShowMore(false);
                    }}
                  >
                    <div
                      id="player-more-controls"
                      role="dialog"
                      aria-label="More music controls"
                      className="player-more-popup rounded-[1.2rem] p-3"
                      style={{
                        background: "var(--theme-surface)",
                        boxShadow:
                          "8px 8px 24px rgba(0,0,0,.38), -3px -3px 14px rgba(255,255,255,.025)",
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase tracking-[.18em]"
                            style={{ color: "var(--theme-text)" }}
                          >
                            Quick controls
                          </p>
                          <p
                            className="mt-1 text-[9px]"
                            style={{ color: "var(--theme-textMuted)" }}
                          >
                            Fine-tune your listening session
                          </p>
                        </div>
                        <Waves
                          size={17}
                          style={{ color: "var(--theme-primary)" }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowQueue(true);
                            setShowMore(false);
                          }}
                          className="player-tool-tile"
                          style={{ color: "var(--theme-textMuted)" }}
                        >
                          <span className="player-tool-icon">
                            <ListMusic size={17} />
                          </span>
                          <span className="player-tool-copy">
                            <strong>Queue</strong>
                            <small>Up next</small>
                          </span>
                          <ChevronDown
                            className="player-tool-chevron"
                            size={13}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShuffle((previous) => !previous)}
                          aria-pressed={shuffle}
                          className="player-tool-tile"
                          style={{
                            color: shuffle
                              ? "var(--theme-primary)"
                              : "var(--theme-textMuted)",
                            borderColor: shuffle
                              ? "rgba(140,124,247,.28)"
                              : "rgba(255,255,255,.035)",
                          }}
                        >
                          <span className="player-tool-icon">
                            <Shuffle size={17} />
                          </span>
                          <span className="player-tool-copy">
                            <strong>Shuffle</strong>
                            <small>
                              {shuffle ? "Enabled" : "Play in order"}
                            </small>
                          </span>
                          <span
                            className="player-tool-status"
                            style={{
                              background: shuffle
                                ? "var(--theme-primary)"
                                : "var(--theme-textMuted)",
                            }}
                          />
                        </button>
                      

<button
  type="button"
  onClick={() =>
    setRepeat((previous) => (previous === "one" ? "off" : "one"))
  }
  aria-pressed={repeat === "one"}
  className={`player-tool-tile transition-all duration-300 ${
    repeat === "one"
      ? "!shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.04)] scale-[0.98] !border-[var(--theme-primary)]"
      : "shadow-[5px_5px_10px_rgba(0,0,0,0.2),-5px_-5px_10px_rgba(255,255,255,0.02)]"
  }`}
  style={{
    color:
      repeat === "one"
        ? "var(--theme-primary)"
        : "var(--theme-textMuted)",
    borderColor:
      repeat === "one"
        ? "rgba(140,124,247,.28)"
        : "rgba(255,255,255,.035)",
  }}
>
  <span className="player-tool-icon">
    <Repeat size={17} />
  </span>

  <span className="player-tool-copy">
    <strong>Repeat one</strong>
    <small>{repeat === "one" ? "Enabled" : "Current track"}</small>
  </span>

  <span
    className={`player-tool-status transition-all duration-300 ${
      repeat === "one"
        ? "shadow-[0_0_8px_var(--theme-primary)]"
        : ""
    }`}
    style={{
      background:
        repeat === "one"
          ? "var(--theme-primary)"
          : "var(--theme-textMuted)",
    }}
  />
</button>






                        <button
                          type="button"
                          onClick={handleShare}
                          className="player-tool-tile"
                          style={{ color: "var(--theme-textMuted)" }}
                        >
                          <span className="player-tool-icon">
                            <Share2 size={17} />
                          </span>
                          <span className="player-tool-copy">
                            <strong>Share</strong>
                            <small>Send this track</small>
                          </span>
                          <ChevronDown
                            className="player-tool-chevron"
                            size={13}
                          />
                        </button>
                      </div>
                      <style>{`
                    .player-tool-tile{min-width:0;min-height:66px;display:flex;align-items:center;gap:9px;padding:10px;border-radius:15px;text-align:left;background:var(--theme-surface);border:1px solid rgba(255,255,255,.035);box-shadow:4px 4px 8px var(--theme-shadowDark),-4px -4px 8px var(--theme-shadowLight);transition:transform .12s ease,border-color .12s ease;touch-action:manipulation}
                    .player-tool-tile:active{transform:scale(.98)}
                    .player-tool-icon{width:32px;height:32px;flex:0 0 32px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--theme-surface);box-shadow:inset 3px 3px 6px var(--theme-shadowDark),inset -3px -3px 6px var(--theme-shadowLight)}
                    .player-tool-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}
                    .player-tool-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:700;color:var(--theme-text)}
                    .player-tool-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:var(--theme-textMuted)}
                    .player-tool-chevron{flex:0 0 auto;opacity:.7}
                    .player-tool-status{width:6px;height:6px;flex:0 0 6px;border-radius:50%;opacity:.9}
                    @media(prefers-reduced-motion:reduce){.player-tool-tile{transition:none}}
                  `}</style>
                    </div>
                    <style>{`
                     .player-more-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;padding:16px 12px 108px;background:rgba(4,7,12,.35);animation:player-more-backdrop .14s ease-out both;}
                    .player-more-popup{width:min(100%,430px);max-height:min(70vh,520px);overflow-y:auto;border:1px solid var(--theme-border);color:var(--theme-text);background:var(--theme-surface);box-shadow:8px 8px 24px var(--theme-shadowDark),-3px -3px 14px var(--theme-shadowLight);animation:player-more-popup-in .16s ease-out both;}
                    @keyframes player-more-backdrop{from{opacity:0}to{opacity:1}}
                    @keyframes player-more-popup-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
                    @media(min-width:1024px){.player-more-overlay{align-items:center;padding:24px}}
                    @media(max-width:639px){.player-more-overlay{padding:16px 12px 108px}.player-more-popup{max-height:calc(100dvh - 140px)}}
                    @media(prefers-reduced-motion:reduce){.player-more-overlay,.player-more-popup{animation:none}}
                  `}</style>
                  </div>,
                  document.body,
                )}
            </div>

            {/* =================================================
                BOTTOM BRAND STRIP
            ================================================= */}

            <div
              className="relative hidden sm:flex items-center justify-between px-6 pb-4"
              style={{
                color: "var(--theme-textMuted)",
              }}
            >
              <div className="flex items-center gap-2">
                <Music2
                  size={13}
                  style={{
                    color: "var(--theme-primary)",
                  }}
                />

                <span className="text-[9px] uppercase tracking-[0.2em]">
                  LYRICS WAYYY
                </span>
              </div>

              <span className="text-[9px] uppercase tracking-[0.16em]">
                More than music • it's a lifestyle
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* =====================================================
          SLEEP TIMER MODAL
      ===================================================== */}

      {showSleepTimer && (
        <SleepTimerMenu
          active={sleepTimerActive}
          display={sleepTimerDisplay}
          onStart={(value) => {
            startSleepTimer(value);
            setShowSleepTimer(false);
          }}
          onCancel={() => {
            cancelSleepTimer();
            setShowSleepTimer(false);
          }}
          onClose={() => setShowSleepTimer(false)}
        />
      )}
    </>
  );
}
