import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { X, Music2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../AuthContext";
import { BASE_URL } from "../config/api";
import { startListening, updateListening } from "../services/profileService";
import { getSongs } from "../services/songService";


const PlayerContext = createContext(null);



const PlaybackProgressContext = createContext(null);

const QUEUE_STORAGE_KEY = "LYRICS_WAYYY_queue";
const PLAYER_STATE_STORAGE_KEY = "LYRICS_WAYYY_player_state";

const PROGRESS_SAVE_INTERVAL = 10;
const MAX_TICK_INTERVAL = 3;
const POSITION_TOLERANCE = 0.5;

const getPlayerStorageKeys = (userId) => {
  if (!userId) return null;

  const safeUserId = String(userId);

  return {
    playerStateKey: `${PLAYER_STATE_STORAGE_KEY}_${safeUserId}`,
    queueKey: `${QUEUE_STORAGE_KEY}_${safeUserId}`,
  };
};

const normalizePlayerState = (saved) => {
  if (!saved || typeof saved !== "object") {
    return null;
  }

  const isValidTrack = (item) =>
    item &&
    typeof item === "object" &&
    (item._id || item.id) &&
    (item.audioFile || item.audioUrl);

  const song = saved.song && isValidTrack(saved.song) ? saved.song : null;

  if (!song) return null;

  const playlist = Array.isArray(saved.playlist)
    ? saved.playlist.filter(isValidTrack)
    : [];

  // Ensure the selected song exists in the restored playlist.
  const songId = String(song._id || song.id);

  if (!playlist.some((item) => String(item._id || item.id) === songId)) {
    playlist.push(song);
  }

  const index = playlist.findIndex(
    (item) => String(item._id || item.id) === songId,
  );

  return {
    song,
    playlist,
    index,
    position: Number.isFinite(Number(saved.position))
      ? Math.max(0, Number(saved.position))
      : 0,
    volume: Number.isFinite(Number(saved.volume))
      ? Math.max(0, Math.min(1, Number(saved.volume)))
      : 1,
    muted: Boolean(saved.muted),
    shuffle: Boolean(saved.shuffle),
    repeat: Boolean(saved.repeat),
    savedAt: Number(saved.savedAt) || Date.now(),
  };
};

const readUserPlayerState = (userId) => {
  const keys = getPlayerStorageKeys(userId);

  if (!keys || typeof window === "undefined") {
    return null;
  }

  try {
    const saved = localStorage.getItem(keys.playerStateKey);

    if (!saved) return null;

    return normalizePlayerState(JSON.parse(saved));
  } catch (error) {
    console.warn("Failed to restore player state:", error);
    return null;
  }
};

const readUserQueue = (userId) => {
  const keys = getPlayerStorageKeys(userId);

  if (!keys || typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(keys.queueKey);
    const parsed = saved ? JSON.parse(saved) : [];

  return Array.isArray(parsed)
  ? parsed.filter((song) => song && (song._id || song.id))
  : [];
  } catch (error) {
    console.warn("Failed to restore playback queue:", error);
    return [];
  }
};

const saveUserPlayerState = (userId, state) => {
  const keys = getPlayerStorageKeys(userId);

  if (!keys || typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(keys.playerStateKey, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save player state:", error);
  }
};

const saveUserQueue = (userId, queue) => {
  const keys = getPlayerStorageKeys(userId);

  if (!keys || typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      keys.queueKey,
      JSON.stringify(Array.isArray(queue) ? queue : []),
    );
  } catch (error) {
    console.warn("Failed to save playback queue:", error);
  }
};

export const PlayerProvider = ({ children }) => {

const getSongAudioSource = (song) =>
  song?.audioFile ||
  song?.audioUrl ||
  song?.audio ||
  "";

  const { user, isAuthenticated } = useAuth();

  const userId = isAuthenticated && user?._id ? String(user._id) : null;

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  // =====================================================
  // AUDIO
  // =====================================================

  const audioRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
  }

  // =====================================================
  // USER / RESTORATION REFS
  // =====================================================

  const activeUserIdRef = useRef(null);
  const loadedUserIdRef = useRef(null);
  const userStateReadyRef = useRef(false);
  const restoreReadyRef = useRef(false);

  const savedPlayerStateRef = useRef(null);

  // =====================================================
  // LISTENING SESSION REFS
  // =====================================================

  const listeningSessionRef = useRef(null);
  const sessionSongIdRef = useRef(null);
  const startingListeningRef = useRef(false);
  const listenedSecondsRef = useRef(0);
  const lastListeningUpdateRef = useRef(0);

  const lastPlaybackTickRef = useRef(null);
  const previousPlaybackPositionRef = useRef(null);

  const progressUpdateInFlightRef = useRef(false);
  const pendingProgressRef = useRef(null);

  const sessionGenerationRef = useRef(0);
  const sessionStartPromiseRef = useRef(null);
  const sessionStartSongIdRef = useRef(null);

  // =====================================================
  // PLAYBACK REFS
  // =====================================================

  const currentSongRef = useRef(null);
  const currentIndexRef = useRef(-1);

  // The currently active playback list.
  const songsRef = useRef([]);

  // The complete song library, separate from the active playlist.
  const librarySongsRef = useRef([]);

  // Playback source tracking.
  const playbackSourceRef = useRef("library");
  const activePlaylistRef = useRef([]);
  const playlistIndexRef = useRef(-1);
  const activeQueueRef = useRef(false);

  const queueRef = useRef([]);

  const repeatRef = useRef(false);
  const shuffleRef = useRef(false);
  const durationRef = useRef(0);
  const volumeRef = useRef(1);
  const mutedRef = useRef(false);
  const seekingRef = useRef(false);
  const mountedRef = useRef(false);
  const playbackEpochRef = useRef(0);

  // =====================================================
  // SLEEP TIMER REFS
  // =====================================================

  const sleepTimerIntervalRef = useRef(null);
  const sleepTimerDeadlineRef = useRef(null);
  const sleepTimerModeRef = useRef(null);

  // =====================================================
  // CORE STATE
  //
  // IMPORTANT:
  // Do not restore a global song here.
  // The logged-in user's identity must be known first.
  // =====================================================

  const [songs, setSongsState] = useState([]);
  const [currentSong, setCurrentSongState] = useState(null);
  const [currentIndex, setCurrentIndexState] = useState(-1);
  const [queue, setQueueState] = useState([]);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState(false);

  const [sleepTimer, setSleepTimer] = useState(null);

  // =====================================================
  // SYNCHRONIZED STATE HELPERS
  // =====================================================

  const setSongs = useCallback((value) => {
    setSongsState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;

      const safeSongs = Array.isArray(next) ? next : [];

      songsRef.current = safeSongs;

      return safeSongs;
    });
  }, []);

  const setLibrarySongs = useCallback((value) => {
    const next =
      typeof value === "function" ? value(librarySongsRef.current) : value;

    const validSongs = Array.isArray(next)
      ? next.filter((song) => song?._id && song.audioFile)
      : [];

    const uniqueSongs = [
      ...new Map(validSongs.map((song) => [String(song._id), song])).values(),
    ];

    librarySongsRef.current = uniqueSongs;
    console.log("[PlayerContext] Stored library:", uniqueSongs.length);
    console.log(
      "[PlayerContext] Full library loaded:",
      uniqueSongs.length,
      "songs",
    );
  }, []);

useEffect(() => {
  let cancelled = false;

  const loadFullLibrary = async () => {
    try {
      console.log("[PlayerProvider] Loading local song library...");

      const response = await getSongs();

      console.log("[PlayerProvider] Songs API response:", response);

      const songsData = Array.isArray(response)
        ? response
        : Array.isArray(response?.songs)
          ? response.songs
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.songs)
              ? response.data.songs
              : [];

      if (cancelled) return;

      console.log(
        "[PlayerProvider] Local songs received:",
        songsData.length
      );

      if (songsData.length === 0) {
        console.warn(
          "[PlayerProvider] No local songs were returned by getSongs()."
        );
      }

      setLibrarySongs(songsData);
    } catch (error) {
      if (!cancelled) {
        console.error(
          "[PlayerProvider] Failed to load full song library:",
          error.response?.data || error.message
        );
      }
    }
  };

  void loadFullLibrary();

  return () => {
    cancelled = true;
  };
}, [setLibrarySongs]);

  const setCurrentSong = useCallback((value) => {
    setCurrentSongState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;

      currentSongRef.current = next || null;

      return next || null;
    });
  }, []);

  const setCurrentIndex = useCallback((value) => {
    setCurrentIndexState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;

      currentIndexRef.current = Number.isInteger(next) ? next : -1;

      return currentIndexRef.current;
    });
  }, []);

  const setShuffle = useCallback((value) => {
    setShuffleState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;

      shuffleRef.current = Boolean(next);

      return shuffleRef.current;
    });
  }, []);

  const setRepeat = useCallback((value) => {
    setRepeatState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;

      repeatRef.current = Boolean(next);

      return repeatRef.current;
    });
  }, []);

  const setQueue = useCallback((value) => {
    setQueueState((previous) => {
      const next = typeof value === "function" ? value(previous) : value;

      const safeQueue = Array.isArray(next)
        ? next.filter((song) => song && song._id)
        : [];

      queueRef.current = safeQueue;

      return safeQueue;
    });
  }, []);

  // =====================================================
  // QUEUE OPERATIONS
  // =====================================================

  const addToQueue = useCallback((song) => {
    if (!song?._id) return;

    setQueueState((previous) => {
      const list = Array.isArray(previous) ? previous : [];

      const alreadyExists = list.some(
        (item) => String(item?._id) === String(song._id),
      );

      if (alreadyExists) return list;

      const next = [...list, song];

      queueRef.current = next;

      return next;
    });
  }, []);

  const playNext = useCallback((song) => {
    if (!song?._id) return;

    setQueueState((previous) => {
      const list = (Array.isArray(previous) ? previous : []).filter(
        (item) => String(item?._id) !== String(song._id),
      );

      const next = [song, ...list];

      queueRef.current = next;

      return next;
    });
  }, []);

  const removeFromQueue = useCallback((songId) => {
    if (!songId) return;

    setQueueState((previous) => {
      const next = previous.filter(
        (song) => String(song?._id) !== String(songId),
      );

      queueRef.current = next;

      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setQueueState([]);
  }, []);

  // =====================================================
  // RESET THE ACTIVE PLAYER
  //
  // Used when logging out or switching accounts.
  // It clears in-memory playback without deleting the
  // previous user's separately saved player state.
  // =====================================================

  const resetActivePlayer = useCallback(() => {
    playbackEpochRef.current += 1;
    sessionGenerationRef.current += 1;

    const audio = audioRef.current;

    if (audio) {
      audio.pause();

      try {
        audio.currentTime = 0;
      } catch {
        // Metadata may not be available.
      }

      audio.removeAttribute("src");
      audio.load();
    }

    listeningSessionRef.current = null;
    sessionSongIdRef.current = null;
    startingListeningRef.current = false;
    sessionStartPromiseRef.current = null;
    sessionStartSongIdRef.current = null;

    listenedSecondsRef.current = 0;
    lastListeningUpdateRef.current = 0;
    pendingProgressRef.current = null;
    progressUpdateInFlightRef.current = false;

    lastPlaybackTickRef.current = null;
    previousPlaybackPositionRef.current = null;

    currentSongRef.current = null;
    currentIndexRef.current = -1;
    songsRef.current = [];
    queueRef.current = [];

    durationRef.current = 0;
    volumeRef.current = 1;
    mutedRef.current = false;
    repeatRef.current = false;
    shuffleRef.current = false;
    seekingRef.current = false;

    savedPlayerStateRef.current = null;
    restoreReadyRef.current = false;

    setSongsState([]);
    setCurrentSongState(null);
    setCurrentIndexState(-1);
    setQueueState([]);

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(1);
    setMuted(false);
    setShuffleState(false);
    setRepeatState(false);

    clearInterval(sleepTimerIntervalRef.current);
    sleepTimerIntervalRef.current = null;
    sleepTimerDeadlineRef.current = null;
    sleepTimerModeRef.current = null;
    setSleepTimer(null);
  }, []);

// =====================================================
// RESTORE ONLY THE CURRENT USER'S PLAYER
// =====================================================

useEffect(() => {
  const audio = audioRef.current;
  let cancelled = false;

  // Prevent persistence effects from saving stale state.
  userStateReadyRef.current = false;
  loadedUserIdRef.current = null;

  // Stop and clear the previous user's active playback.
  resetActivePlayer();

  activeUserIdRef.current = userId;

  // No authenticated user: start with an empty player.
  if (!userId) {
    savedPlayerStateRef.current = null;
    userStateReadyRef.current = true;
    restoreReadyRef.current = true;

    return () => {
      cancelled = true;
    };
  }

  // Restore state belonging only to this user.
  const savedState = readUserPlayerState(userId);
  const savedQueue = readUserQueue(userId);

  if (cancelled) return undefined;

  savedPlayerStateRef.current = savedState;

  queueRef.current = savedQueue;
  setQueueState(savedQueue);

  if (savedState?.song?._id) {
    const restoredSong = savedState.song;

    // Restore the saved playlist and ensure it contains the selected song.
    const savedPlaylist = Array.isArray(savedState.playlist)
      ? savedState.playlist.filter(
          (song) => song && (song._id || song.id),
        )
      : [];

    const restoredSongId = String(restoredSong._id);

    const playlistContainsSong = savedPlaylist.some(
      (song) => String(song._id ?? song.id) === restoredSongId,
    );

    const restoredPlaylist = playlistContainsSong
      ? savedPlaylist
      : [restoredSong, ...savedPlaylist];

    const restoredIndex = restoredPlaylist.findIndex(
      (song) => String(song._id ?? song.id) === restoredSongId,
    );

    // Update refs before React state so playback handlers see consistent data.
    currentSongRef.current = restoredSong;
    currentIndexRef.current = restoredIndex;
    songsRef.current = restoredPlaylist;

    setCurrentSongState(restoredSong);
    setCurrentIndexState(restoredIndex);
    setSongsState(restoredPlaylist);

    const restoredPosition = Math.max(
      0,
      Number(savedState.position) || 0,
    );

    const restoredVolume = Math.max(
      0,
      Math.min(1, Number(savedState.volume) || 0),
    );

    const restoredMuted = Boolean(savedState.muted);
    const restoredShuffle = Boolean(savedState.shuffle);
    const restoredRepeat = Boolean(savedState.repeat);

    setCurrentTime(restoredPosition);
    setVolume(restoredVolume);
    setMuted(restoredMuted);
    setShuffleState(restoredShuffle);
    setRepeatState(restoredRepeat);

    volumeRef.current = restoredVolume;
    mutedRef.current = restoredMuted;
    shuffleRef.current = restoredShuffle;
    repeatRef.current = restoredRepeat;

    // The saved audio position will be restored by the dedicated
    // saved-position effect after the audio metadata becomes available.
    restoreReadyRef.current = false;
  } else {
    // No valid saved song: leave the player empty.
    currentSongRef.current = null;
    currentIndexRef.current = -1;
    songsRef.current = [];

    setCurrentSongState(null);
    setCurrentIndexState(-1);
    setSongsState([]);
    setCurrentTime(0);
    setDuration(0);

    durationRef.current = 0;

    restoreReadyRef.current = true;
  }

  // Mark restoration complete for this authenticated user.
  loadedUserIdRef.current = userId;
  userStateReadyRef.current = true;

  return () => {
    cancelled = true;

    // Pause only during cleanup, such as an account switch or unmount.
    if (audio) {
      audio.pause();
    }
  };
}, [userId, resetActivePlayer]);

  // =====================================================
  // USER-SPECIFIC QUEUE PERSISTENCE
  // =====================================================

 useEffect(() => {
if (!userId) return;

if (!userStateReadyRef.current) return;
if (activeUserIdRef.current !== userId) return;
if (loadedUserIdRef.current !== userId) return;

saveUserQueue(userId, queue);
}, [userId, queue]);


  // =====================================================
  // AUDIO VOLUME
  // =====================================================

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = muted ? 0 : volume;

    volumeRef.current = volume;
    mutedRef.current = muted;
  }, [volume, muted]);

  // =====================================================
  // LISTENING PROGRESS TRACKING
  // =====================================================

  const resetPlaybackTrackers = useCallback(() => {
    lastPlaybackTickRef.current = null;
    previousPlaybackPositionRef.current = null;
  }, []);

  const accumulateListeningTime = useCallback(
    (force = false) => {
      const audio = audioRef.current;

      if (!audio || !listeningSessionRef.current || seekingRef.current) {
        resetPlaybackTrackers();
        return;
      }

      if (!force && (audio.paused || audio.ended)) {
        resetPlaybackTrackers();
        return;
      }

      const now = performance.now();
      const position = Number(audio.currentTime);

      if (!Number.isFinite(position) || position < 0) {
        resetPlaybackTrackers();
        return;
      }

      const previousTick = lastPlaybackTickRef.current;
      const previousPosition = previousPlaybackPositionRef.current;

      lastPlaybackTickRef.current = now;
      previousPlaybackPositionRef.current = position;

      if (previousTick === null || previousPosition === null) {
        return;
      }

      const wallDelta = (now - previousTick) / 1000;
      const playbackDelta = position - previousPosition;

      if (
        wallDelta <= 0 ||
        wallDelta > MAX_TICK_INTERVAL ||
        playbackDelta <= 0 ||
        Math.abs(playbackDelta - wallDelta) > POSITION_TOLERANCE
      ) {
        return;
      }

      listenedSecondsRef.current += Math.min(playbackDelta, wallDelta + 0.1);
    },
    [resetPlaybackTrackers],
  );

  const mergeProgressTasks = useCallback((previous, next) => {
// Handle missing tasks safely.
if (!previous) return next;
if (!next) return previous;

// Never merge progress belonging to different listening sessions.
if (previous.historyId !== next.historyId) {
return {
historyId: next.historyId,
payload: { ...next.payload },
};
}

// Merge progress for the same session without losing accumulated time.
return {
historyId: next.historyId,
payload: {
listenedSeconds: Math.max(
Number(previous.payload?.listenedSeconds) || 0,
Number(next.payload?.listenedSeconds) || 0,
),
position: next.payload.position,
duration: next.payload.duration,
completed:
previous.payload?.completed === true ||
next.payload?.completed === true,
},
};
}, []);


  const saveListeningProgress = useCallback(
    async (completed = false, force = false) => {
      const historyId = listeningSessionRef.current;

      if (!historyId) return;

      const audio = audioRef.current;

      const listenedSeconds = Math.max(
        0,
        Math.floor(listenedSecondsRef.current),
      );

      const position = Number(audio?.currentTime);
      const actualDuration = Number(audio?.duration);

      const payload = {
        listenedSeconds,
        position: Number.isFinite(position) && position >= 0 ? position : 0,
        duration:
          Number.isFinite(actualDuration) && actualDuration > 0
            ? actualDuration
            : Math.max(0, durationRef.current || 0),
      };

      if (completed === true) {
        payload.completed = true;
      }

      if (
        !force &&
        !completed &&
        listenedSeconds - lastListeningUpdateRef.current <
          PROGRESS_SAVE_INTERVAL
      ) {
        return;
      }

      const task = { historyId, payload };

      if (progressUpdateInFlightRef.current) {
        pendingProgressRef.current = mergeProgressTasks(
          pendingProgressRef.current,
          task,
        );
        return;
      }

      progressUpdateInFlightRef.current = true;

      let nextTask = task;

      try {
        while (nextTask) {
          const currentTask = nextTask;

          try {
            await updateListening(currentTask.historyId, currentTask.payload);

            if (listeningSessionRef.current === currentTask.historyId) {
              lastListeningUpdateRef.current = Math.max(
                lastListeningUpdateRef.current,
                currentTask.payload.listenedSeconds,
              );
            }
          } catch (error) {
            console.error("Listening history update failed:", error);

            pendingProgressRef.current = mergeProgressTasks(
              currentTask,
              pendingProgressRef.current,
            );

            break;
          }

          nextTask = pendingProgressRef.current;
          pendingProgressRef.current = null;
        }
      } finally {
        progressUpdateInFlightRef.current = false;
      }
    },
    [mergeProgressTasks],
  );

  const finishListeningSession = useCallback(
    async (completed = false) => {
      const historyId = listeningSessionRef.current;

      if (!historyId) return;

      accumulateListeningTime(true);
      resetPlaybackTrackers();

      // Save the previous session's progress.
      await saveListeningProgress(completed, true);

      // Do not clear a newer song's listening session.
      if (listeningSessionRef.current !== historyId) {
        return;
      }

      listeningSessionRef.current = null;
      sessionSongIdRef.current = null;

      listenedSecondsRef.current = 0;
      lastListeningUpdateRef.current = 0;

      if (pendingProgressRef.current?.historyId === historyId) {
        pendingProgressRef.current = null;
      }

      sessionGenerationRef.current += 1;
    },
    [accumulateListeningTime, resetPlaybackTrackers, saveListeningProgress],
  );

  const createListeningSession = useCallback(
    async (song) => {
      if (!song?._id || !userId) return;

      const songId = String(song._id);

      if (listeningSessionRef.current && sessionSongIdRef.current === songId) {
        return;
      }

      if (
        startingListeningRef.current &&
        sessionStartSongIdRef.current === songId &&
        sessionStartPromiseRef.current
      ) {
        return sessionStartPromiseRef.current;
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      if (!token) return;

      const requestedUserId = userId;
      const generation = sessionGenerationRef.current;

      startingListeningRef.current = true;
      sessionStartSongIdRef.current = songId;

      const startPromise = (async () => {
        try {
          const response = await startListening(songId);

          const historyId = response?.history?._id || response?.historyId;

          const userChanged = activeUserIdRef.current !== requestedUserId;

          if (
            !mountedRef.current ||
            generation !== sessionGenerationRef.current ||
            userChanged ||
            String(currentSongRef.current?._id) !== songId
          ) {
            if (historyId) {
              await updateListening(historyId, {
                listenedSeconds: 0,
                completed: false,
              }).catch((error) => {
                console.warn(
                  "Could not close orphan listening session:",
                  error,
                );
              });
            }

            return;
          }

          if (response?.success && historyId) {
            listeningSessionRef.current = historyId;
            sessionSongIdRef.current = songId;

            listenedSecondsRef.current = 0;
            lastListeningUpdateRef.current = 0;

            if (
              pendingProgressRef.current &&
              pendingProgressRef.current.historyId !== historyId
            ) {
              pendingProgressRef.current = null;
            }

            const audio = audioRef.current;

            if (audio && !audio.paused) {
              lastPlaybackTickRef.current = performance.now();
              previousPlaybackPositionRef.current =
                Number(audio.currentTime) || 0;
            } else {
              resetPlaybackTrackers();
            }
          }
        } catch (error) {
          console.error("Listening history start error:", error);
        } finally {
          if (sessionStartPromiseRef.current === startPromise) {
            sessionStartPromiseRef.current = null;
            sessionStartSongIdRef.current = null;
            startingListeningRef.current = false;
          }
        }
      })();

      sessionStartPromiseRef.current = startPromise;

      return startPromise;
    },
    [userId, resetPlaybackTrackers],
  );

  // =====================================================
  // AUDIO URL
  // =====================================================

 const getAudioUrl = useCallback((audioFile) => {
if (!audioFile) return "";

const value = String(audioFile).trim();
if (!value) return "";

// Preserve complete Cloudinary and other HTTP(S) URLs.
if (/^https?:\/\//i.test(value)) {
return value;
}

// Normalize Windows-style paths.
let cleanPath = value.replace(/\\/g, "/");

// If a full local path was stored, keep only the uploads/ portion.
const uploadsIndex = cleanPath.toLowerCase().indexOf("uploads/");

if (uploadsIndex !== -1) {
cleanPath = cleanPath.substring(uploadsIndex);
}

// Remove leading slashes.
cleanPath = cleanPath.replace(/^\/+/, "");

// Normalize repeated uploads/ prefixes.
cleanPath = cleanPath.replace(/^(?:uploads\/)+/i, "uploads/");

// Remove trailing slashes from BASE_URL.
const baseUrl = String(BASE_URL || "").replace(/\/+$/, "");

if (!baseUrl) {
console.error("BASE_URL is missing in config/api.");
return "";
}

if (!cleanPath) return "";

return `${baseUrl}/${cleanPath}`;
}, []);


  // =====================================================
  // RESTORE THE SELECTED USER'S SAVED POSITION
  //
  // Restore only the saved song belonging to the logged-in
  // user. Never pause or reset a song selected by Next/Prev.
  // =====================================================

  useEffect(() => {
    if (!userId || !userStateReadyRef.current) return;
    if (activeUserIdRef.current !== userId) return;
    if (loadedUserIdRef.current !== userId) return;

    const saved = savedPlayerStateRef.current;
    const song = currentSongRef.current;
    const audio = audioRef.current;

    // No saved song exists for this user.
    if (!saved?.song?._id) {
      restoreReadyRef.current = true;
      return;
    }

    // Only restore the original saved song.
    // Do not interfere with a song selected by Next/Previous.
    if (!song?._id || String(song._id) !== String(saved.song._id)) {
      return;
    }

    if (!audio) {
      restoreReadyRef.current = true;
      return;
    }



const audioSource = getSongAudioSource(song);
const url = getAudioUrl(audioSource);

    if (!url) {
      console.error(
        "Could not restore saved song: audio URL is missing.",
        song,
      );

      restoreReadyRef.current = true;
      return;
    }

    let cancelled = false;

   const restorePosition = () => {
  if (cancelled) return;

  if (activeUserIdRef.current !== userId) return;

  // Make sure the saved song is still selected.
  const currentSongId =
    currentSongRef.current?._id ?? currentSongRef.current?.id;
  const savedSongId = saved.song?._id ?? saved.song?.id;

  if (
    currentSongId == null ||
    savedSongId == null ||
    String(currentSongId) !== String(savedSongId)
  ) {
    return;
  }

  const target = Math.max(0, Number(saved.position) || 0);

  try {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(
        target,
        Math.max(0, audio.duration - 0.25),
      );
    } else {
      audio.currentTime = target;
    }
  } catch (error) {
    console.warn("Could not restore playback position:", error);
  }

  setCurrentTime(Number(audio.currentTime) || 0);

  durationRef.current =
    Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : 0;

  setDuration(durationRef.current);
  restoreReadyRef.current = true;
};

    // This effect should pause audio only while restoring the
    // saved song, never when the user selects another song.

    audio.pause();

setPlaying(false);

if (audio.src !== url) {
  audio.src = url;
  audio.load();
}

if (audio.readyState >= 1) {
  restorePosition();
} else {
  audio.addEventListener("loadedmetadata", restorePosition, {
    once: true,
  });
}

return () => {
  cancelled = true;
  audio.removeEventListener("loadedmetadata", restorePosition);
};
}, [userId, currentSong?._id, getAudioUrl]);

  // =====================================================
  // SAVE THE CURRENT USER'S PLAYER STATE
  // =====================================================

  useEffect(() => {
  if (!userId) return;
  if (!userStateReadyRef.current) return;
  if (activeUserIdRef.current !== userId) return;
  if (loadedUserIdRef.current !== userId) return;
  if (!restoreReadyRef.current) return;

  // Do not save a player state without a selected song.
  const songId = currentSong?._id ?? currentSong?.id;
  if (songId == null) return;

  const audioPosition = Number(audioRef.current?.currentTime);

  const position =
    Number.isFinite(audioPosition) && audioPosition >= 0
      ? audioPosition
      : Math.max(0, Number(currentTime) || 0);

  saveUserPlayerState(userId, {
    song: currentSong,
    index: currentIndex,
    position,
    volume,
    muted,
    shuffle,
    repeat,
    savedAt: Date.now(),
  });
}, [
  userId,
  currentSong,
  currentIndex,
  currentTime,
  volume,
  muted,
  shuffle,
  repeat,
]);

  // =====================================================
  // PLAY SONG
  // =====================================================

 const playSongInternal = useCallback(
  async (
    song,
    index = 0,
    playlist = songsRef.current,
    source = "library",
  ) => {
    // Require an authenticated user.
    if (!isAuthenticated || !userId) {
      setLoginPromptOpen(true);
      return;
    }

    if (!song || typeof song !== "object") return;

    // Support MongoDB _id and fallback id.
    const rawSongId = song._id ?? song.id;

    if (rawSongId == null || String(rawSongId).trim() === "") {
      console.error("Cannot play a song without an ID:", song);
      return;
    }

    const songId = String(rawSongId);

    // Wait until the current user's player state is ready.
    if (
      !userStateReadyRef.current ||
      activeUserIdRef.current !== userId ||
      loadedUserIdRef.current !== userId
    ) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Keep the selected track in the playback list.
    const suppliedPlaylist = Array.isArray(playlist) ? playlist : [];

    const safePlaylist = suppliedPlaylist.some(
      (item) => getTrackId(item) === songId,
    )
      ? suppliedPlaylist
      : [song, ...suppliedPlaylist];

    const playlistIndex = safePlaylist.findIndex(
      (item) => getTrackId(item) === songId,
    );

    const safeIndex =
      playlistIndex >= 0 ? playlistIndex : Math.max(0, index);

    // Track the playback source and navigation list.
    if (source === "playlist") {
      playbackSourceRef.current = "playlist";
      activePlaylistRef.current = safePlaylist;
      activeQueueRef.current = false;
      playlistIndexRef.current = safeIndex;
    } else if (source === "queue") {
      playbackSourceRef.current = "queue";
      activeQueueRef.current = true;
      activePlaylistRef.current = safePlaylist;
      playlistIndexRef.current = safeIndex;
    } else {
      playbackSourceRef.current = "library";
      activeQueueRef.current = false;
      activePlaylistRef.current = [];
      playlistIndexRef.current = -1;
    }

    const sameSong = getTrackId(currentSongRef.current) === songId;
    const epoch = ++playbackEpochRef.current;

    try {
      if (!sameSong) {
        // Save elapsed time and close the previous listening session.
        accumulateListeningTime(true);
        audio.pause();
        sessionGenerationRef.current += 1;

        const finishPreviousSession = finishListeningSession(false);

        // Don't continue if a newer request has taken over.
        if (
          !mountedRef.current ||
          epoch !== playbackEpochRef.current ||
          activeUserIdRef.current !== userId
        ) {
          void Promise.resolve(finishPreviousSession).catch((error) => {
            console.error(
              "Finish previous listening session failed:",
              error,
            );
          });

          return;
        }

        // Don't block playback while the old session finishes.
        void Promise.resolve(finishPreviousSession).catch((error) => {
          console.error(
            "Finish previous listening session failed:",
            error,
          );
        });
      }

      restoreReadyRef.current = true;
      savedPlayerStateRef.current = null;

      // Update the player state.
      songsRef.current = safePlaylist;
      setSongsState(safePlaylist);

      currentSongRef.current = song;
      setCurrentSongState(song);

      currentIndexRef.current = safeIndex;
      setCurrentIndexState(safeIndex);

      // Reset playback progress for the selected track.
      seekingRef.current = false;
      setCurrentTime(0);
      durationRef.current = 0;
      setDuration(0);
      resetPlaybackTrackers();

      // Resolve the audio source.
      const audioSource = getSongAudioSource(song);
      const url = getAudioUrl(audioSource);

      if (!url) {
        console.error("Audio URL is missing for song:", song);
        setPlaying(false);
        return;
      }

      // Load or restart the selected audio source.
      if (audio.src !== url) {
        audio.pause();
        audio.src = url;
        audio.load();
      } else {
        audio.currentTime = 0;
      }

      audio.volume = mutedRef.current ? 0 : volumeRef.current;

      // Start playback.
      await audio.play();

      // Ignore stale playback requests.
      if (
        !mountedRef.current ||
        epoch !== playbackEpochRef.current ||
        activeUserIdRef.current !== userId
      ) {
        audio.pause();
        return;
      }

      setPlaying(true);

      // Update duration if metadata is already available.
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        durationRef.current = audio.duration;
        setDuration(audio.duration);
      }

      setCurrentTime(
        Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      );

      // Only MongoDB songs should create database listening sessions.
      if (song._id && activeUserIdRef.current === userId) {
        void createListeningSession(song);
      }
    } catch (error) {
      // A source replacement can interrupt an earlier play request.
      if (
        error?.name === "AbortError" ||
        epoch !== playbackEpochRef.current
      ) {
        return;
      }

      console.error("Play song error:", error);
      setPlaying(false);
    }
  },
  [
    userId,
    isAuthenticated,
    accumulateListeningTime,
    finishListeningSession,
    resetPlaybackTrackers,
    getAudioUrl,
    createListeningSession,
  ],
);

  // =====================================================
  // PUBLIC PLAY SONG FUNCTION
  // =====================================================

  const playSong = useCallback(
    (song, index = 0, playlist = songsRef.current, source = "library") =>
      playSongInternal(song, index, playlist, source),
    [playSongInternal],
  );

  // =====================================================
  // PLAY / PAUSE
  // =====================================================


const togglePlay = useCallback(async () => {
  const audio = audioRef.current;
  const song = currentSongRef.current;

  if (!isAuthenticated || !userId) {
    setLoginPromptOpen(true);
    return;
  }

  if (!audio || !song || !userId) return;

  if (
    !userStateReadyRef.current ||
    activeUserIdRef.current !== userId ||
    loadedUserIdRef.current !== userId
  ) {
    return;
  }

  try {
    // Pause the current track.
    if (!audio.paused) {
      accumulateListeningTime(true);
      audio.pause();
      setPlaying(false);

      // Preserve existing progress-saving behavior.
      void saveListeningProgress(false, true);
      return;
    }

    // Resolve the correct audio field for the selected song.
    const audioSource = getSongAudioSource(song);
    const url = getAudioUrl(audioSource);

    if (!url) {
      console.error("Audio URL is missing for song:", song.title, song);
      setPlaying(false);
      return;
    }

    // Identify this playback request so stale requests cannot update state.
    const epoch = playbackEpochRef.current;
    const selectedSongId = getTrackId(song);

    // Reload the source if it differs from the selected track.
    if (audio.src !== url) {
      audio.pause();
      audio.src = url;
      audio.load();
    }

    // Wait until the browser recognizes the audio source.
    if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
      await new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        const onCanPlay = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };

        const onError = () => {
          if (settled) return;
          settled = true;
          cleanup();

          reject(
            new Error(
              `Audio failed to load. Media error code: ${
                audio.error?.code ?? "unknown"
              }`,
            ),
          );
        };

        audio.addEventListener("canplay", onCanPlay, { once: true });
        audio.addEventListener("error", onError, { once: true });

        // Recheck in case metadata became available before the listeners
        // were attached.
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          onCanPlay();
        } else {
          audio.load();
        }
      });
    }

    // Stop if the selected song or playback request changed while loading.
    if (
      !mountedRef.current ||
      epoch !== playbackEpochRef.current ||
      activeUserIdRef.current !== userId ||
      getTrackId(currentSongRef.current) !== selectedSongId
    ) {
      return;
    }

    // Apply the current volume and mute state.
    audio.volume = mutedRef.current ? 0 : volumeRef.current;

    await audio.play();

    // Check again after the asynchronous play request.
    if (
      !mountedRef.current ||
      epoch !== playbackEpochRef.current ||
      activeUserIdRef.current !== userId ||
      getTrackId(currentSongRef.current) !== selectedSongId
    ) {
      audio.pause();
      return;
    }

    setPlaying(true);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      durationRef.current = audio.duration;
      setDuration(audio.duration);
    }

    setCurrentTime(
      Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
    );

    // Only MongoDB songs should create database listening sessions.
    if (song._id) {
      void createListeningSession(song);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    console.error("Toggle play error:", {
      name: error?.name,
      message: error?.message,
      audioSrc: audio?.currentSrc || audio?.src,
      readyState: audio?.readyState,
      networkState: audio?.networkState,
      mediaErrorCode: audio?.error?.code ?? null,
    });

    setPlaying(false);
  }
}, [
  userId,
  isAuthenticated,
  accumulateListeningTime,
  saveListeningProgress,
  createListeningSession,
  getAudioUrl,
]);


  // =====================================================
  // NEXT SONG
  // =====================================================

  const nextSong = useCallback(async () => {
  if (!isAuthenticated || !userId) {
    setLoginPromptOpen(true);
    return;
  }

  if (
    !userStateReadyRef.current ||
    activeUserIdRef.current !== userId ||
    loadedUserIdRef.current !== userId
  ) {
    return;
  }

  const currentSongId = getTrackId(currentSongRef.current);
  if (!currentSongId) return;

  // Keep songs that have an ID and a usable audio source.
  const validSongs = (list) =>
    Array.isArray(list)
      ? list.filter(
          (song) =>
            getTrackId(song) &&
            getSongAudioSource(song),
        )
      : [];

  const chooseRandomLibrarySong = async () => {
    const library = validSongs(librarySongsRef.current);

    if (!library.length) {
      console.warn("The full song library is not loaded.");
      return;
    }

    const candidates =
      library.length > 1
        ? library.filter(
            (song) => getTrackId(song) !== currentSongId,
          )
        : library;

    if (!candidates.length) return;

    const selected =
      candidates[Math.floor(Math.random() * candidates.length)];

    const selectedIndex = library.findIndex(
      (song) => getTrackId(song) === getTrackId(selected),
    );

    await playSongInternal(
      selected,
      selectedIndex,
      library,
      "library",
    );
  };

  try {
    // 1. Playlist mode: never fall back to the library.
    if (playbackSourceRef.current === "playlist") {
      const playlist = validSongs(activePlaylistRef.current);

      if (!playlist.length) {
        audioRef.current?.pause();
        setPlaying(false);
        console.error(
          "Playlist mode is active, but its song list is empty.",
        );
        return;
      }

      const currentIndex = playlist.findIndex(
        (song) => getTrackId(song) === currentSongId,
      );

      if (currentIndex === -1) {
        audioRef.current?.pause();
        setPlaying(false);
        console.error(
          "Current song is not part of the active playlist.",
        );
        return;
      }

      const nextIndex = currentIndex + 1;
      const shouldRepeatPlaylist =
        repeatRef.current === true ||
        repeatRef.current === "all";

      if (nextIndex < playlist.length) {
        await playSongInternal(
          playlist[nextIndex],
          nextIndex,
          playlist,
          "playlist",
        );
      } else if (shouldRepeatPlaylist) {
        await playSongInternal(
          playlist[0],
          0,
          playlist,
          "playlist",
        );
      } else {
        audioRef.current?.pause();
        setPlaying(false);
        console.info("Reached the end of the playlist.");
      }

      return;
    }

    // 2. Queue mode.
    if (
      playbackSourceRef.current === "queue" ||
      activeQueueRef.current
    ) {
      const originalQueue = Array.isArray(queueRef.current)
        ? queueRef.current
        : [];

      const queuedSongs = validSongs(originalQueue);

      if (queuedSongs.length > 0) {
        const nextQueuedSong = queuedSongs[0];
        const nextQueuedId = getTrackId(nextQueuedSong);
        const remainingQueue = originalQueue.filter(
          (song, index) =>
            index !== originalQueue.findIndex(
              (item) => getTrackId(item) === nextQueuedId,
            ),
        );

        queueRef.current = remainingQueue;
        setQueueState(remainingQueue);

        const library = validSongs(librarySongsRef.current);
        const libraryIndex = library.findIndex(
          (song) => getTrackId(song) === nextQueuedId,
        );

        await playSongInternal(
          nextQueuedSong,
          libraryIndex >= 0 ? libraryIndex : 0,
          library.length ? library : [nextQueuedSong],
          "queue",
        );

        return;
      }

      activeQueueRef.current = false;
      playbackSourceRef.current = "library";
    }

    // 3. Library mode.
    await chooseRandomLibrarySong();
  } catch (error) {
    console.error("Next song error:", error);
  }
}, [
  userId,
  isAuthenticated,
  playSongInternal,
  setQueueState,
]);

  // =====================================================
  // PREVIOUS SONG
  // =====================================================

 const previousSong = useCallback(async () => {
  if (!isAuthenticated || !userId) {
    setLoginPromptOpen(true);
    return;
  }

  if (
    !userStateReadyRef.current ||
    activeUserIdRef.current !== userId ||
    loadedUserIdRef.current !== userId
  ) {
    return;
  }

  const currentSongId = getTrackId(currentSongRef.current);
  if (!currentSongId) return;

  const validSongs = (list) =>
    Array.isArray(list)
      ? list.filter(
          (song) =>
            getTrackId(song) &&
            getSongAudioSource(song),
        )
      : [];

  const source = playbackSourceRef.current;

  try {
    // Playlist: navigate only within the active playlist.
    if (source === "playlist") {
      const playlist = validSongs(activePlaylistRef.current);

      if (!playlist.length) return;

      const currentIndex = playlist.findIndex(
        (song) => getTrackId(song) === currentSongId,
      );

      if (currentIndex === -1) {
        console.error("Current song is not in the active playlist.");
        return;
      }

      const previousIndex =
        currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;

      await playSongInternal(
        playlist[previousIndex],
        previousIndex,
        playlist,
        "playlist",
      );

      return;
    }

    // Queue: navigate within the active playback list.
    if (source === "queue" || activeQueueRef.current) {
      const queue = validSongs(songsRef.current);

      if (queue.length < 2) return;

      const currentIndex = queue.findIndex(
        (song) => getTrackId(song) === currentSongId,
      );

      if (currentIndex <= 0) return;

      await playSongInternal(
        queue[currentIndex - 1],
        currentIndex - 1,
        queue,
        "queue",
      );

      return;
    }

    // Library: move backward through the library list.
    const library = validSongs(librarySongsRef.current);

    if (library.length < 2) return;

    const currentIndex = library.findIndex(
      (song) => getTrackId(song) === currentSongId,
    );

    if (currentIndex === -1) return;

    const previousIndex =
      currentIndex === 0 ? library.length - 1 : currentIndex - 1;

    await playSongInternal(
      library[previousIndex],
      previousIndex,
      library,
      "library",
    );
  } catch (error) {
    console.error("Previous song error:", error);
  }
}, [
  userId,
  isAuthenticated,
  playSongInternal,
]);

  // =====================================================
  // SEEK
  // =====================================================

const seekSong = useCallback((time) => {
  const audio = audioRef.current;

  if (!audio) return;

  const nextTime = Number(time);
  if (!Number.isFinite(nextTime)) return;

  const maxTime =
    Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : Math.max(0, Number(durationRef.current) || nextTime);

  const safeTime = Math.max(0, Math.min(nextTime, maxTime));

  try {
    seekingRef.current = true;

    lastPlaybackTickRef.current = null;
    previousPlaybackPositionRef.current = null;

    audio.currentTime = safeTime;
    setCurrentTime(safeTime);
  } catch (error) {
    seekingRef.current = false;
    console.warn("Could not seek to the requested position:", error);
  }
}, []);

  // =====================================================
  // VOLUME
  // =====================================================

const changeVolume = useCallback((value) => {
  const numericVolume = Number(value);

  if (!Number.isFinite(numericVolume)) return;

  const safeVolume = Math.max(0, Math.min(1, numericVolume));
  const shouldMute = safeVolume === 0;

  volumeRef.current = safeVolume;
  mutedRef.current = shouldMute;

  setVolume(safeVolume);
  setMuted(shouldMute);

  if (audioRef.current) {
    audioRef.current.volume = shouldMute ? 0 : safeVolume;
  }
}, []);

const toggleMute = useCallback(() => {
  if (mutedRef.current) {
    const restoredVolume =
      volumeRef.current > 0 ? volumeRef.current : 1;

    volumeRef.current = restoredVolume;
    mutedRef.current = false;

    if (audioRef.current) {
      audioRef.current.volume = restoredVolume;
    }

    setVolume(restoredVolume);
    setMuted(false);
  } else {
    mutedRef.current = true;

    if (audioRef.current) {
      audioRef.current.volume = 0;
    }

    setMuted(true);
  }
}, []);

  // =====================================================
  // SLEEP TIMER
  // =====================================================

const clearSleepTimerInterval = useCallback(() => {
  if (sleepTimerIntervalRef.current !== null) {
    clearInterval(sleepTimerIntervalRef.current);
    sleepTimerIntervalRef.current = null;
  }
}, []);

const startSleepTimer = useCallback(
  (minutes) => {
    clearSleepTimerInterval();

    if (minutes === "end") {
      sleepTimerDeadlineRef.current = null;
      sleepTimerModeRef.current = "end";

      setSleepTimer("end");
      return;
    }

    const numericMinutes = Number(minutes);

    if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
      sleepTimerDeadlineRef.current = null;
      sleepTimerModeRef.current = null;
      setSleepTimer(null);
      return;
    }

    const seconds = numericMinutes * 60;

    sleepTimerModeRef.current = "timer";
    sleepTimerDeadlineRef.current = Date.now() + seconds * 1000;

    setSleepTimer(Math.ceil(seconds));
  },
  [clearSleepTimerInterval],
);

const cancelSleepTimer = useCallback(() => {
  clearSleepTimerInterval();

  sleepTimerDeadlineRef.current = null;
  sleepTimerModeRef.current = null;

  setSleepTimer(null);
}, [clearSleepTimerInterval]);

useEffect(() => {
  clearSleepTimerInterval();

  if (sleepTimer === null || sleepTimer === "end") {
    return undefined;
  }

  const updateCountdown = () => {
    const deadline = sleepTimerDeadlineRef.current;

    if (deadline === null) return;

    const remaining = Math.max(
      0,
      Math.ceil((deadline - Date.now()) / 1000),
    );

    if (remaining <= 0) {
      clearSleepTimerInterval();

      sleepTimerDeadlineRef.current = null;
      sleepTimerModeRef.current = null;

      // Account for listening time before pausing.
      accumulateListeningTime(true);

      audioRef.current?.pause();
      setPlaying(false);

      // Save the final progress for the current listening session.
      void saveListeningProgress(false, true);

      setSleepTimer(null);
      return;
    }

    setSleepTimer(remaining);
  };

  updateCountdown();

  // updateCountdown may already have expired the timer.
  if (sleepTimerDeadlineRef.current !== null) {
    sleepTimerIntervalRef.current = setInterval(updateCountdown, 1000);
  }

  return clearSleepTimerInterval;
}, [
  sleepTimer,
  clearSleepTimerInterval,
  accumulateListeningTime,
  saveListeningProgress,
]);

const sleepTimerDisplay = useMemo(() => {
  if (sleepTimer === null) return "";

  if (sleepTimer === "end") {
    return "End of song";
  }

  const totalSeconds = Math.max(0, Number(sleepTimer) || 0);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${String(secs).padStart(2, "0")}`;
}, [sleepTimer]);

  // =====================================================
  // AUDIO EVENTS
  // =====================================================

useEffect(() => {
  const audio = audioRef.current;

  if (!audio) return undefined;

  let lastUiTime = -1;

  const getTrackId = (song) => {
    const id = song?._id ?? song?.id;
    return id == null || String(id).trim() === "" ? null : String(id);
  };

  const getTrackSource = (song) =>
    song?.audioFile || song?.audioUrl || song?.audio || "";

  const updateTime = (force = false) => {
    const nextTime = Number(audio.currentTime);

    if (!Number.isFinite(nextTime) || nextTime < 0) return;

    if (
      force ||
      lastUiTime < 0 ||
      Math.abs(nextTime - lastUiTime) >= 0.25
    ) {
      lastUiTime = nextTime;

      setCurrentTime((previous) =>
        Math.abs(previous - nextTime) >= 0.02 ? nextTime : previous,
      );
    }
  };

  const updateDuration = () => {
    const nextDuration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : 0;

    durationRef.current = nextDuration;
    setDuration(nextDuration);
  };

  const handlePlay = () => {
    setPlaying(true);
    lastPlaybackTickRef.current = performance.now();
    previousPlaybackPositionRef.current = Number(audio.currentTime) || 0;
  };

  const handlePause = () => {
    lastPlaybackTickRef.current = null;
    previousPlaybackPositionRef.current = null;
    setPlaying(false);
  };

  const handleSeeking = () => {
    seekingRef.current = true;
    lastPlaybackTickRef.current = null;
    previousPlaybackPositionRef.current = null;
  };

  const handleSeeked = () => {
    seekingRef.current = false;
    updateTime(true);

    previousPlaybackPositionRef.current = Number(audio.currentTime) || 0;
    lastPlaybackTickRef.current =
      !audio.paused && !audio.ended ? performance.now() : null;
  };

  const handleLoadedMetadata = () => {
    updateDuration();
    updateTime(true);
  };

  const handleTimeUpdate = () => {
    updateTime();
    accumulateListeningTime();

    if (!listeningSessionRef.current || audio.paused || audio.ended) {
      return;
    }

    const listened = Math.floor(listenedSecondsRef.current);

    if (
      listened - lastListeningUpdateRef.current >=
      PROGRESS_SAVE_INTERVAL
    ) {
      void saveListeningProgress(false);
    }
  };

  const validSongs = (list) =>
    Array.isArray(list)
      ? list.filter(
          (song) => getTrackId(song) && getTrackSource(song),
        )
      : [];

  const handleEnded = async () => {
    accumulateListeningTime(true);

    try {
      await finishListeningSession(true);
    } catch (error) {
      console.error("Could not finish listening session:", error);
    }

    if (!mountedRef.current) return;

    // Stop after the current song when the sleep timer is set to "end".
    if (sleepTimerModeRef.current === "end") {
      cancelSleepTimer();
      audio.pause();
      setPlaying(false);
      return;
    }

    const repeatMode = repeatRef.current;
    const source = playbackSourceRef.current;
    const currentSong = currentSongRef.current;
    const currentSongId = getTrackId(currentSong);

    // Repeat-one should replay the current song, not advance the queue.
    if (
      repeatMode === "one" ||
      repeatMode === "song" ||
      repeatMode === 1
    ) {
      audio.currentTime = 0;

      try {
        await audio.play();

        if (!mountedRef.current) {
          audio.pause();
          return;
        }

        setPlaying(true);
        void createListeningSession(currentSong);
      } catch (error) {
        console.error("Repeat play error:", error);
        setPlaying(false);
      }

      return;
    }

    // Playlist playback stays within the active playlist.
    if (source === "playlist") {
      const playlist = validSongs(activePlaylistRef.current);

      if (!playlist.length) {
        setPlaying(false);
        return;
      }

      const currentIndex = playlist.findIndex(
        (song) => getTrackId(song) === currentSongId,
      );

      if (currentIndex < 0) {
        setPlaying(false);
        return;
      }

      const nextIndex = currentIndex + 1;

      if (nextIndex < playlist.length) {
        await playSongInternal(
          playlist[nextIndex],
          nextIndex,
          playlist,
          "playlist",
        );
      } else if (
        repeatMode === true ||
        repeatMode === "all" ||
        repeatMode === "playlist"
      ) {
        await playSongInternal(playlist[0], 0, playlist, "playlist");
      } else {
        setPlaying(false);
      }

      return;
    }

    // Queue playback consumes the next queued song in order.
    if (source === "queue" || activeQueueRef.current) {
      const originalQueue = Array.isArray(queueRef.current)
        ? queueRef.current
        : [];

      const queuedSongs = validSongs(originalQueue);

      if (queuedSongs.length > 0) {
        const nextQueuedSong = queuedSongs[0];
        const nextQueuedId = getTrackId(nextQueuedSong);

        const removeIndex = originalQueue.findIndex(
          (song) => getTrackId(song) === nextQueuedId,
        );

        const remainingQueue =
          removeIndex >= 0
            ? originalQueue.filter((_, index) => index !== removeIndex)
            : originalQueue;

        queueRef.current = remainingQueue;
        setQueueState(remainingQueue);

        const library = validSongs(librarySongsRef.current);
        const libraryIndex = library.findIndex(
          (song) => getTrackId(song) === nextQueuedId,
        );

        await playSongInternal(
          nextQueuedSong,
          libraryIndex >= 0 ? libraryIndex : 0,
          library.length ? library : [nextQueuedSong],
          "queue",
        );

        return;
      }

      activeQueueRef.current = false;
      playbackSourceRef.current = "library";
    }

    // Individual-song playback chooses another song from the full library.
    const library = validSongs(librarySongsRef.current);

    if (!library.length) {
      console.warn(
        "The full song library is empty. Check setLibrarySongs().",
      );
      setPlaying(false);
      return;
    }

    const candidates =
      library.length > 1
        ? library.filter((song) => getTrackId(song) !== currentSongId)
        : library;

    if (!candidates.length) {
      setPlaying(false);
      return;
    }

    const selected =
      candidates[Math.floor(Math.random() * candidates.length)];

    const selectedIndex = library.findIndex(
      (song) => getTrackId(song) === getTrackId(selected),
    );

    await playSongInternal(
      selected,
      selectedIndex,
      library,
      "library",
    );
  };

  audio.addEventListener("timeupdate", handleTimeUpdate);
  audio.addEventListener("loadedmetadata", handleLoadedMetadata);
  audio.addEventListener("durationchange", updateDuration);
  audio.addEventListener("play", handlePlay);
  audio.addEventListener("pause", handlePause);
  audio.addEventListener("seeking", handleSeeking);
  audio.addEventListener("seeked", handleSeeked);
  audio.addEventListener("ended", handleEnded);

  return () => {
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    audio.removeEventListener("durationchange", updateDuration);
    audio.removeEventListener("play", handlePlay);
    audio.removeEventListener("pause", handlePause);
    audio.removeEventListener("seeking", handleSeeking);
    audio.removeEventListener("seeked", handleSeeked);
    audio.removeEventListener("ended", handleEnded);
  };
}, [
  accumulateListeningTime,
  saveListeningProgress,
  finishListeningSession,
  createListeningSession,
  playSongInternal,
  cancelSleepTimer,
  setQueueState,
]);

  // =====================================================
  // MOUNT / UNMOUNT
  // =====================================================

useEffect(() => {
  mountedRef.current = true;

  return () => {
    mountedRef.current = false;

    clearSleepTimerInterval();

    const audio = audioRef.current;
    const historyId = listeningSessionRef.current;

    // Capture final progress before resetting the playback trackers.
    const listenedSeconds = Math.max(
      0,
      Math.floor(Number(listenedSecondsRef.current) || 0),
    );

    const position = Math.max(
      0,
      Number(audio?.currentTime) || 0,
    );

    const audioDuration = Number(audio?.duration);

    const duration =
      Number.isFinite(audioDuration) && audioDuration > 0
        ? audioDuration
        : Math.max(0, Number(durationRef.current) || 0);

    if (audio) {
      audio.pause();
    }

    resetPlaybackTrackers();

    // Save the final listening progress without blocking unmount.
    if (historyId) {
      void updateListening(historyId, {
        listenedSeconds,
        completed: false,
        position,
        duration,
      }).catch((error) => {
        console.error("Cleanup listening update error:", error);
      });
    }
  };
}, [clearSleepTimerInterval, resetPlaybackTrackers]);

  // =====================================================
  // CONTEXT VALUES
  // =====================================================

  const contextValue = useMemo(
    () => ({
      songs,
      setSongs,
      setLibrarySongs, // Added

      currentSong,
      currentIndex,

      queue,
      setQueue,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,

      playing,
      duration,

      playSong,
      togglePlay,
      nextSong,
      previousSong,
      seekSong,

      volume,
      muted,
      changeVolume,
      toggleMute,

      shuffle,
      repeat,
      setShuffle,
      setRepeat,

      audioRef,

      sleepTimer,
      sleepTimerActive: sleepTimer !== null,
      sleepTimerDisplay,
      startSleepTimer,
      cancelSleepTimer,
    }),
    [
      songs,
      setSongs,
      setLibrarySongs, // Added
      currentSong,
      currentIndex,
      queue,
      setQueue,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      playing,
      duration,
      playSong,
      togglePlay,
      nextSong,
      previousSong,
      seekSong,
      volume,
      muted,
      changeVolume,
      toggleMute,
      shuffle,
      repeat,
      setShuffle,
      setRepeat,
      sleepTimer,
      sleepTimerDisplay,
      startSleepTimer,
      cancelSleepTimer,
    ],
  );

  const progressValue = useMemo(
    () => ({
      currentTime,
      duration,
    }),
    [currentTime, duration],
  );

  return (
    <PlayerContext.Provider value={contextValue}>
      <PlaybackProgressContext.Provider value={progressValue}>
        {children}

        {loginPromptOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
              style={{
                background: "rgba(0,0,0,0.72)",
              }}
              onClick={() => setLoginPromptOpen(false)}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="guest-login-title"
                className="relative my-auto w-full max-w-md rounded-[2rem] border p-6 sm:p-8"
                style={{
                  background: "var(--theme-background, #252933)",
                  color: "var(--theme-text, #f5f5f7)",
                  borderColor: "var(--theme-border, rgba(255,255,255,0.05))",
                  boxShadow: `
            18px 18px 40px var(--theme-shadowDark, #151820),
            -12px -12px 35px var(--theme-shadowLight, #343a48)
          `,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* Close button */}
                <button
                  type="button"
                  aria-label="Close login popup"
                  onClick={() => setLoginPromptOpen(false)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--theme-background, #252933)",
                    color: "var(--theme-textMuted, #a0a7b5)",
                    boxShadow: `
              5px 5px 10px var(--theme-shadowDark, #151820),
              -4px -4px 10px var(--theme-shadowLight, #343a48)
            `,
                  }}
                >
                  <X size={19} />
                </button>

                {/* Raised music icon */}
                <div className="flex justify-center pt-3">
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-[2rem]"
                    style={{
                      background: "var(--theme-background, #252933)",
                      boxShadow: `
                8px 8px 18px var(--theme-shadowDark, #151820),
                -7px -7px 18px var(--theme-shadowLight, #343a48),
                inset 1px 1px 1px var(--theme-border, rgba(255,255,255,0.05))
              `,
                      color: "var(--theme-primary, #8c7cf7)",
                    }}
                  >
                    <Music2 size={42} strokeWidth={1.8} />
                  </div>
                </div>

                {/* Heading */}
                <div className="mt-7 text-center">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.35em]"
                    style={{ color: "var(--theme-secondary, #2bd4c4)" }}
                  >
                    LYRICS WAYYY
                  </p>

                  <h2
                    id="guest-login-title"
                    className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
                  >
                    Your music awaits
                  </h2>

                  <p
                    className="mx-auto mt-3 max-w-sm text-sm leading-6 sm:text-base"
                    style={{ color: "var(--theme-textMuted, #a0a7b5)" }}
                  >
                    Sign in to unlock your music experience, play your favorite
                    songs, and create your own playlists.
                  </p>
                </div>

                {/* Neumorphic Sign In button */}
                <div className="mt-8 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPromptOpen(false);
                      window.location.assign("/signin");
                    }}
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: "var(--theme-background, #252933)",
                      color: "var(--theme-primary, #8c7cf7)",
                      boxShadow: `
      7px 7px 15px var(--theme-shadowDark, #151820),
      -6px -6px 15px var(--theme-shadowLight, #343a48)
    `,
                    }}
                  >
                    <LogIn size={19} />
                    Sign In
                  </button>

                  {/* Neumorphic Create Account button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPromptOpen(false);
                      window.location.assign("/signup");
                    }}
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: "var(--theme-background, #252933)",
                      color: "var(--theme-secondary, #2bd4c4)",
                      borderColor:
                        "var(--theme-border, rgba(255,255,255,0.05))",
                      boxShadow: `
      7px 7px 15px var(--theme-shadowDark, #151820),
      -6px -6px 15px var(--theme-shadowLight, #343a48)
    `,
                    }}
                  >
                    <UserPlus size={19} />
                    Create Account
                  </button>
                </div>

                {/* Inset divider */}
                <div
                  className="my-6 h-px w-full"
                  style={{
                    background: "var(--theme-border, rgba(255,255,255,0.08))",
                  }}
                />

                {/* Inset Maybe Later button */}
                <button
                  type="button"
                  onClick={() => setLoginPromptOpen(false)}
                  className="flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "var(--theme-background, #252933)",
                    color: "var(--theme-textMuted, #a0a7b5)",
                    boxShadow: `
              inset 4px 4px 9px var(--theme-shadowDark, #151820),
              inset -4px -4px 9px var(--theme-shadowLight, #343a48)
            `,
                  }}
                >
                  Maybe Later
                </button>

                <p
                  className="mt-5 text-center text-xs leading-5"
                  style={{ color: "var(--theme-textMuted, #a0a7b5)" }}
                >
                  Made for music lovers. 🎵
                </p>
              </section>
            </div>,
            document.body,
          )}
      </PlaybackProgressContext.Provider>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }

  return context;
};

// Use this hook only in components that display playback progress/time.
export const usePlaybackProgress = () => {
  const context = useContext(PlaybackProgressContext);

  if (!context) {
    throw new Error("usePlaybackProgress must be used inside PlayerProvider");
  }

  return context;
};
