
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
} from "lucide-react";

import { getSongs } from "../services/songService";
import { searchYouTubeMusic } from "../services/youtubeMusicService";

import {
  addFavorite,
  removeFavorite,
  getMyFavorites,
} from "../services/profileService";

import { BASE_URL } from "../config/api";
import { usePlayer } from "../context/PlayerContext";
import "./Collection.css";

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

const raised = "neu-raised";

const pressed = "neu-inset";

const smallRaised = "neu-raised-small";

const Collection = () => {
  const {
    playSong,
    playYouTubeSong,
    currentSong,
    playing,
    currentTime,
    duration,
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
  } = usePlayer();

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

  // Uploaded tracks and YouTube results share the same Collection grid.
  const [songs, setSongs] = useState([]);
  const [youtubeSongs, setYoutubeSongs] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hoveredSong, setHoveredSong] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

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

  // Keep YouTube discovery inside the existing Collection list (no separate section).
  // The same search field searches local tracks and refreshes YouTube results.
  useEffect(() => {
    let cancelled = false;
    const query = search.trim() || "popular Hindi songs official music video";
    const timer = window.setTimeout(async () => {
      setYoutubeLoading(true);
      try {
        const results = await searchYouTubeMusic(query, 12);
        if (cancelled) return;
        const normalized = (Array.isArray(results) ? results : [])
          .filter((video) => video?.videoId || video?.youtubeVideoId)
          .map((video) => {
            const videoId = String(video.videoId || video.youtubeVideoId);
            return {
              _id: `youtube:${videoId}`,
              id: `youtube:${videoId}`,
              youtubeVideoId: videoId,
              isYouTubeTrack: true,
              source: "youtube",
              title: video.title || "YouTube track",
              artist: video.artist || "YouTube Music",
              coverImage: video.thumbnail || video.coverImage || "",
              album: "YouTube Music",
              genre: "YouTube Music",
              duration: Number(video.duration) || 0,
            };
          });
        setYoutubeSongs(normalized);
      } catch (err) {
        if (!cancelled) {
          console.warn("Collection YouTube search failed:", err?.message || err);
          setYoutubeSongs([]);
        }
      } finally {
        if (!cancelled) setYoutubeLoading(false);
      }
    }, search.trim() ? 450 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  const allSongs = useMemo(() => {
    const localIds = new Set(songs.map((song) => String(song?._id ?? song?.id)));
    return [
      ...songs,
      ...youtubeSongs.filter((song) => !localIds.has(String(song._id))),
    ];
  }, [songs, youtubeSongs]);

  const isYouTubeTrack = (song) => Boolean(song?.youtubeVideoId || song?.source === "youtube");

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const artists = new Set();
    const genres = new Set();
    const albums = new Set();

    allSongs.forEach((song) => {
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
      songs: allSongs.length,
      artists: artists.size,
      genres: genres.size,
      albums: albums.size,
    };
  }, [allSongs]);

  // =========================================================
  // GENRES
  // =========================================================

  const genres = useMemo(() => {
    const values = [
      ...new Set(
        allSongs
          .map((song) => song.genre?.trim())
          .filter(Boolean)
      ),
    ];

    return ["All", ...values];
  }, [allSongs]);

  // =========================================================
  // FILTERED SONGS
  // =========================================================

  const filteredSongs = useMemo(() => {
    const keyword = search
      .toLowerCase()
      .trim();

    return allSongs.filter((song) => {
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
    allSongs,
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

    // External YouTube video IDs are not MongoDB Song IDs.
    // Do not send them to the uploaded-song favorites endpoint.
    if (String(songId).startsWith("youtube:")) {
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

    const index = filteredSongs.findIndex(
      (item) => String(item?._id ?? item?.id) === String(song?._id ?? song?.id),
    );
    if (index < 0) return;

    if (isYouTubeTrack(song)) {
      const youtubePlaylist = filteredSongs.filter(isYouTubeTrack);
      const youtubeIndex = youtubePlaylist.findIndex(
        (item) => String(item.youtubeVideoId) === String(song.youtubeVideoId),
      );
      playYouTubeSong(song, youtubePlaylist, Math.max(0, youtubeIndex));
      return;
    }

    // Keep uploaded MP3 playback unchanged; pass the combined list so next/previous
    // can move between uploaded tracks and YouTube tracks where supported.
    playSong(song, index, filteredSongs);
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
      <section className="collection-page min-h-screen flex items-center justify-center">
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
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${pressed}`}
          >
            <div
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
            className="mt-7 text-[10px] tracking-[0.42em] uppercase text-[var(--theme-text-muted)]"
          >
            LYRICS WAYYY
          </motion.p>

          <p className="mt-2 text-sm text-[var(--theme-text-muted)]/50">
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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="collection-page min-h-screen overflow-hidden pb-28"
    >
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
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${raised}`}
            >
              <Waves
                size={21}
                className="text-[var(--theme-secondary)]"
              />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-[var(--theme-text-muted)]">
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

              <span className="ml-2 text-[var(--theme-text-muted)]">
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
            className={`rounded-3xl sm:rounded-4xl p-3 sm:p-6 lg:p-7 ${pressed}`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 sm:gap-5">

              {/* ==================================================
                  COMMAND PANEL
              ================================================== */}

              <div
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

                    <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--theme-text-muted)]">
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
                      className="collection-search-input w-full h-12 bg-transparent outline-none pl-12 pr-12 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)]/45"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() =>
                          setSearch("")
                        }
                        className="absolute right-4 text-[var(--theme-text-muted)] hover:text-[var(--theme-secondary)]"
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
                        className={`rounded-2xl p-3 flex items-center gap-3 ${pressed}`}
                      >
                        <div
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

                          <div className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">
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
                            ? "bg-[var(--theme-primary)] shadow-[0_0_10px_var(--theme-glow-primary)]"
                            : "bg-[var(--theme-text-muted)]"
                        }
                      `}
                    />

                    <span className="text-[9px] uppercase tracking-[0.28em] text-[var(--theme-text-muted)]">
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
                            className="w-[3px] rounded-full bg-[var(--theme-primary)]"
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
                        className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-[1.4rem] overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[7px_7px_15px_var(--theme-shadow-dark),-6px_-6px_13px_var(--theme-shadow-light)]"
                      >
                        <img
                          src={getCoverUrl(
                            currentSong.coverImage
                          )}
                          alt={
                            currentSong.title
                          }
                          onError={(e) => {
                            e.currentTarget.src =
                              "/default-cover.png";
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
                        <span className="text-xs text-[var(--theme-text-muted)] truncate max-w-[200px]">
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
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--theme-surface)] shadow-[inset_3px_3px_6px_var(--theme-shadow-dark),inset_-2px_-2px_5px_var(--theme-shadow-light)]" />

                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[var(--theme-primary)] shadow-[0_0_8px_var(--theme-glow-primary)] pointer-events-none"
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
                          className="collection-range-input absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--theme-primary)] border-2 border-[var(--theme-surface)] shadow-[0_0_8px_var(--theme-glow-primary)] pointer-events-none"
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

                      <div className="flex justify-between mt-1 text-[9px] font-mono text-[var(--theme-text-muted)]">
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
                              : "text-[var(--theme-text-muted)]"
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
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-[var(--theme-primary)] text-[var(--theme-background)] shadow-[7px_7px_14px_var(--theme-shadow-dark),-5px_-5px_10px_var(--theme-shadow-light)] hover:scale-105 active:scale-95 transition-transform"
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
                              : "text-[var(--theme-text-muted)]"
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
                        className="shrink-0 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition"
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
                        <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--theme-surface)] shadow-[inset_2px_2px_5px_var(--theme-shadow-dark),inset_-2px_-2px_4px_var(--theme-shadow-light)]" />

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
                          className="collection-range-input absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      <span className="w-8 text-right text-[9px] font-mono text-[var(--theme-text-muted)]">
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
                        className="text-[var(--theme-text-muted)]/50"
                      />
                    </div>

                    <h3 className="mt-5 text-base font-bold text-[var(--theme-text)]">
                      Nothing playing
                    </h3>

                    <p className="mt-2 max-w-[210px] text-xs leading-5 text-[var(--theme-text-muted)]">
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
                          : "text-[var(--theme-text-muted)] " +
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
                <span className="text-[9px] uppercase tracking-[0.25em] text-[var(--theme-text-muted)]">
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

            <div className="text-[10px] text-[var(--theme-text-muted)]">
              {filteredSongs.length} tracks
            </div>
          </motion.div>

          {error && songs.length === 0 && youtubeSongs.length === 0 && !youtubeLoading ? (
            <motion.div
              variants={fadeUp}
              className={`rounded-2xl p-8 text-center ${pressed}`}
            >
              <div
                className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${smallRaised}`}
              >
                <Radio
                  size={20}
                  className="text-[var(--theme-danger)]"
                />
              </div>

              <h3 className="mt-4 font-bold">
                Collection unavailable
              </h3>

              <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
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
                className="mx-auto text-[var(--theme-text-muted)]"
              />

              <h3 className="mt-4 font-bold">
                No music found
              </h3>

              <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
                {youtubeLoading ? "Searching YouTube and your uploaded library." : "Try another search or genre."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
            >
              {filteredSongs.map(
                (song, index) => {
                  const youtubeTrack = isYouTubeTrack(song);
                  const favorite = !youtubeTrack && isFavorite(song._id);

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
                      className={`song-card group relative rounded-[1.2rem] sm:rounded-[1.4rem] p-2.5 sm:p-4 cursor-pointer transition-all duration-300 ${
                        isHovered
                          ? pressed
                          : raised
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-4">

                        {/* INDEX */}

                        <div className="hidden sm:flex w-9 shrink-0 items-center justify-center">
                          <span className="text-[10px] text-[var(--theme-text-muted)]/50 font-mono">
                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>
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

                          <div className="absolute inset-0 pointer-events-none shadow-[inset_3px_3px_7px_var(--theme-shadow-dark),inset_-2px_-2px_5px_var(--theme-shadow-light)]" />
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
                                  className="text-[var(--theme-text-muted)]"
                                />
                              </div>
                            )}

                            <span className="text-xs text-[var(--theme-text-muted)] truncate">
                              {
                                artistName
                              }
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {youtubeTrack && (
                              <span className={`px-2.5 py-1 rounded-md text-[8px] uppercase tracking-wider text-[var(--theme-secondary)] ${pressed}`}>
                                YouTube
                              </span>
                            )}
                            {song.genre && !youtubeTrack && (
                              <span
                                className={`px-2.5 py-1 rounded-md text-[8px] uppercase tracking-wider text-[var(--theme-text-muted)] ${pressed}`}
                              >
                                {
                                  song.genre
                                }
                              </span>
                            )}

                            {song.album &&
                              typeof song.album ===
                                "string" && (
                                <span className="text-[9px] text-[var(--theme-text-muted)]/50 truncate">
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
                            disabled={favoriteBusy || youtubeTrack}
                            onClick={(e) =>
                              toggleFavorite(song._id, e)
                            }
                            className={`favorite-button w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              favorite ? "is-favorite" : ""
                            } ${favoriteBusy ? "is-loading" : ""}`}
                            title={
                              youtubeTrack
                                ? "Favorites are available for uploaded songs"
                                : favoriteBusy
                                  ? "Updating favorite..."
                                  : favorite
                                    ? "Remove favorite"
                                    : "Add favorite"
                            }
                            aria-label={
                              youtubeTrack
                                ? "Favorites are available for uploaded songs"
                                : favoriteBusy
                                  ? "Updating favorite"
                                  : favorite
                                    ? "Remove favorite"
                                    : "Add favorite"
                            }
                            aria-busy={favoriteBusy}
                          >
                            {favoriteBusy ? (
                              <RefreshCw
                                size={16}
                                className="favorite-spinner"
                                aria-hidden="true"
                              />
                            ) : (
                              <Heart
                                size={15}
                                className={
                                  favorite
                                    ? "favorite-heart-active"
                                    : ""
                                }
                                fill={favorite ? "currentColor" : "none"}
                                aria-hidden="true"
                              />
                            )}
                          </button>

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
                                ? "bg-[var(--theme-primary)] text-[var(--theme-background)] shadow-[5px_5px_10px_var(--theme-shadow-dark)]"
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
                            className="h-full rounded-full bg-[var(--theme-primary)]/60"
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

                <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mt-1">
                  {statistics.songs} songs ·{" "}
                  {statistics.artists} artists
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[var(--theme-text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)] shadow-[0_0_8px_var(--theme-glow-primary)]" />

              Audio system active
            </div>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
};

export default Collection;
