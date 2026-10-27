
  import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";

  import {
    useNavigate,
    useParams,
  } from "react-router-dom";

  import {
    ArrowLeft,
    Play,
    Pause,
    Music2,
    Clock3,
    Disc3,
    Trash2,
    Shuffle,
    RefreshCw,
    AlertCircle,
    ListMusic,
    MoreHorizontal,
    Volume2,
    CheckCircle2,
  } from "lucide-react";

  import { motion } from "framer-motion";

  import { getPlaylistById, removeSongFromPlaylist } from "../services/playlistService";

  import { usePlayer } from "../context/PlayerContext";

  import { BASE_URL } from "../config/api";

  // =====================================================
  // HELPERS
  // =====================================================

  const API_BASE = String(BASE_URL || "").replace(/\/+$/, "");

  const getId = (value) => {
    if (!value) return "";

    if (typeof value === "object") {
      return String(value._id || value.id || "");
    }

    return String(value);
  };

  const getSongArtist = (song) => {
    if (!song) return "Unknown Artist";

    if (typeof song.artist === "string") {
      return song.artist;
    }

    return (
      song.artist?.name ||
      song.artist?.artistName ||
      song.artistName ||
      "Unknown Artist"
    );
  };

  const getMediaUrl = (value) => {
    if (!value) return "";

    const path = String(value).trim();

    if (!path) return "";

    if (/^(https?:)?\/\//i.test(path)) {
      return path.startsWith("//")
        ? `${window.location.protocol}${path}`
        : path;
    }

    if (path.startsWith("data:") || path.startsWith("blob:")) {
      return path;
    }

    const cleanPath = path
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const uploadsIndex = cleanPath
      .toLowerCase()
      .indexOf("uploads/");

    const normalizedPath =
      uploadsIndex >= 0
        ? cleanPath.substring(uploadsIndex)
        : cleanPath;

    return `${API_BASE}/${normalizedPath}`;
  };

  const getSongCover = (song) => {
    if (!song) return "";

    return getMediaUrl(
      song.coverImage ||
        song.coverUrl ||
        song.thumbnail ||
        song.image ||
        song.album?.coverImage ||
        song.album?.image ||
        song.artist?.image ||
        ""
    );
  };

  const getPlaylistCover = (playlist) => {
    if (!playlist) return "";

    return getMediaUrl(
      playlist.coverImage ||
        playlist.coverUrl ||
        playlist.image ||
        ""
    );
  };

  const getSongDuration = (song) => {
    const raw = song?.duration;

    if (typeof raw === "number" && Number.isFinite(raw)) {
      const seconds =
        raw > 1000 ? Math.floor(raw / 1000) : Math.floor(raw);

      return seconds > 0 ? seconds : 0;
    }

    if (typeof raw === "string") {
      const value = raw.trim();

      if (value.includes(":")) {
        const parts = value.split(":").map(Number);

        if (
          parts.length === 2 &&
          parts.every(Number.isFinite)
        ) {
          return parts[0] * 60 + parts[1];
        }

        if (
          parts.length === 3 &&
          parts.every(Number.isFinite)
        ) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }

      const numeric = Number(value);

      if (Number.isFinite(numeric) && numeric > 0) {
        return Math.floor(numeric);
      }
    }

    return 0;
  };

  const formatDuration = (seconds) => {
    const safe = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const minutes = Math.floor(safe / 60);
    const remaining = safe % 60;

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  };

  const getSongsFromPlaylist = (playlist) => {
    if (!playlist || !Array.isArray(playlist.songs)) {
      return [];
    }

    return playlist.songs.filter(
      (song) => song && typeof song === "object"
    );
  };

  const extractPlaylist = (response) => {
    if (!response) return null;

    if (response.playlist) {
      return response.playlist;
    }

    if (response.data?.playlist) {
      return response.data.playlist;
    }

    if (response.data?._id) {
      return response.data;
    }

    if (response._id) {
      return response;
    }

    return null;
  };

  // =====================================================
  // PAGE
  // =====================================================

  const PlaylistDetails = () => {
    const { id } = useParams();

    const navigate = useNavigate();

    const {
      currentSong,
      playing,
      playSong,
      togglePlay,
      addToQueue,
    } = usePlayer();

    const [playlist, setPlaylist] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [removingSongId, setRemovingSongId] = useState("");

    const [notice, setNotice] = useState("");

    const [shuffleMode, setShuffleMode] = useState(false);

    // ===================================================
    // THEME
    // ===================================================

    const panelStyle = {
      background:
        "var(--theme-surface, #1b1f25)",
      border:
        "1px solid var(--theme-border, rgba(255,255,255,0.06))",
      boxShadow:
        "8px 8px 18px var(--theme-shadow-dark, #101318), -5px -5px 15px var(--theme-shadow-light, #292e36)",
    };

    const raisedStyle = {
      background:
        "var(--theme-surface, #1b1f25)",
      boxShadow:
        "5px 5px 10px var(--theme-shadow-dark, #101318), -4px -4px 10px var(--theme-shadow-light, #292e36)",
    };

    const insetStyle = {
      background:
        "var(--theme-background, #121418)",
      boxShadow:
        "inset 4px 4px 9px var(--theme-shadow-dark, #101318), inset -4px -4px 9px var(--theme-shadow-light, #292e36)",
    };

    const primaryColor =
      "var(--theme-primary, #8c7cf7)";

    const secondaryColor =
      "var(--theme-secondary, #2bd4c4)";

    const textColor =
      "var(--theme-text, #f1f2f6)";

    const mutedColor =
      "var(--theme-textMuted, #969eac)";

    // ===================================================
    // LOAD PLAYLIST
    // ===================================================

    const loadPlaylist = useCallback(
      async (signal) => {
        if (!id) {
          setError("Playlist ID is missing.");
          setPlaylist(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
          const response = await getPlaylistById(id);

          if (signal?.aborted) return;

          const result = extractPlaylist(response);

          if (!result) {
            throw new Error(
              response?.message ||
                "The playlist could not be found."
            );
          }

          setPlaylist(result);
        } catch (err) {
          if (signal?.aborted) return;

          console.error(
            "Load playlist details error:",
            err
          );

          const status = err?.response?.status;

          if (status === 401) {
            setError(
              "Your session has expired. Please sign in again."
            );
          } else if (status === 403) {
            setError(
              "You do not have permission to access this playlist."
            );
          } else if (status === 404) {
            setError(
              "This playlist could not be found."
            );
          } else {
            setError(
              err?.response?.data?.message ||
                err?.message ||
                "Unable to load this playlist. Please try again."
            );
          }

          setPlaylist(null);
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
          }
        }
      },
      [id]
    );

    useEffect(() => {
      const controller = new AbortController();

      loadPlaylist(controller.signal);

      return () => {
        controller.abort();
      };
    }, [loadPlaylist]);

    // ===================================================
    // SONGS
    // ===================================================

    const playlistSongs = useMemo(
      () => getSongsFromPlaylist(playlist),
      [playlist]
    );

    const totalDuration = useMemo(() => {
      return playlistSongs.reduce(
        (total, song) => total + getSongDuration(song),
        0
      );
    }, [playlistSongs]);

    const currentSongId = getId(currentSong);

    const isCurrentPlaylistSong = playlistSongs.some(
      (song) => getId(song) === currentSongId
    );

    const playlistCover = getPlaylistCover(playlist);

    // ===================================================
    // PLAY A SONG
    // ===================================================


  const handlePlaySong = useCallback(
    async (song, index) => {
      if (!song?._id) {
        setNotice("This song is missing its ID and cannot be played.");
        return;
      }

      if (!Array.isArray(playlistSongs) || playlistSongs.length === 0) {
        setNotice("This playlist has no songs to play.");
        return;
      }

      const actualIndex = playlistSongs.findIndex(
        (item) => String(item?._id) === String(song._id)
      );

      if (actualIndex === -1) {
        setNotice("This song is not in the selected playlist.");
        return;
      }

      try {
        setNotice("");

        await playSong(
          song,
          actualIndex,
          playlistSongs,
          "playlist"
        );
      } catch (err) {
        console.error("Playlist playback error:", err);
        setNotice("Unable to play this song. Check its audio file.");
      }
    },
    [playSong, playlistSongs]
  );



    // ===================================================
    // PLAY ALL
    // ===================================================

    const handlePlayAll = useCallback(() => {
      if (!playlistSongs.length) {
        setNotice("This playlist has no songs yet.");
        return;
      }

      setShuffleMode(false);

      void handlePlaySong(playlistSongs[0], 0);
    }, [playlistSongs, handlePlaySong]);

    // ===================================================
    // SHUFFLE
    // ===================================================

    const handleShuffle = useCallback(() => {
      if (!playlistSongs.length) {
        setNotice("Add songs before shuffling.");
        return;
      }

      const randomIndex = Math.floor(
        Math.random() * playlistSongs.length
      );

      setShuffleMode(true);

      void handlePlaySong(
        playlistSongs[randomIndex],
        randomIndex
      );
    }, [playlistSongs, handlePlaySong]);

    // ===================================================
    // PLAY / PAUSE PLAYLIST
    // ===================================================

    const handleMainPlayback = () => {
      if (!playlistSongs.length) return;

      if (isCurrentPlaylistSong && currentSongId) {
        togglePlay();
        return;
      }

      handlePlayAll();
    };

    // ===================================================
    // ADD TO QUEUE
    // ===================================================

    const handleAddToQueue = (song) => {
      if (!song?._id) return;

      if (typeof addToQueue !== "function") {
        setNotice(
          "Queue functionality is not available."
        );
        return;
      }

      addToQueue(song);

      setNotice(
        `${song.title || "Song"} added to your queue.`
      );
    };

    // ===================================================
    // REMOVE SONG
    // ===================================================

    const handleRemoveSong = async (song) => {
      const songId = getId(song);

      if (!id || !songId || removingSongId) return;

      const confirmed = window.confirm(
        `Remove "${song.title || "this song"}" from this playlist?`
      );

      if (!confirmed) return;

      setRemovingSongId(songId);
      setNotice("");

      try {
        await removeSongFromPlaylist(id, songId);

        setPlaylist((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            songs: getSongsFromPlaylist(previous).filter(
              (item) => getId(item) !== songId
            ),
          };
        });

        setNotice("Song removed from playlist.");
      } catch (err) {
        console.error(
          "Remove playlist song error:",
          err
        );

        setNotice(
          err?.response?.data?.message ||
            "Unable to remove this song."
        );
      } finally {
        setRemovingSongId("");
      }
    };

    // ===================================================
    // LOADING STATE
    // ===================================================

    if (loading) {
      return (
        <main
          className="min-h-screen px-4 py-12 sm:px-6 lg:px-10"
          style={{ color: textColor }}
        >
          <div className="mx-auto max-w-7xl">
            <div
              className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl"
              style={panelStyle}
            >
              <div
                className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-transparent"
                style={{
                  borderTopColor: primaryColor,
                  borderRightColor: secondaryColor,
                }}
              />

              <p
                className="text-sm"
                style={{ color: mutedColor }}
              >
                Loading your playlist...
              </p>
            </div>
          </div>
        </main>
      );
    }

    // ===================================================
    // ERROR STATE
    // ===================================================

    if (error || !playlist) {
      return (
        <main
          className="min-h-screen px-4 py-12 sm:px-6 lg:px-10"
          style={{ color: textColor }}
        >
          <div className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={() => navigate("/playlists")}
              className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-80"
              style={raisedStyle}
            >
              <ArrowLeft size={17} />
              Back to My Playlists
            </button>

            <section
              className="flex flex-col items-center rounded-3xl px-6 py-14 text-center"
              style={panelStyle}
            >
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={insetStyle}
              >
                <AlertCircle
                  size={30}
                  style={{ color: primaryColor }}
                />
              </div>

              <h1 className="text-xl font-bold">
                Unable to Open Playlist
              </h1>

              <p
                className="mt-3 max-w-md text-sm leading-6"
                style={{ color: mutedColor }}
              >
                {error || "This playlist is unavailable."}
              </p>

              <button
                type="button"
                onClick={() => loadPlaylist()}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:brightness-110"
                style={{
                  background: primaryColor,
                  color: "#ffffff",
                }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </section>
          </div>
        </main>
      );
    }

    // ===================================================
    // MAIN PAGE
    // ===================================================

    return (
      <main
        className="min-h-screen px-3 py-6 sm:px-6 sm:py-10 lg:px-10 mt-20"
        style={{
          color: textColor,
          background: "transparent",
        }}
      >
        <div className="mx-auto max-w-7xl">

          {/* =========================================
              BACK NAVIGATION
          ========================================= */}

          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/playlists")}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={raisedStyle}
            >
              <ArrowLeft size={17} />
              My Playlists
            </button>

            <span
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
              style={insetStyle}
            >
              <ListMusic
                size={15}
                style={{ color: secondaryColor }}
              />

              YOUR MUSIC COLLECTION
            </span>
          </div>

          {/* =========================================
              PLAYLIST HERO
          ========================================= */}

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-[28px] p-5 sm:p-8 lg:p-10"
            style={panelStyle}
          >
            {/* Decorative accent */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-10 blur-3xl"
              style={{
                background: primaryColor,
              }}
            />

            <div className="relative grid items-center gap-8 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">

              {/* COVER */}

              <div
                className="mx-auto w-full max-w-[260px] sm:max-w-[280px]"
              >
                <div
                  className="relative aspect-square overflow-hidden rounded-[26px] p-3"
                  style={raisedStyle}
                >
                  <div
                    className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[19px]"
                    style={{
                      background:
                        "linear-gradient(145deg, var(--theme-surface, #252933), var(--theme-background, #121418))",
                      boxShadow:
                        "inset 4px 4px 12px var(--theme-shadow-dark, #101318), inset -4px -4px 12px var(--theme-shadow-light, #292e36)",
                    }}
                  >
                    {playlistCover ? (
                      <img
                        src={playlistCover}
                        alt={`${playlist.name || "Playlist"} cover`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : null}

                    <div
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <div
                        className="flex h-24 w-24 items-center justify-center rounded-full"
                        style={{
                          background:
                            "var(--theme-surface, #1b1f25)",
                          boxShadow:
                            "7px 7px 16px var(--theme-shadow-dark, #101318), -5px -5px 14px var(--theme-shadow-light, #292e36)",
                        }}
                      >
                        <Disc3
                          size={48}
                          strokeWidth={1.4}
                          style={{
                            color: primaryColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PLAYLIST INFORMATION */}

              <div className="min-w-0">

                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
                  style={{
                    ...insetStyle,
                    color: secondaryColor,
                  }}
                >
                  <Music2 size={14} />
                  My Playlist
                </div>

                <h1
                  className="break-words text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl"
                  style={{
                    color: textColor,
                    overflowWrap: "anywhere",
                  }}
                >
                  {playlist.name || "Untitled Playlist"}
                </h1>

                {playlist.description ? (
                  <p
                    className="mt-4 max-w-2xl whitespace-pre-wrap break-words text-sm leading-7 sm:text-base"
                    style={{ color: mutedColor }}
                  >
                    {playlist.description}
                  </p>
                ) : (
                  <p
                    className="mt-4 text-sm"
                    style={{ color: mutedColor }}
                  >
                    Your personal soundtrack, all in one place.
                  </p>
                )}

                {/* STATS */}

                <div className="mt-6 flex flex-wrap items-center gap-3">

                  <span
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                    style={insetStyle}
                  >
                    <Music2
                      size={16}
                      style={{ color: primaryColor }}
                    />

                    <strong>
                      {playlistSongs.length}
                    </strong>

                    <span style={{ color: mutedColor }}>
                      {playlistSongs.length === 1
                        ? "song"
                        : "songs"}
                    </span>
                  </span>

                  <span
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                    style={insetStyle}
                  >
                    <Clock3
                      size={16}
                      style={{ color: secondaryColor }}
                    />

                    <span style={{ color: mutedColor }}>
                      {totalDuration > 0
                        ? formatDuration(totalDuration)
                        : "Duration unavailable"}
                    </span>
                  </span>

                  {playlist.visibility ? (
                    <span
                      className="rounded-xl px-3 py-2 text-xs font-semibold capitalize"
                      style={insetStyle}
                    >
                      {playlist.visibility}
                    </span>
                  ) : null}
                </div>

                {/* ACTIONS */}

                <div className="mt-8 flex flex-wrap items-center gap-3">

                  <button
                    type="button"
                    onClick={handleMainPlayback}
                    disabled={!playlistSongs.length}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: primaryColor,
                      color: "#ffffff",
                      boxShadow:
                        "0 8px 24px color-mix(in srgb, var(--theme-primary, #8c7cf7) 24%, transparent)",
                    }}
                  >
                    {isCurrentPlaylistSong && playing ? (
                      <Pause size={19} fill="currentColor" />
                    ) : (
                      <Play size={19} fill="currentColor" />
                    )}

                    {isCurrentPlaylistSong && playing
                      ? "Pause Playlist"
                      : "Play Playlist"}
                  </button>

                  <button
                    type="button"
                    onClick={handleShuffle}
                    disabled={!playlistSongs.length}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                    style={raisedStyle}
                  >
                    <Shuffle
                      size={17}
                      style={{
                        color: secondaryColor,
                      }}
                    />

                    Shuffle
                  </button>

                </div>
              </div>
            </div>
          </motion.section>

          {/* =========================================
              STATUS MESSAGE
          ========================================= */}

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
              style={panelStyle}
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: secondaryColor }}
              />

              <span className="min-w-0 break-words">
                {notice}
              </span>

              <button
                type="button"
                onClick={() => setNotice("")}
                className="ml-auto rounded-lg px-2 py-1"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          ) : null}

          {/* =========================================
              SONG LIST
          ========================================= */}

          <section className="mt-9">

            {/* SECTION HEADER */}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Playlist Tracks
                </h2>

                <p
                  className="mt-1 text-sm"
                  style={{ color: mutedColor }}
                >
                  Select a song to start listening.
                </p>
              </div>

              <span
                className="rounded-xl px-4 py-2 text-xs font-semibold"
                style={raisedStyle}
              >
                {playlistSongs.length} tracks
              </span>
            </div>

            {/* EMPTY PLAYLIST */}

            {!playlistSongs.length ? (
              <div
                className="flex flex-col items-center rounded-3xl px-6 py-14 text-center sm:py-20"
                style={panelStyle}
              >
                <div
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
                  style={insetStyle}
                >
                  <Music2
                    size={36}
                    style={{ color: primaryColor }}
                  />
                </div>

                <h3 className="text-lg font-bold">
                  Your playlist is waiting
                </h3>

                <p
                  className="mt-3 max-w-md text-sm leading-6"
                  style={{ color: mutedColor }}
                >
                  No songs have been added to this playlist yet.
                  Explore music and add your favorite tracks.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                  style={{
                    background: primaryColor,
                    color: "#ffffff",
                  }}
                >
                  <Music2 size={17} />
                  Explore Music
                </button>
              </div>
            ) : (
              <div
                className="overflow-hidden rounded-3xl"
                style={panelStyle}
              >

                {/* DESKTOP TABLE HEADER */}

                <div
                  className="hidden grid-cols-[52px_minmax(0,1fr)_minmax(100px,0.55fr)_70px_96px] items-center gap-4 border-b px-5 py-4 text-xs font-bold uppercase tracking-wider md:grid"
                  style={{
                    borderColor:
                      "var(--theme-border, rgba(255,255,255,0.06))",
                    color: mutedColor,
                  }}
                >
                  <span className="text-center">#</span>
                  <span>Title</span>
                  <span>Artist</span>
                  <span className="text-center">
                    <Clock3 size={15} />
                  </span>
                  <span className="text-right">
                    Actions
                  </span>
                </div>

                {/* TRACK ROWS */}

                <div className="divide-y divide-white/5">

                  {playlistSongs.map((song, index) => {
                    const songId = getId(song);

                    const isActive =
                      songId !== "" &&
                      songId === currentSongId;

                    const isPlaying =
                      isActive && playing;

                    const cover = getSongCover(song);

                    return (
                      <motion.div
                        key={songId || `song-${index}`}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(index * 0.025, 0.25),
                        }}
                        className="group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-colors sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:px-5 md:grid-cols-[52px_minmax(0,1fr)_minmax(100px,0.55fr)_70px_96px] md:gap-4"
                        style={{
                          background: isActive
                            ? "color-mix(in srgb, var(--theme-primary, #8c7cf7) 8%, transparent)"
                            : "transparent",
                        }}
                      >

                        {/* TRACK NUMBER / PLAY */}

                        <button
                          type="button"
                          onClick={() =>
                            handlePlaySong(song, index)
                          }
                          aria-label={
                            isPlaying
                              ? `Pause ${song.title || "song"}`
                              : `Play ${song.title || "song"}`
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:scale-105 sm:h-11 sm:w-11"
                          style={
                            isActive
                              ? {
                                  background: primaryColor,
                                  color: "#ffffff",
                                }
                              : {
                                  ...insetStyle,
                                  color: primaryColor,
                                }
                          }
                        >
                          {isPlaying ? (
                            <Pause
                              size={17}
                              fill="currentColor"
                            />
                          ) : (
                            <span className="relative flex items-center justify-center">
                              <span className="text-sm font-bold group-hover:hidden">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <Play
                                size={17}
                                fill="currentColor"
                                className="hidden group-hover:block"
                              />
                            </span>
                          )}
                        </button>

                        {/* TITLE + COVER */}

                        <button
                          type="button"
                          onClick={() =>
                            handlePlaySong(song, index)
                          }
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <div
                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14"
                            style={raisedStyle}
                          >
                            {cover ? (
                              <img
                                src={cover}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : null}

                            <div className="absolute inset-0 -z-0 flex items-center justify-center">
                              <Music2
                                size={20}
                                style={{
                                  color: primaryColor,
                                }}
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-bold sm:text-base"
                              style={{
                                color: isActive
                                  ? primaryColor
                                  : textColor,
                              }}
                            >
                              {song.title || "Untitled Song"}
                            </p>

                            <p
                              className="mt-1 truncate text-xs md:hidden"
                              style={{ color: mutedColor }}
                            >
                              {getSongArtist(song)}
                            </p>

                            {isActive ? (
                              <span
                                className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  color: secondaryColor,
                                }}
                              >
                                <Volume2 size={11} />
                                {isPlaying
                                  ? "Now Playing"
                                  : "Selected"}
                              </span>
                            ) : null}
                          </div>
                        </button>

                        {/* ARTIST */}

                        <div
                          className="hidden min-w-0 truncate text-sm md:block"
                          style={{ color: mutedColor }}
                        >
                          {getSongArtist(song)}
                        </div>

                        {/* DURATION */}

                        <div
                          className="hidden text-center text-xs sm:text-sm md:block"
                          style={{ color: mutedColor }}
                        >
                          {getSongDuration(song) > 0
                            ? formatDuration(
                                getSongDuration(song)
                              )
                            : "--:--"}
                        </div>

                        {/* ACTIONS */}

                        <div className="flex items-center justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              handleAddToQueue(song)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:scale-105"
                            style={{
                              color: secondaryColor,
                            }}
                            title="Add to queue"
                            aria-label={`Add ${song.title || "song"} to queue`}
                          >
                            <ListMusic size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveSong(song)
                            }
                            disabled={
                              removingSongId === songId
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                            style={{
                              color: mutedColor,
                            }}
                            title="Remove from playlist"
                            aria-label={`Remove ${song.title || "song"} from playlist`}
                          >
                            {removingSongId === songId ? (
                              <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
                                style={{
                                  borderTopColor: primaryColor,
                                  borderRightColor: primaryColor,
                                }}
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>

                        </div>
                      </motion.div>
                    );
                  })}

                </div>
              </div>
            )}
          </section>

          {/* =========================================
              FOOTER NOTE
          ========================================= */}

          {playlistSongs.length > 0 ? (
            <div
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 text-xs sm:text-sm"
              style={panelStyle}
            >
              <div
                className="flex items-center gap-2"
                style={{ color: mutedColor }}
              >
                <Music2
                  size={16}
                  style={{ color: primaryColor }}
                />

                <span>
                  {shuffleMode
                    ? "Shuffle started from this playlist."
                    : "All tracks belong to this playlist."}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/playlists")}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 font-bold transition hover:opacity-80"
                style={{ color: secondaryColor }}
              >
                <ArrowLeft size={15} />
                All Playlists
              </button>
            </div>
          ) : null}

        </div>
      </main>
    );
  };

  export default PlaylistDetails;
