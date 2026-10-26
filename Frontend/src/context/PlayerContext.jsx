import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { useAuth } from "../AuthContext";
import { BASE_URL } from "../config/api";
import {
  startListening,
  updateListening,
} from "../services/profileService";

const PlayerContext = createContext(null);
const PlaybackProgressContext = createContext(null);

const QUEUE_STORAGE_KEY = "joy_music_queue";
const PLAYER_STATE_STORAGE_KEY = "joy_music_player_state";

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

  const song =
    saved.song &&
    typeof saved.song === "object" &&
    saved.song._id
      ? saved.song
      : null;

  if (!song) return null;

  return {
    song,
    index: Number.isInteger(saved.index)
      ? saved.index
      : -1,
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
      ? parsed.filter((song) => song && song._id)
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
    localStorage.setItem(
      keys.playerStateKey,
      JSON.stringify(state)
    );
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
      JSON.stringify(
        Array.isArray(queue) ? queue : []
      )
    );
  } catch (error) {
    console.warn("Failed to save playback queue:", error);
  }
};

export const PlayerProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const userId =
    isAuthenticated && user?._id
      ? String(user._id)
      : null;

  // =====================================================
  // AUDIO
  // =====================================================

  const audioRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
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
  const songsRef = useRef([]);
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
      const next =
        typeof value === "function"
          ? value(previous)
          : value;

      const safeSongs = Array.isArray(next) ? next : [];

      songsRef.current = safeSongs;

      return safeSongs;
    });
  }, []);

  const setCurrentSong = useCallback((value) => {
    setCurrentSongState((previous) => {
      const next =
        typeof value === "function"
          ? value(previous)
          : value;

      currentSongRef.current = next || null;

      return next || null;
    });
  }, []);

  const setCurrentIndex = useCallback((value) => {
    setCurrentIndexState((previous) => {
      const next =
        typeof value === "function"
          ? value(previous)
          : value;

      currentIndexRef.current = Number.isInteger(next)
        ? next
        : -1;

      return currentIndexRef.current;
    });
  }, []);

  const setShuffle = useCallback((value) => {
    setShuffleState((previous) => {
      const next =
        typeof value === "function"
          ? value(previous)
          : value;

      shuffleRef.current = Boolean(next);

      return shuffleRef.current;
    });
  }, []);

  const setRepeat = useCallback((value) => {
    setRepeatState((previous) => {
      const next =
        typeof value === "function"
          ? value(previous)
          : value;

      repeatRef.current = Boolean(next);

      return repeatRef.current;
    });
  }, []);

  const setQueue = useCallback((value) => {
    setQueueState((previous) => {
      const next =
        typeof value === "function"
          ? value(previous)
          : value;

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
      const list = Array.isArray(previous)
        ? previous
        : [];

      const alreadyExists = list.some(
        (item) =>
          String(item?._id) === String(song._id)
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
      const list = (
        Array.isArray(previous) ? previous : []
      ).filter(
        (item) =>
          String(item?._id) !== String(song._id)
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
        (song) =>
          String(song?._id) !== String(songId)
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

    userStateReadyRef.current = false;
    loadedUserIdRef.current = null;

    resetActivePlayer();

    activeUserIdRef.current = userId;

    if (!userId) {
      // Logged out or no authenticated user:
      // keep the player empty.
      userStateReadyRef.current = true;
      return undefined;
    }

    const savedState = readUserPlayerState(userId);
    const savedQueue = readUserQueue(userId);

    savedPlayerStateRef.current = savedState;

    setQueueState(savedQueue);
    queueRef.current = savedQueue;

    if (savedState?.song?._id) {
      const restoredSong = savedState.song;

      currentSongRef.current = restoredSong;
      currentIndexRef.current = savedState.index;

      songsRef.current = [restoredSong];

      setCurrentSongState(restoredSong);
      setCurrentIndexState(savedState.index);
      setSongsState([restoredSong]);

      setCurrentTime(savedState.position);
      setVolume(savedState.volume);
      setMuted(savedState.muted);
      setShuffleState(savedState.shuffle);
      setRepeatState(savedState.repeat);

      volumeRef.current = savedState.volume;
      mutedRef.current = savedState.muted;
      shuffleRef.current = savedState.shuffle;
      repeatRef.current = savedState.repeat;

      restoreReadyRef.current = false;
    } else {
      // This user has never saved a selected song.
      // Do not display a recommendation or another user's song.
      currentSongRef.current = null;
      currentIndexRef.current = -1;
      songsRef.current = [];
      queueRef.current = savedQueue;

      setCurrentSongState(null);
      setCurrentIndexState(-1);
      setSongsState([]);
      setCurrentTime(0);

      restoreReadyRef.current = true;
    }

    loadedUserIdRef.current = userId;
    userStateReadyRef.current = true;

    return () => {
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

      if (
        !audio ||
        !listeningSessionRef.current ||
        seekingRef.current
      ) {
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
      const previousPosition =
        previousPlaybackPositionRef.current;

      lastPlaybackTickRef.current = now;
      previousPlaybackPositionRef.current = position;

      if (
        previousTick === null ||
        previousPosition === null
      ) {
        return;
      }

      const wallDelta = (now - previousTick) / 1000;
      const playbackDelta = position - previousPosition;

      if (
        wallDelta <= 0 ||
        wallDelta > MAX_TICK_INTERVAL ||
        playbackDelta <= 0 ||
        Math.abs(playbackDelta - wallDelta) >
          POSITION_TOLERANCE
      ) {
        return;
      }

      listenedSecondsRef.current += Math.min(
        playbackDelta,
        wallDelta + 0.1
      );
    },
    [resetPlaybackTrackers]
  );

  const mergeProgressTasks = useCallback(
    (previous, next) => {
      if (
        !previous ||
        previous.historyId !== next.historyId
      ) {
        return {
          historyId: next.historyId,
          payload: { ...next.payload },
        };
      }

      return {
        historyId: next.historyId,
        payload: {
          listenedSeconds: Math.max(
            Number(previous.payload?.listenedSeconds) || 0,
            Number(next.payload?.listenedSeconds) || 0
          ),
          position: next.payload.position,
          duration: next.payload.duration,
          completed:
            previous.payload?.completed === true ||
            next.payload?.completed === true,
        },
      };
    },
    []
  );

  const saveListeningProgress = useCallback(
    async (completed = false, force = false) => {
      const historyId = listeningSessionRef.current;

      if (!historyId) return;

      const audio = audioRef.current;

      const listenedSeconds = Math.max(
        0,
        Math.floor(listenedSecondsRef.current)
      );

      const position = Number(audio?.currentTime);
      const actualDuration = Number(audio?.duration);

      const payload = {
        listenedSeconds,
        position:
          Number.isFinite(position) && position >= 0
            ? position
            : 0,
        duration:
          Number.isFinite(actualDuration) &&
          actualDuration > 0
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
          task
        );
        return;
      }

      progressUpdateInFlightRef.current = true;

      let nextTask = task;

      try {
        while (nextTask) {
          const currentTask = nextTask;

          try {
            await updateListening(
              currentTask.historyId,
              currentTask.payload
            );

            if (
              listeningSessionRef.current ===
              currentTask.historyId
            ) {
              lastListeningUpdateRef.current = Math.max(
                lastListeningUpdateRef.current,
                currentTask.payload.listenedSeconds
              );
            }
          } catch (error) {
            console.error(
              "Listening history update failed:",
              error
            );

            pendingProgressRef.current = mergeProgressTasks(
              currentTask,
              pendingProgressRef.current
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
    [mergeProgressTasks]
  );

  const finishListeningSession = useCallback(
    async (completed = false) => {
      const historyId = listeningSessionRef.current;

      if (!historyId) return;

      accumulateListeningTime(true);
      resetPlaybackTrackers();

      await saveListeningProgress(completed, true);

      if (listeningSessionRef.current !== historyId) {
        return;
      }

      listeningSessionRef.current = null;
      sessionSongIdRef.current = null;

      listenedSecondsRef.current = 0;
      lastListeningUpdateRef.current = 0;

      if (
        pendingProgressRef.current?.historyId === historyId
      ) {
        pendingProgressRef.current = null;
      }

      sessionGenerationRef.current += 1;
    },
    [
      accumulateListeningTime,
      resetPlaybackTrackers,
      saveListeningProgress,
    ]
  );

  const createListeningSession = useCallback(
    async (song) => {
      if (!song?._id || !userId) return;

      const songId = String(song._id);

      if (
        listeningSessionRef.current &&
        sessionSongIdRef.current === songId
      ) {
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
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      if (!token) return;

      const requestedUserId = userId;
      const generation = sessionGenerationRef.current;

      startingListeningRef.current = true;
      sessionStartSongIdRef.current = songId;

      const startPromise = (async () => {
        try {
          const response = await startListening(songId);

          const historyId =
            response?.history?._id ||
            response?.historyId;

          const userChanged =
            activeUserIdRef.current !== requestedUserId;

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
                  error
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
    [userId, resetPlaybackTrackers]
  );

  // =====================================================
  // AUDIO URL
  // =====================================================

 
const getAudioUrl = useCallback((audioFile) => {
  if (!audioFile) return "";

  const value = String(audioFile).trim();
  if (!value) return "";

  // Keep complete URLs unchanged.
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Normalize Windows-style paths.
  let cleanPath = value.replace(/\\/g, "/");

  // Remove leading slashes.
  cleanPath = cleanPath.replace(/^\/+/, "");

  // Keep the path starting from uploads/.
  const uploadsIndex = cleanPath.toLowerCase().indexOf("uploads/");

  if (uploadsIndex !== -1) {
    cleanPath = cleanPath.substring(uploadsIndex);
  }

  // Prevent duplicated uploads/uploads/ paths.
  cleanPath = cleanPath.replace(/^(?:uploads\/)+/i, "uploads/");

  const baseUrl = String(BASE_URL || "").replace(/\/+$/, "");

  if (!baseUrl) {
    console.error("BASE_URL is missing in config/api.");
    return "";
  }

  return `${baseUrl}/${cleanPath}`;
}, []);


  // =====================================================
  // RESTORE THE SELECTED USER'S SAVED POSITION
  //
  // Restores the song and position but does not autoplay.
  // =====================================================

  useEffect(() => {
    if (!userId || !userStateReadyRef.current) return;

    if (activeUserIdRef.current !== userId) return;

    if (loadedUserIdRef.current !== userId) return;

    const saved = savedPlayerStateRef.current;
    const song = currentSongRef.current;
    const audio = audioRef.current;

    if (!song?._id || !audio) {
      restoreReadyRef.current = true;
      return;
    }

    const url = getAudioUrl(song.audioFile);

    if (!url) {
      restoreReadyRef.current = true;
      return;
    }

    let cancelled = false;

    const restorePosition = () => {
      if (cancelled) return;

      if (activeUserIdRef.current !== userId) return;

      const target = Math.max(
        0,
        Number(saved?.position) || 0
      );

      try {
        if (
          Number.isFinite(audio.duration) &&
          audio.duration > 0
        ) {
          audio.currentTime = Math.min(
            target,
            Math.max(0, audio.duration - 0.25)
          );
        } else {
          audio.currentTime = target;
        }
      } catch (error) {
        console.warn(
          "Could not restore playback position:",
          error
        );
      }

      setCurrentTime(Number(audio.currentTime) || target);

      restoreReadyRef.current = true;
    };

    audio.pause();

    setPlaying(false);

    if (audio.src !== url) {
      audio.src = url;
    }

    if (audio.readyState >= 1) {
      restorePosition();
    } else {
      audio.addEventListener(
        "loadedmetadata",
        restorePosition,
        { once: true }
      );
    }

    return () => {
      cancelled = true;

      audio.removeEventListener(
        "loadedmetadata",
        restorePosition
      );
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

    // A user with no selected song should not acquire
    // a random/default song in saved state.
    if (!currentSong?._id) return;

    const audioPosition = Number(
      audioRef.current?.currentTime
    );

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
      playlist = songsRef.current
    ) => {
      if (!song?._id || !userId) return;

      if (
        !userStateReadyRef.current ||
        activeUserIdRef.current !== userId ||
        loadedUserIdRef.current !== userId
      ) {
        return;
      }

      const audio = audioRef.current;
      const songId = String(song._id);

      const sameSong =
        String(currentSongRef.current?._id) === songId;

      const epoch = ++playbackEpochRef.current;

      try {
        if (!sameSong) {
          accumulateListeningTime(true);

          audio.pause();

          sessionGenerationRef.current += 1;

          await finishListeningSession(false);

          if (
            !mountedRef.current ||
            epoch !== playbackEpochRef.current ||
            activeUserIdRef.current !== userId
          ) {
            return;
          }
        }

        restoreReadyRef.current = true;
        savedPlayerStateRef.current = null;

        const safePlaylist = Array.isArray(playlist)
          ? playlist
          : [];

        songsRef.current = safePlaylist;
        setSongsState(safePlaylist);

        currentSongRef.current = song;
        setCurrentSongState(song);

        currentIndexRef.current = index;
        setCurrentIndexState(index);

        seekingRef.current = false;

        setCurrentTime(0);
        durationRef.current = 0;
        setDuration(0);

        resetPlaybackTrackers();

        const url = getAudioUrl(song.audioFile);

        if (!url) {
          console.error("Audio file missing:", song);
          setPlaying(false);
          return;
        }

        if (audio.src !== url) {
          audio.src = url;
          audio.currentTime = 0;
        } else if (!sameSong) {
          audio.currentTime = 0;
        }

        audio.volume = mutedRef.current
          ? 0
          : volumeRef.current;

        await audio.play();

        if (
          !mountedRef.current ||
          epoch !== playbackEpochRef.current ||
          activeUserIdRef.current !== userId
        ) {
          audio.pause();
          return;
        }

        setPlaying(true);

        if (
          !listeningSessionRef.current ||
          sessionSongIdRef.current !== songId
        ) {
          void createListeningSession(song);
        }
     
} catch (error) {
  // Ignore expected interruptions when playback is paused
  // or a new song replaces the current one.
  if (error?.name === "AbortError") {
    return;
  }

  console.error("Play song error:", error);
  setPlaying(false);
}


    },
    [
      userId,
      accumulateListeningTime,
      finishListeningSession,
      resetPlaybackTrackers,
      getAudioUrl,
      createListeningSession,
    ]
  );

  const playSong = useCallback(
    (song, index = 0, playlist = songsRef.current) => {
      return playSongInternal(song, index, playlist);
    },
    [playSongInternal]
  );

  // =====================================================
  // PLAY / PAUSE
  // =====================================================

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;

    if (!currentSongRef.current || !userId) return;

    if (activeUserIdRef.current !== userId) return;

    try {
      if (!audio.paused) {
        accumulateListeningTime(true);

        audio.pause();

        setPlaying(false);

        void saveListeningProgress(false, true);

        return;
      }

      await audio.play();

      setPlaying(true);

      if (
        !listeningSessionRef.current ||
        sessionSongIdRef.current !==
          String(currentSongRef.current?._id)
      ) {
        void createListeningSession(currentSongRef.current);
      }
    } catch (error) {
      console.error("Toggle play error:", error);
      setPlaying(false);
    }
  }, [
    userId,
    accumulateListeningTime,
    saveListeningProgress,
    createListeningSession,
  ]);

  // =====================================================
  // NEXT SONG
  // =====================================================

  const nextSong = useCallback(async () => {
    if (!userId || activeUserIdRef.current !== userId) {
      return;
    }

    const currentQueue = queueRef.current;

    if (currentQueue.length) {
      const nextQueuedSong = currentQueue[0];
      const remaining = currentQueue.slice(1);

      queueRef.current = remaining;
      setQueueState(remaining);

      await playSongInternal(
        nextQueuedSong,
        0,
        songsRef.current
      );

      return;
    }

    const list = songsRef.current;

    if (!list.length) return;

    let index;

    if (shuffleRef.current && list.length > 1) {
      do {
        index = Math.floor(Math.random() * list.length);
      } while (index === currentIndexRef.current);
    } else {
      index =
        list.length === 1
          ? 0
          : (currentIndexRef.current + 1) % list.length;
    }

    if (list[index]) {
      await playSongInternal(list[index], index, list);
    }
  }, [userId, playSongInternal]);

  // =====================================================
  // PREVIOUS SONG
  // =====================================================

  const previousSong = useCallback(async () => {
    if (!userId || activeUserIdRef.current !== userId) {
      return;
    }

    const list = songsRef.current;

    if (!list.length) return;

    const index =
      currentIndexRef.current <= 0
        ? list.length - 1
        : currentIndexRef.current - 1;

    if (list[index]) {
      await playSongInternal(list[index], index, list);
    }
  }, [userId, playSongInternal]);

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
        : durationRef.current || nextTime;

    const safeTime = Math.max(
      0,
      Math.min(nextTime, maxTime)
    );

    seekingRef.current = true;

    lastPlaybackTickRef.current = null;
    previousPlaybackPositionRef.current = null;

    audio.currentTime = safeTime;

    setCurrentTime(safeTime);
  }, []);

  // =====================================================
  // VOLUME
  // =====================================================

  const changeVolume = useCallback((value) => {
    const safeVolume = Math.max(
      0,
      Math.min(1, Number(value))
    );

    if (!Number.isFinite(safeVolume)) return;

    volumeRef.current = safeVolume;
    mutedRef.current = safeVolume === 0;

    setVolume(safeVolume);
    setMuted(safeVolume === 0);

    if (audioRef.current) {
      audioRef.current.volume = safeVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (mutedRef.current) {
      const restored =
        volumeRef.current > 0
          ? volumeRef.current
          : 1;

      volumeRef.current = restored;
      mutedRef.current = false;

      if (audioRef.current) {
        audioRef.current.volume = restored;
      }

      setVolume(restored);
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

      const seconds = Number(minutes) * 60;

      if (!Number.isFinite(seconds) || seconds <= 0) {
        return;
      }

      sleepTimerModeRef.current = "timer";

      sleepTimerDeadlineRef.current =
        Date.now() + seconds * 1000;

      setSleepTimer(Math.ceil(seconds));
    },
    [clearSleepTimerInterval]
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

      if (!deadline) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      if (remaining <= 0) {
        clearSleepTimerInterval();

        sleepTimerDeadlineRef.current = null;
        sleepTimerModeRef.current = null;

        accumulateListeningTime(true);

        audioRef.current?.pause();

        setPlaying(false);

        void saveListeningProgress(false, true);

        setSleepTimer(null);

        return;
      }

      setSleepTimer(remaining);
    };

    updateCountdown();

    sleepTimerIntervalRef.current = setInterval(
      updateCountdown,
      1000
    );

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

    const mins = Math.floor(sleepTimer / 60);
    const secs = sleepTimer % 60;

    return `${mins}:${String(secs).padStart(2, "0")}`;
  }, [sleepTimer]);

  // =====================================================
  // AUDIO EVENTS
  // =====================================================

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return undefined;

    let lastUiTime = -1;

    const updateTime = (force = false) => {
      const nextTime = Number(audio.currentTime);

      if (!Number.isFinite(nextTime) || nextTime < 0) {
        return;
      }

      if (
        force ||
        lastUiTime < 0 ||
        Math.abs(nextTime - lastUiTime) >= 0.25
      ) {
        lastUiTime = nextTime;

        setCurrentTime((previous) =>
          Math.abs(previous - nextTime) >= 0.02
            ? nextTime
            : previous
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

    const loadedMetadata = () => {
      updateDuration();
      updateTime(true);
    };

    const handlePlay = () => {
      setPlaying(true);

      lastPlaybackTickRef.current = performance.now();

      previousPlaybackPositionRef.current =
        Number(audio.currentTime) || 0;
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

      previousPlaybackPositionRef.current =
        Number(audio.currentTime) || 0;

      lastPlaybackTickRef.current =
        !audio.paused && !audio.ended
          ? performance.now()
          : null;
    };

    const handleTimeUpdate = () => {
      updateTime();

      accumulateListeningTime();

      if (
        !listeningSessionRef.current ||
        audio.paused ||
        audio.ended
      ) {
        return;
      }

      const listened = Math.floor(
        listenedSecondsRef.current
      );

      if (
        listened - lastListeningUpdateRef.current >=
        PROGRESS_SAVE_INTERVAL
      ) {
        void saveListeningProgress(false);
      }
    };

    const handleEnded = async () => {
      accumulateListeningTime(true);

      await finishListeningSession(true);

      if (!mountedRef.current) return;

      if (sleepTimerModeRef.current === "end") {
        cancelSleepTimer();

        audio.pause();

        setPlaying(false);

        return;
      }

      if (repeatRef.current) {
        audio.currentTime = 0;

        try {
          await audio.play();

          setPlaying(true);

          void createListeningSession(
            currentSongRef.current
          );
        } catch (error) {
          console.error("Repeat play error:", error);
          setPlaying(false);
        }

        return;
      }

      const currentQueue = queueRef.current;

      if (currentQueue.length) {
        const nextQueuedSong = currentQueue[0];
        const remaining = currentQueue.slice(1);

        queueRef.current = remaining;
        setQueueState(remaining);

        await playSongInternal(
          nextQueuedSong,
          0,
          songsRef.current
        );

        return;
      }

      const list = songsRef.current;

      if (!list.length) {
        setPlaying(false);
        return;
      }

      let index;

      if (shuffleRef.current && list.length > 1) {
        do {
          index = Math.floor(Math.random() * list.length);
        } while (index === currentIndexRef.current);
      } else {
        index =
          list.length === 1
            ? 0
            : (currentIndexRef.current + 1) % list.length;
      }

      if (!list[index]) {
        setPlaying(false);
        return;
      }

      await playSongInternal(list[index], index, list);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", loadedMetadata);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("seeking", handleSeeking);
    audio.addEventListener("seeked", handleSeeked);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", loadedMetadata);
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

      if (audio) {
        audio.pause();
      }

      resetPlaybackTrackers();

      const historyId = listeningSessionRef.current;

      if (historyId) {
        const listenedSeconds = Math.max(
          0,
          Math.floor(listenedSecondsRef.current)
        );

        updateListening(historyId, {
          listenedSeconds,
          completed: false,
          position: Math.max(
            0,
            Number(audio?.currentTime) || 0
          ),
          duration:
            Number.isFinite(audio?.duration) &&
            audio.duration > 0
              ? audio.duration
              : Math.max(0, durationRef.current || 0),
        }).catch((error) => {
          console.error(
            "Cleanup listening update error:",
            error
          );
        });
      }
    };
  }, [
    clearSleepTimerInterval,
    resetPlaybackTrackers,
  ]);

  // =====================================================
  // CONTEXT VALUES
  // =====================================================

  const contextValue = useMemo(
    () => ({
      songs,
      setSongs,

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
    ]
  );

  const progressValue = useMemo(
    () => ({
      currentTime,
      duration,
    }),
    [currentTime, duration]
  );

  return (
    <PlayerContext.Provider value={contextValue}>
      <PlaybackProgressContext.Provider value={progressValue}>
        {children}
      </PlaybackProgressContext.Provider>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer must be used inside PlayerProvider"
    );
  }

  return context;
};

// Use this hook only in components that display playback progress/time.
export const usePlaybackProgress = () => {
  const context = useContext(PlaybackProgressContext);

  if (!context) {
    throw new Error(
      "usePlaybackProgress must be used inside PlayerProvider"
    );
  }

  return context;
};