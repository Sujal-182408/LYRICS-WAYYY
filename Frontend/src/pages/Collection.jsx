import { useEffect, useMemo, useState } from "react";
import AddToPlaylistButton from "../assets/utility/AddToPlaylistButton";
import { motion } from "framer-motion";
import {
  Heart,
  Search,
  Play,
  Music2,
  Disc3,
  Mic2,
  Headphones,
  ChevronRight,
  X,
  SlidersHorizontal,
  Volume2,
  Radio,
  Library,
  Waves,
  BadgeCheck,
  RefreshCw,
  MoreVertical,
  ListPlus,
  ListMusic,
} from "lucide-react";

import { getSongs } from "../services/songService";

import {
  addFavorite,
  removeFavorite,
  getMyFavorites,
} from "../services/profileService";

import { BASE_URL } from "../config/api";
import { usePlayer, usePlaybackProgress } from "../context/PlayerContext";
import { useTheme } from "../context/ThemeContext";

/*
============================================================
LYRICS WAYYY — NEUMORPHIC MUSIC DECK
------------------------------------------------------------
- Recessed command deck
- Raised circular controls
- Horizontal music modules
- Vertical control rail
- Active genre selector
- Compact player console
- No glassmorphism
- Favorites connected to MongoDB
============================================================
*/

const raised = "bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[7px_7px_15px_var(--theme-shadowDark),_-6px_-6px_13px_var(--theme-shadowLight)]";
const pressed = "bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[inset_6px_6px_12px_var(--theme-shadowDark),inset_-5px_-5px_10px_var(--theme-shadowLight)]";
const smallRaised = "bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[4px_4px_9px_var(--theme-shadowDark),_-4px_-4px_9px_var(--theme-shadowLight)]";
const raisedStyle = { background: "var(--theme-surface)", borderColor: "var(--theme-border)", boxShadow: "7px 7px 15px var(--theme-shadowDark), -6px -6px 13px var(--theme-shadowLight)" };
const pressedStyle = { background: "var(--theme-surface)", borderColor: "var(--theme-border)", boxShadow: "inset 6px 6px 12px var(--theme-shadowDark), inset -5px -5px 10px var(--theme-shadowLight)" };
const smallRaisedStyle = { background: "var(--theme-surface)", borderColor: "var(--theme-border)", boxShadow: "4px 4px 9px var(--theme-shadowDark), -4px -4px 9px var(--theme-shadowLight)" };

const Collection = () => {
  const {
    playSong,
    currentSong,
    playing,
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
    addToQueue,
    playNext,
  } = usePlayer();

  // Progress is deliberately separated from PlayerContext to avoid stale/undefined time values.
  const { currentTime = 0, duration: progressDuration = 0 } = usePlaybackProgress();
  const duration = Number.isFinite(progressDuration) ? progressDuration : 0;

  // Follow the app-wide ThemeSwitcher instead of fixed colors.
  const { theme: activeTheme } = useTheme();
  const colors = activeTheme?.colors || {};
  const themeVars = {
    "--theme-background": colors.background || "#15181d",
    "--theme-surface": colors.surface || "#15181d",
    "--theme-surfaceLight": colors.surfaceLight || "#252b35",
    "--theme-shadowDark": colors.shadowDark || "#0b0e13",
    "--theme-shadowLight": colors.shadowLight || "#343b48",
    "--theme-primary": colors.primary || "#8c7cf7",
    "--theme-secondary": colors.secondary || "#2bd4c4",
    "--theme-text": colors.text || "#eef0f6",
    "--theme-textMuted": colors.textMuted || "#858c9d",
    "--theme-border": colors.border || "#252b35",
  };

  // =========================================================
  // PLAYER TIME
  // =========================================================

  const formatTime = (time) => {
    if (!Number.isFinite(time) || time < 0) {
      return "0:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // =========================================================
  // STATE
  // =========================================================

  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hoveredSong, setHoveredSong] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openSongMenu, setOpenSongMenu] = useState(null);

  /*
  ==========================================================
  FAVORITES
  ----------------------------------------------------------
  IDs of songs that are currently favorited by the user.
  These now come from MongoDB instead of localStorage.
  ==========================================================
  */

  const [likedSongs, setLikedSongs] = useState([]);

  /*
  Prevent multiple favorite requests for the same song.
  Example:

  click ❤️
       ↓
  request starts
       ↓
  button disabled
       ↓
  request finishes
       ↓
  button enabled
  */

  const [favoriteLoading, setFavoriteLoading] = useState({});

  // =========================================================
  // MEDIA URL
  // =========================================================

  const getMediaUrl = (filePath) => {
    if (!filePath) {
      return "";
    }

    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://")
    ) {
      return filePath;
    }

    const cleanPath = filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    return `${BASE_URL}/${cleanPath}`;
  };

  const getCoverUrl = (coverImage) => {
    if (!coverImage) {
      return "/default-cover.png";
    }

    return getMediaUrl(coverImage);
  };

  // =========================================================
  // ARTIST HELPERS
  // =========================================================

  const getArtistName = (artist) => {
    if (!artist) {
      return "Unknown Artist";
    }

    if (typeof artist === "object") {
      return artist.name || "Unknown Artist";
    }

    return artist;
  };

  const getArtistImage = (artist) => {
    if (!artist || typeof artist !== "object") {
      return "";
    }

    return artist.image || "";
  };

  const isVerifiedArtist = (artist) =>
    typeof artist === "object" &&
    artist.verified === true;

  // =========================================================
  // FETCH SONGS
  // =========================================================

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSongs();

      if (
        response?.success &&
        Array.isArray(response?.songs)
      ) {
        setSongs(response.songs);
      } else {
        setSongs([]);
        setError(
          "No songs were returned from the server."
        );
      }
    } catch (err) {
      console.error(
        "LYRICS WAYYY COLLECTION ERROR:",
        err
      );

      setSongs([]);

      setError(
        err?.response?.data?.message ||
          "Unable to load your music collection."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH FAVORITES
  // =========================================================

  const fetchFavorites = async () => {
    try {
      const response = await getMyFavorites();

      console.log(
        "LYRICS WAYYY FAVORITES RESPONSE:",
        response
      );

      if (
        response?.success &&
        Array.isArray(response?.favorites)
      ) {
        const favoriteIds = response.favorites
          .map((item) => {
            /*
            Possible backend responses:

            {
              song: {
                _id: "..."
              }
            }

            OR

            {
              song: "..."
            }

            OR

            direct song ID
            */

            if (typeof item === "string") {
              return item;
            }

            if (
              item?.song &&
              typeof item.song === "object"
            ) {
              return item.song._id;
            }

            if (item?.song) {
              return item.song;
            }

            if (item?._id) {
              return item._id;
            }

            return null;
          })
          .filter(Boolean);

        setLikedSongs(favoriteIds);
      } else {
        setLikedSongs([]);
      }
    } catch (error) {
      console.error(
        "GET FAVORITES ERROR:",
        error?.response?.data || error
      );

      /*
      Do not break the Collection page if
      favorites fail to load.
      */

      setLikedSongs([]);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchSongs();
    fetchFavorites();
  }, []);

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const artists = new Set();
    const genres = new Set();
    const albums = new Set();

    songs.forEach((song) => {
      const artist = getArtistName(song.artist);

      if (
        artist &&
        artist !== "Unknown Artist"
      ) {
        artists.add(artist);
      }

      if (song.genre?.trim()) {
        genres.add(song.genre.trim());
      }

      if (
        typeof song.album === "string" &&
        song.album.trim()
      ) {
        albums.add(song.album.trim());
      }
    });

    return {
      songs: songs.length,
      artists: artists.size,
      genres: genres.size,
      albums: albums.size,
    };
  }, [songs]);

  // =========================================================
  // GENRES
  // =========================================================

  const genres = useMemo(() => {
    const values = [
      ...new Set(
        songs
          .map((song) => song.genre?.trim())
          .filter(Boolean)
      ),
    ];

    return ["All", ...values];
  }, [songs]);

  // =========================================================
  // FILTERED SONGS
  // =========================================================

  const filteredSongs = useMemo(() => {
    const keyword = search
      .toLowerCase()
      .trim();

    return songs.filter((song) => {
      const title =
        song.title?.toLowerCase() || "";

      const artist =
        getArtistName(song.artist).toLowerCase();

      const album =
        typeof song.album === "string"
          ? song.album.toLowerCase()
          : "";

      const genre =
        song.genre?.toLowerCase() || "";

      const matchesSearch =
        !keyword ||
        title.includes(keyword) ||
        artist.includes(keyword) ||
        album.includes(keyword) ||
        genre.includes(keyword);

      const matchesGenre =
        selectedGenre === "All" ||
        genre === selectedGenre.toLowerCase();

      return (
        matchesSearch &&
        matchesGenre
      );
    });
  }, [
    songs,
    search,
    selectedGenre,
  ]);

  // =========================================================
  // TOGGLE FAVORITE
  // =========================================================

  const toggleFavorite = async (
    songId,
    event
  ) => {
    event?.stopPropagation();

    if (!songId) {
      return;
    }

    /*
    Prevent duplicate requests.
    */

    if (favoriteLoading[songId]) {
      return;
    }

    const currentlyFavorite =
      likedSongs.includes(songId);

    try {
      setFavoriteLoading((previous) => ({
        ...previous,
        [songId]: true,
      }));

      // =====================================================
      // REMOVE FAVORITE
      // =====================================================

      if (currentlyFavorite) {
        await removeFavorite(songId);

        setLikedSongs((previous) =>
          previous.filter(
            (id) => id !== songId
          )
        );

        console.log(
          "Removed favorite:",
          songId
        );
      }

      // =====================================================
      // ADD FAVORITE
      // =====================================================

      else {
        await addFavorite(songId);

        setLikedSongs((previous) =>
          previous.includes(songId)
            ? previous
            : [...previous, songId]
        );

        console.log(
          "Added favorite:",
          songId
        );
      }
    } catch (error) {
      console.error(
        "TOGGLE FAVORITE ERROR:",
        error?.response?.data || error
      );

      /*
      Keep UI unchanged when API fails.
      */

      alert(
        error?.response?.data?.message ||
          "Unable to update favorite."
      );
    } finally {
      setFavoriteLoading((previous) => ({
        ...previous,
        [songId]: false,
      }));
    }
  };

  // =========================================================
  // IS FAVORITE
  // =========================================================

  const isFavorite = (songId) =>
    likedSongs.includes(songId);

  // =========================================================
  // PLAY SONG
  // =========================================================

const handlePlaySong = (song, event) => {
  event?.stopPropagation();

  if (!song?._id) {
    console.error("[Collection] Song is missing its ID.");
    return;
  }

  const index = filteredSongs.findIndex(
    (item) => String(item?._id) === String(song._id)
  );

  if (index === -1) {
    console.error("[Collection] Song not found in filtered songs.");
    return;
  }

  playSong(song, index, filteredSongs, "library");
};

  // =========================================================
  // ANIMATIONS
  // =========================================================

  const containerVariants = {
    hidden: {},

    visible: {
      transition: {
        staggerChildren: 0.045,
        delayChildren: 0.04,
      },
    },
  };

  const fadeUp = {
    hidden: {
      opacity: 0,
      y: 18,
    },

    visible: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.48,
        ease: "easeOut",
      },
    },
  };

  const scaleIn = {
    hidden: {
      opacity: 0,
      scale: 0.96,
    },

    visible: {
      opacity: 1,
      scale: 1,

      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <section style={themeVars} className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "linear",
            }}
            style={pressedStyle}
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${pressed}`}
          >
            <div
              style={smallRaisedStyle}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${smallRaised}`}
            >
              <Music2
                size={24}
                className="text-[var(--theme-secondary)]"
              />
            </div>
          </motion.div>

          <motion.p
            animate={{
              opacity: [
                0.35,
                1,
                0.35,
              ],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
            }}
            className="mt-7 text-[10px] tracking-[0.42em] uppercase text-[var(--theme-textMuted)]"
          >
            LYRICS WAYYY
          </motion.p>

          <p className="mt-2 text-sm text-[var(--theme-textMuted)]/50">
            Preparing your music deck...
          </p>
        </div>
      </section>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <motion.main
      style={themeVars}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="collection-theme min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)] overflow-hidden pb-28"
    >

      <style>{`
        .collection-theme [class*="shadow-["] { }
        .collection-theme input[type="range"] { accent-color: var(--theme-secondary); }
        .collection-theme button:focus-visible, .collection-theme input:focus-visible { outline: 2px solid var(--theme-secondary); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .collection-theme *, .collection-theme *::before, .collection-theme *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="px-4 sm:px-8 lg:px-12 pt-5 sm:pt-7 mt-20 sm:mt-25">
        <div className="w-full max-w-[1560px] mx-auto flex items-center justify-between gap-4">
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2.5 sm:gap-4"
          >
            <div
              style={raisedStyle}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${raised}`}
            >
              <Waves
                size={21}
                className="text-[var(--theme-secondary)]"
              />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-[var(--theme-textMuted)]">
                LYRICS WAYYY
              </p>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Music Deck
              </h1>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="hidden md:flex items-center gap-2"
          >
            <div
              className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] ${pressed}`}
            >
              <span className="text-[var(--theme-secondary)]">
                ●
              </span>

              <span className="ml-2 text-[var(--theme-textMuted)]">
                Library online
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                fetchSongs();
                fetchFavorites();
              }}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:text-[var(--theme-secondary)] active:scale-95 ${smallRaised}`}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </motion.div>
        </div>
      </header>

      {/* ======================================================
          MAIN DECK
      ====================================================== */}

      <section className="px-5 sm:px-8 lg:px-12 mt-8">
        <div className="w-full max-w-[1560px] mx-auto">
          <motion.div
            variants={scaleIn}
            style={pressedStyle}
            className={`rounded-3xl sm:rounded-4xl p-3 sm:p-6 lg:p-7 ${pressed}`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 sm:gap-5">

              {/* ==================================================
                  COMMAND PANEL
              ================================================== */}

              <div
                style={raisedStyle}
                className={`rounded-3xl p-4 sm:p-7 ${raised}`}
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-[var(--theme-secondary)]">
                      <Radio size={15} />

                      <span className="text-[9px] uppercase tracking-[0.3em]">
                        Collection Console
                      </span>
                    </div>

                    <h2 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-[-0.05em]">
                      YOUR
                      <br />

                      <span className="text-[var(--theme-primary)]">
                        SOUND.
                      </span>
                    </h2>

                    <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--theme-textMuted)]">
                      Search, filter and control your complete music
                      collection from one recessed command deck.
                    </p>
                  </div>

                  <div
                    className={`hidden sm:flex w-16 h-16 rounded-full items-center justify-center shrink-0 ${pressed}`}
                  >
                    <Headphones
                      size={24}
                      className="text-[var(--theme-primary)]"
                    />
                  </div>
                </div>

                {/* SEARCH */}

                <div
                  className={`mt-8 rounded-2xl p-2 ${pressed}`}
                >
                  <div className="relative flex items-center">
                    <Search
                      size={18}
                      className="absolute left-5 text-[var(--theme-secondary)]"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search your collection..."
                      className="w-full h-12 bg-transparent outline-none pl-12 pr-12 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-textMuted)]/45"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() =>
                          setSearch("")
                        }
                        className="absolute right-4 text-[var(--theme-textMuted)] hover:text-[var(--theme-secondary)]"
                      >
                        <X size={17} />
                      </button>
                    )}
                  </div>
                </div>

                {/* STAT DIALS */}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
                  {[
                    [
                      Music2,
                      statistics.songs,
                      "Songs",
                    ],
                    [
                      Mic2,
                      statistics.artists,
                      "Artists",
                    ],
                    [
                      Disc3,
                      statistics.albums,
                      "Albums",
                    ],
                    [
                      Waves,
                      statistics.genres,
                      "Genres",
                    ],
                  ].map(
                    ([
                      Icon,
                      value,
                      label,
                    ]) => (
                      <div
                        key={label}
                        style={pressedStyle}
                        className={`rounded-2xl p-3 flex items-center gap-3 ${pressed}`}
                      >
                        <div
                          style={smallRaisedStyle}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${smallRaised}`}
                        >
                          <Icon
                            size={16}
                            className="text-[var(--theme-secondary)]"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-black text-lg leading-none">
                            {value}
                          </div>

                          <div className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[var(--theme-textMuted)]">
                            {label}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* ==================================================
                  CONTROL SURFACE
              ================================================== */}

              <motion.div
                variants={scaleIn}
                style={pressedStyle}
                className={`
                  rounded-[1.5rem]
                  p-5
                  sm:p-6
                  flex
                  flex-col
                  ${pressed}
                `}
              >
                {/* HEADER */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        w-1.5
                        h-1.5
                        rounded-full
                        ${
                          playing
                            ? "bg-[var(--theme-secondary)] shadow-[0_0_10px_rgba(43,212,196,.8)]"
                            : "bg-[#858c9d]"
                        }
                      `}
                    />

                    <span className="text-[9px] uppercase tracking-[0.28em] text-[var(--theme-textMuted)]">
                      Control Surface
                    </span>
                  </div>

                  {playing && (
                    <div className="flex items-end gap-[3px] h-4">
                      {[1, 2, 3, 4].map(
                        (bar) => (
                          <motion.span
                            key={bar}
                            animate={{
                              height: [
                                "4px",
                                "15px",
                                "7px",
                                "12px",
                                "4px",
                              ],
                            }}
                            transition={{
                              duration:
                                0.8 +
                                bar *
                                  0.08,
                              repeat:
                                Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-[3px] rounded-full bg-[var(--theme-secondary)]"
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {currentSong ? (
                  <>
                    {/* COVER */}

                    <div className="mt-5 flex justify-center">
                      <motion.div
                        animate={
                          playing
                            ? {
                                scale: [
                                  1,
                                  1.015,
                                  1,
                                ],
                              }
                            : {
                                scale: 1,
                              }
                        }
                        transition={{
                          duration: 3,
                          repeat:
                            playing
                              ? Infinity
                              : 0,
                          ease: "easeInOut",
                        }}
                        className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-[1.4rem] overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[7px_7px_15px_rgba(0,0,0,.72),-6px_-6px_13px_rgba(168,178,198,.045)]"
                      >
                        <img
                          src={getCoverUrl(
                            currentSong.coverImage
                          )}
                          alt={
                            currentSong.title
                          }
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = "true";
                              e.currentTarget.src = "/default-cover.png";
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    </div>

                    {/* SONG INFO */}

                    <div className="mt-5 text-center">
                      <h3 className="text-lg font-black text-[var(--theme-text)] truncate">
                        {
                          currentSong.title
                        }
                      </h3>

                      <div className="mt-1.5 flex items-center justify-center gap-1.5">
                        <span className="text-xs text-[var(--theme-textMuted)] truncate max-w-[200px]">
                          {getArtistName(
                            currentSong.artist
                          )}
                        </span>

                        {isVerifiedArtist(
                          currentSong.artist
                        ) && (
                          <BadgeCheck
                            size={13}
                            className="text-[var(--theme-secondary)] shrink-0"
                          />
                        )}
                      </div>
                    </div>

                    {/* TIMELINE */}

                    <div className="mt-5">
                      <div className="relative h-4">
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--theme-surface)] shadow-[inset_3px_3px_6px_rgba(0,0,0,.75),inset_-2px_-2px_5px_rgba(168,178,198,.04)]" />

                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--theme-secondary)] shadow-[0_0_8px_rgba(43,212,196,.4)] pointer-events-none"
                          style={{
                            width:
                              duration >
                              0
                                ? `${Math.min(
                                    (currentTime /
                                      duration) *
                                      100,
                                    100
                                  )}%`
                                : "0%",
                          }}
                        />

                        <input
                          type="range"
                          min="0"
                          max={
                            duration || 0
                          }
                          step="0.1"
                          value={Math.min(
                            currentTime,
                            duration || 0
                          )}
                          onChange={(e) =>
                            seekSong(
                              Number(
                                e.target
                                  .value
                              )
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--theme-secondary)] border-2 border-[#15181d] shadow-[0_0_8px_rgba(43,212,196,.6)] pointer-events-none"
                          style={{
                            left:
                              duration >
                              0
                                ? `calc(${Math.min(
                                    (currentTime /
                                      duration) *
                                      100,
                                    100
                                  )}% - 6px)`
                                : "-6px",
                          }}
                        />
                      </div>

                      <div className="flex justify-between mt-1 text-[9px] font-mono text-[var(--theme-textMuted)]">
                        <span>
                          {formatTime(
                            currentTime
                          )}
                        </span>

                        <span>
                          {formatTime(
                            duration
                          )}
                        </span>
                      </div>
                    </div>

                    {/* CONTROLS */}

                    <div className="flex items-center justify-center gap-2 sm:gap-4 mt-5">
                      <button
                        type="button"
                        onClick={() =>
                          setShuffle(
                            (value) =>
                              !value
                          )
                        }
                        title="Shuffle"
                        className={`
                          w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition
                          ${
                            shuffle
                              ? "text-[var(--theme-secondary)]"
                              : "text-[var(--theme-textMuted)]"
                          }
                          ${
                            shuffle
                              ? pressed
                              : smallRaised
                          }
                        `}
                      >
                        <Waves size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={
                          previousSong
                        }
                        title="Previous"
                        className={`w-8 h-8 sm:w-9 sm:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--theme-text)] ${smallRaised}`}
                      >
                        <ChevronRight
                          size={18}
                          className="rotate-180"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={
                          togglePlay
                        }
                        title={
                          playing
                            ? "Pause"
                            : "Play"
                        }
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-[var(--theme-secondary)] text-[#15181d] shadow-[7px_7px_14px_rgba(0,0,0,.7),-5px_-5px_10px_rgba(168,178,198,.05)] hover:scale-105 active:scale-95 transition-transform"
                      >
                        {playing ? (
                          <div className="flex gap-1">
                            <span className="w-[4px] h-5 rounded-full bg-[var(--theme-surface)]" />
                            <span className="w-1 h-5 rounded-full bg-[var(--theme-surface)]" />
                          </div>
                        ) : (
                          <Play
                            size={21}
                            fill="currentColor"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={
                          nextSong
                        }
                        title="Next"
                        className={`w-8 h-8 sm:w-9 sm:h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[var(--theme-text)] ${smallRaised}`}
                      >
                        <ChevronRight
                          size={18}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRepeat(
                            (value) =>
                              !value
                          )
                        }
                        title="Repeat"
                        className={`
                          w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition
                          ${
                            repeat
                              ? "text-[var(--theme-primary)]"
                              : "text-[var(--theme-textMuted)]"
                          }
                          ${
                            repeat
                              ? pressed
                              : smallRaised
                          }
                        `}
                      >
                        <RefreshCw
                          size={14}
                        />
                      </button>
                    </div>

                    {/* VOLUME */}

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={
                          toggleMute
                        }
                        title={
                          muted
                            ? "Unmute"
                            : "Mute"
                        }
                        className="shrink-0 text-[var(--theme-textMuted)] hover:text-[var(--theme-text)] transition"
                      >
                        <Volume2
                          size={15}
                          className={
                            muted ||
                            volume === 0
                              ? "opacity-50"
                              : ""
                          }
                        />
                      </button>

                      <div className="relative flex-1 min-w-0 h-3">
                        <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--theme-surface)] shadow-[inset_2px_2px_5px_rgba(0,0,0,.75),inset_-2px_-2px_4px_rgba(168,178,198,.04)]" />

                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--theme-primary)] pointer-events-none"
                          style={{
                            width: `${
                              volume * 100
                            }%`,
                          }}
                        />

                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={
                            muted
                              ? 0
                              : volume
                          }
                          onChange={(e) =>
                            changeVolume(
                              Number(
                                e.target
                                  .value
                              )
                            )
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      <span className="w-8 text-right text-[9px] font-mono text-[var(--theme-textMuted)]">
                        {Math.round(
                          (muted
                            ? 0
                            : volume) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 min-h-[360px] flex-col items-center justify-center text-center">
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center ${pressed}`}
                    >
                      <Music2
                        size={32}
                        className="text-[var(--theme-textMuted)]/50"
                      />
                    </div>

                    <h3 className="mt-5 text-base font-bold text-[var(--theme-text)]">
                      Nothing playing
                    </h3>

                    <p className="mt-2 max-w-[210px] text-xs leading-5 text-[var(--theme-textMuted)]">
                      Select a song from your collection
                      to start listening.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================================
          GENRE CONTROL RAIL
      ====================================================== */}

      <section className="px-5 sm:px-8 lg:px-12 mt-7">
        <div className="w-full max-w-[1560px] mx-auto">
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                showFilters
                  ? pressed
                  : smallRaised
              }`}
            >
              <SlidersHorizontal
                size={17}
                className={
                  showFilters
                    ? "text-[var(--theme-secondary)]"
                    : ""
                }
              />
            </button>

            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 min-w-max pb-1">
                {genres.map((genre) => {
                  const active =
                    selectedGenre ===
                    genre;

                  return (
                    <button
                      type="button"
                      key={genre}
                      onClick={() =>
                        setSelectedGenre(
                          genre
                        )
                      }
                      className={`px-4 sm:px-5 h-10 sm:h-11 rounded-xl text-[10px] uppercase tracking-[0.16em] font-bold transition-all ${
                        active
                          ? "text-[var(--theme-secondary)] " +
                            pressed
                          : "text-[var(--theme-textMuted)] " +
                            smallRaised
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {showFilters && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              className={`mt-3 rounded-2xl p-4 ${pressed}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[9px] uppercase tracking-[0.25em] text-[var(--theme-textMuted)]">
                  Active filter
                </span>

                <div
                  className={`px-4 py-2 rounded-lg text-xs text-[var(--theme-secondary)] ${smallRaised}`}
                >
                  {selectedGenre}
                </div>

                {search && (
                  <div
                    className={`px-4 py-2 rounded-lg text-xs text-[var(--theme-primary)] ${smallRaised}`}
                  >
                    Search: {search}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ======================================================
          MUSIC MODULES
      ====================================================== */}

      <section className="px-5 sm:px-8 lg:px-12 mt-8">
        <div className="w-full max-w-[1560px] mx-auto">
          <motion.div
            variants={fadeUp}
            className="flex items-end justify-between mb-4"
          >
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--theme-secondary)]">
                Audio Modules
              </p>

              <h2 className="mt-1 text-2xl sm:text-3xl font-black">
                {selectedGenre ===
                "All"
                  ? "All Music"
                  : selectedGenre}
              </h2>
            </div>

            <div className="text-[10px] text-[var(--theme-textMuted)]">
              {filteredSongs.length} tracks
            </div>
          </motion.div>

          {error ? (
            <motion.div
              variants={fadeUp}
              className={`rounded-2xl p-8 text-center ${pressed}`}
            >
              <div
                className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${smallRaised}`}
              >
                <Radio
                  size={20}
                  className="text-[#ff6b6b]"
                />
              </div>

              <h3 className="mt-4 font-bold">
                Collection unavailable
              </h3>

              <p className="mt-2 text-sm text-[var(--theme-textMuted)]">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  fetchSongs();
                  fetchFavorites();
                }}
                className={`mt-5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold text-[var(--theme-secondary)] ${smallRaised}`}
              >
                Try again
              </button>
            </motion.div>
          ) : filteredSongs.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className={`rounded-2xl p-8 sm:p-12 text-center ${pressed}`}
            >
              <Library
                size={28}
                className="mx-auto text-[var(--theme-textMuted)]"
              />

              <h3 className="mt-4 font-bold">
                No music found
              </h3>

              <p className="mt-2 text-sm text-[var(--theme-textMuted)]">
                Try another search or genre.
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
            >
              {filteredSongs.map(
                (song, index) => {
                  const favorite =
                    isFavorite(
                      song._id
                    );

                  const favoriteBusy =
                    Boolean(
                      favoriteLoading[
                        song._id
                      ]
                    );

                  const artistName =
                    getArtistName(
                      song.artist
                    );

                  const artistImage =
                    getArtistImage(
                      song.artist
                    );

                  const verified =
                    isVerifiedArtist(
                      song.artist
                    );

                  const isHovered =
                    hoveredSong ===
                    song._id;

                  return (
                    <motion.article
                      key={song._id}
                      variants={fadeUp}
                      onMouseEnter={() =>
                        setHoveredSong(
                          song._id
                        )
                      }
                      onMouseLeave={() =>
                        setHoveredSong(
                          null
                        )
                      }
                      onClick={() =>
                        handlePlaySong(
                          song
                        )
                      }
                      className={`group relative rounded-[1.2rem] sm:rounded-[1.4rem] p-2.5 sm:p-4 cursor-pointer transition-all duration-300 ${
                        isHovered
                          ? pressed
                          : raised
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-4">

                        {/* INDEX / PLAY */}

                        <div className="hidden sm:flex w-9 shrink-0 items-center justify-center">
                          {isHovered ? (
                            <button
                              type="button"
                              onClick={(e) =>
                                handlePlaySong(
                                  song,
                                  e
                                )
                              }
                              className="w-9 h-9 rounded-full bg-[var(--theme-secondary)] text-[#15181d] flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,.6)]"
                            >
                              <Play
                                size={14}
                                fill="currentColor"
                              />
                            </button>
                          ) : (
                            <span className="text-[10px] text-[var(--theme-textMuted)]/50 font-mono">
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>
                          )}
                        </div>

                        {/* ART WELL */}

                        <div
                          className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 ${
                            isHovered
                              ? raised
                              : pressed
                          }`}
                        >
                          <img
                            src={getCoverUrl(
                              song.coverImage
                            )}
                            alt={
                              song.title ||
                              "Song"
                            }
                            onError={(e) => {
                              e.currentTarget.src =
                                "/default-cover.png";
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          <div className="absolute inset-0 pointer-events-none shadow-[inset_3px_3px_7px_rgba(0,0,0,.5),inset_-2px_-2px_5px_rgba(255,255,255,.035)]" />
                        </div>

                        {/* SONG INFORMATION */}

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base truncate">
                              {song.title ||
                                "Untitled"}
                            </h3>

                            {verified && (
                              <BadgeCheck
                                size={14}
                                className="text-[var(--theme-secondary)] shrink-0"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 min-w-0">
                            {artistImage ? (
                              <img
                                src={getMediaUrl(
                                  artistImage
                                )}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${pressed}`}
                              >
                                <Mic2
                                  size={10}
                                  className="text-[var(--theme-textMuted)]"
                                />
                              </div>
                            )}

                            <span className="text-xs text-[var(--theme-textMuted)] truncate">
                              {
                                artistName
                              }
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {song.genre && (
                              <span
                                className={`px-2.5 py-1 rounded-md text-[8px] uppercase tracking-wider text-[var(--theme-textMuted)] ${pressed}`}
                              >
                                {
                                  song.genre
                                }
                              </span>
                            )}

                            {song.album &&
                              typeof song.album ===
                                "string" && (
                                <span className="text-[9px] text-[var(--theme-textMuted)]/50 truncate">
                                  {
                                    song.album
                                  }
                                </span>
                              )}
                          </div>
                        </div>

                        {/* RIGHT CONTROLS */}

                        <div className="flex items-center gap-2 shrink-0">

                          {/* ==================================================
                              FAVORITE BUTTON
                          ================================================== */}

                          <button
                            type="button"
                            disabled={
                              favoriteBusy
                            }
                            onClick={(e) =>
                              toggleFavorite(
                                song._id,
                                e
                              )
                            }
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              favorite
                                ? pressed
                                : smallRaised
                            } ${
                              favoriteBusy
                                ? "opacity-50 cursor-wait"
                                : "hover:scale-105 active:scale-90"
                            }`}
                            title={
                              favorite
                                ? "Remove favorite"
                                : "Add favorite"
                            }
                          >
                            {favoriteBusy ? (
                              <motion.div
                                animate={{
                                  rotate: 360,
                                }}
                                transition={{
                                  duration: 0.8,
                                  repeat:
                                    Infinity,
                                  ease: "linear",
                                }}
                              >
                                <RefreshCw
                                  size={14}
                                  className="text-[var(--theme-secondary)]"
                                />
                              </motion.div>
                            ) : (
                              <Heart
                                size={15}
                                className={
                                  favorite
                                    ? "text-[var(--theme-primary)] fill-[#8c7cf7]"
                                    : "text-[var(--theme-textMuted)]"
                                }
                              />
                            )}
                          </button>

                          {/* THREE-DOT MORE OPTIONS MENU */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenSongMenu((previous) =>
                                  previous === song._id ? null : song._id
                                );
                              }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-[var(--theme-textMuted)] hover:text-[var(--theme-secondary)] active:scale-95 ${
                                openSongMenu === song._id ? pressed : smallRaised
                              }`}
                              title="More options"
                              aria-label={`More options for ${song.title || "song"}`}
                              aria-expanded={openSongMenu === song._id}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openSongMenu === song._id && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Close song options"
                                  className="fixed inset-0 z-40 cursor-default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSongMenu(null);
                                  }}
                                />

                                <div
                                  className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl p-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[8px_8px_18px_rgba(0,0,0,.75),-5px_-5px_12px_rgba(168,178,198,.045)]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      handlePlaySong(song, e);
                                      setOpenSongMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#d9deea] transition-colors hover:bg-[#20252d] hover:text-[var(--theme-secondary)]"
                                  >
                                    <Play size={15} />
                                    <span>Play Now</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playNext(song);
                                      setOpenSongMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#d9deea] transition-colors hover:bg-[#20252d] hover:text-[var(--theme-secondary)]"
                                  >
                                    <ListMusic size={15} />
                                    <span>Play Next</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToQueue(song);
                                      setOpenSongMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-[#d9deea] transition-colors hover:bg-[#20252d] hover:text-[var(--theme-secondary)]"
                                  >
                                    <ListPlus size={15} />
                                    <span>Add to Queue</span>
                                  </button>

                                  <div className="my-1 border-t border-[var(--theme-border)]" />

                                  <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-[#d9deea] hover:bg-[#20252d]">
                                    <ListMusic size={15} className="shrink-0 text-[var(--theme-secondary)]" />
                                    <span className="min-w-0 flex-1">Add to Playlist</span>
                                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <AddToPlaylistButton song={song} size="sm" />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* PLAY */}

                          <button
                            type="button"
                            onClick={(e) =>
                              handlePlaySong(
                                song,
                                e
                              )
                            }
                            className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center transition-all ${
                              isHovered
                                ? "bg-[var(--theme-secondary)] text-[#15181d] shadow-[5px_5px_10px_rgba(0,0,0,.65)]"
                                : smallRaised
                            }`}
                          >
                            <Play
                              size={15}
                              fill={
                                isHovered
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>

                          {/* ARROW */}

                          <ChevronRight
                            size={16}
                            className={`hidden md:block transition-transform duration-300 ${
                              isHovered
                                ? "text-[var(--theme-secondary)] translate-x-1"
                                : "text-[var(--theme-textMuted)]/30"
                            }`}
                          />
                        </div>
                      </div>

                      {/* PROGRESS DETAIL */}

                      <div className="mt-3 ml-0 sm:ml-18">
                        <div
                          className={`h-1.5 rounded-full overflow-hidden ${pressed}`}
                        >
                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: isHovered
                                ? "38%"
                                : "0%",
                            }}
                            transition={{
                              duration: 0.5,
                            }}
                            className="h-full rounded-full bg-[var(--theme-secondary)]/60"
                          />
                        </div>
                      </div>
                    </motion.article>
                  );
                }
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ======================================================
          BOTTOM STATUS
      ====================================================== */}

      <section className="px-5 sm:px-8 lg:px-12 mt-8">
        <div className="w-full max-w-390 mx-auto">
          <motion.div
            variants={fadeUp}
            className={`rounded-2xl px-4 sm:px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${raised}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${smallRaised}`}
              >
                <Headphones
                  size={16}
                  className="text-[var(--theme-primary)]"
                />
              </div>

              <div>
                <p className="text-xs font-bold">
                  Collection ready
                </p>

                <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--theme-textMuted)] mt-1">
                  {statistics.songs} songs ·{" "}
                  {statistics.artists} artists
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[var(--theme-textMuted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-secondary)] shadow-[0_0_8px_rgba(43,212,196,.7)]" />

              Audio system active
            </div>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
};

export default Collection;