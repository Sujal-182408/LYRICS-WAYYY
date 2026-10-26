
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ListMusic,
  Music2,
  Search,
  Check,
  Loader2,
  Sparkles,
  Disc3,
  ArrowLeft,
} from "lucide-react";

import {
  getMyPlaylists,
  addSongToPlaylist,
  createPlaylist,
} from "../../services/playlistService";

import { BASE_URL } from "../../config/api";

// =====================================================
// PREMIUM DARK NEUMORPHIC THEME
// =====================================================

const raised =
  "bg-[#15181d] border border-[#252b35] " +
  "shadow-[7px_7px_15px_rgba(0,0,0,.65),-5px_-5px_12px_rgba(168,178,198,.04)]";

const pressed =
  "bg-[#15181d] border border-[#252b35] " +
  "shadow-[inset_5px_5px_10px_rgba(0,0,0,.65),inset_-4px_-4px_9px_rgba(168,178,198,.035)]";

const smallRaised =
  "bg-[#15181d] border border-[#252b35] " +
  "shadow-[4px_4px_9px_rgba(0,0,0,.65),-3px_-3px_8px_rgba(168,178,198,.035)]";

// =====================================================
// RESPONSE HELPERS
// =====================================================

const getPlaylistArray = (response) => {
  const candidates = [
    response,
    response?.playlists,
    response?.data,
    response?.data?.playlists,
    response?.data?.data,
    response?.data?.data?.playlists,
  ];

  return candidates.find(Array.isArray) || [];
};

const unwrapPlaylist = (response) => {
  return (
    response?.playlist ||
    response?.data?.playlist ||
    response?.data?.data?.playlist ||
    response?.data?.data ||
    response?.data ||
    response
  );
};

// =====================================================
// SONG HELPERS
// =====================================================

const getSongTitle = (song) =>
  song?.title || song?.name || "Unknown Song";

const getArtistName = (song) => {
  if (!song?.artist) return "Unknown Artist";

  if (typeof song.artist === "string") {
    return song.artist;
  }

  return (
    song.artist?.name ||
    song.artist?.artistName ||
    song.artist?.username ||
    "Unknown Artist"
  );
};

// =====================================================
// COVER URL HELPER
// =====================================================

const getSongCover = (song) => {
  const cover =
    song?.coverImage ||
    song?.image ||
    song?.album?.coverImage ||
    song?.album?.image ||
    song?.artist?.image ||
    "";

  if (!cover || typeof cover !== "string") {
    return "/image/default-cover.jpg";
  }

  const normalized = cover
    .trim()
    .replace(/\\/g, "/")
    .replace(/^["']|["']$/g, "");

  if (
    /^(https?:\/\/|data:|blob:)/i.test(normalized)
  ) {
    return normalized;
  }

  const cleanPath = normalized.replace(/^\/+/, "");

  return `${BASE_URL.replace(/\/+$/, "")}/${cleanPath}`;
};

// =====================================================
// PLAYLIST SONG COUNT
// =====================================================

const getSongCount = (playlist) => {
  if (Array.isArray(playlist?.songs)) {
    return playlist.songs.length;
  }

  if (typeof playlist?.songCount === "number") {
    return playlist.songCount;
  }

  if (typeof playlist?.songsCount === "number") {
    return playlist.songsCount;
  }

  return 0;
};

// =====================================================
// COMPONENT
// =====================================================

export default function AddToPlaylistButton({
  song,
  className = "",
  size = "default",
}) {
  // ===================================================
  // STATE
  // ===================================================

  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [addedPlaylistId, setAddedPlaylistId] = useState(null);

  // ===================================================
  // MESSAGE HELPER
  // ===================================================

  const showFeedback = useCallback((text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  // ===================================================
  // LOAD PLAYLISTS
  // ===================================================

  const loadPlaylists = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getMyPlaylists();
      const playlistData = getPlaylistArray(response);

      setPlaylists(playlistData);

      return playlistData;
    } catch (error) {
      console.error("FAILED TO LOAD PLAYLISTS:", {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      showFeedback(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to load playlists.",
        "error"
      );

      return [];
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  // ===================================================
  // OPEN POPUP
  // ===================================================

  const handleOpen = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    setOpen(true);
    setSearch("");
    setMessage("");
    setMessageType("success");
    setAddedPlaylistId(null);
    setShowCreateForm(false);
    setPlaylistName("");
    setPlaylistDescription("");

    await loadPlaylists();
  };

  // ===================================================
  // CLOSE POPUP
  // ===================================================

  const handleClose = useCallback(() => {
    if (addingId || creatingPlaylist) return;

    setOpen(false);
    setSearch("");
    setMessage("");
    setAddedPlaylistId(null);
    setShowCreateForm(false);
    setPlaylistName("");
    setPlaylistDescription("");
  }, [addingId, creatingPlaylist]);

  // ===================================================
  // ESCAPE KEY
  // ===================================================

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleClose]);

  // ===================================================
  // PREVENT BACKGROUND SCROLL
  // ===================================================

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // ===================================================
  // FILTER PLAYLISTS
  // ===================================================

  const filteredPlaylists = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return playlists;

    return playlists.filter((playlist) => {
      const name = String(
        playlist?.name || playlist?.title || ""
      ).toLowerCase();

      const description = String(
        playlist?.description || ""
      ).toLowerCase();

      return (
        name.includes(value) ||
        description.includes(value)
      );
    });
  }, [playlists, search]);

  // ===================================================
  // ADD SONG TO EXISTING PLAYLIST
  // ===================================================

  const handleAddSong = async (playlistId, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!playlistId || !song?._id) {
      showFeedback(
        "Playlist or song information is missing.",
        "error"
      );
      return;
    }

    if (addingId || creatingPlaylist) return;

    try {
      setAddingId(playlistId);
      setAddedPlaylistId(null);
      setMessage("");

      const response = await addSongToPlaylist(
        playlistId,
        song._id
      );

      const playlist = playlists.find(
        (item) => item?._id === playlistId
      );

      const name =
        playlist?.name ||
        playlist?.title ||
        "playlist";

      setAddedPlaylistId(playlistId);

      showFeedback(
        response?.message ||
          response?.data?.message ||
          `"${getSongTitle(song)}" added to "${name}".`,
        "success"
      );

      // Reflect the addition in local state.
      setPlaylists((current) =>
        current.map((item) => {
          if (item?._id !== playlistId) return item;

          const songs = Array.isArray(item.songs)
            ? item.songs
            : [];

          const alreadyPresent = songs.some(
            (entry) =>
              String(
                typeof entry === "string"
                  ? entry
                  : entry?._id
              ) === String(song._id)
          );

          if (alreadyPresent) {
            return item;
          }

          return {
            ...item,
            songs: [...songs, song],
            songCount: songs.length + 1,
          };
        })
      );
    } catch (error) {
      console.error("FAILED TO ADD SONG TO PLAYLIST:", {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      showFeedback(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to add song to playlist.",
        "error"
      );
    } finally {
      setAddingId(null);
    }
  };

  // ===================================================
  // CREATE PLAYLIST AND ADD CURRENT SONG
  // ===================================================

 const handleCreatePlaylist = async (event) => {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const name = playlistName.trim();
  const description = playlistDescription.trim();

  if (!name) {
    showFeedback("Please enter a playlist name.", "error");
    return;
  }

  if (!song?._id) {
    showFeedback("Unable to identify the current song.", "error");
    return;
  }

  if (creatingPlaylist || addingId) return;

  let createdPlaylist = null;

  try {
    setCreatingPlaylist(true);
    setMessage("");

    // Step 1: Create the playlist.
    const response = await createPlaylist({
      name,
      description,
      visibility: "private",
    });

    console.log("CREATE PLAYLIST RESPONSE:", response);

    // Support services returning either Axios responses or response data.
    const payload = response?.data ?? response;

    const newPlaylist =
      payload?.playlist ??
      payload?.data?.playlist ??
      payload?.data ??
      payload;

    if (!newPlaylist?._id) {
      console.error("Unexpected playlist response:", response);

      throw new Error(
        payload?.message ||
          "The server did not return a valid playlist ID."
      );
    }

    createdPlaylist = {
      ...newPlaylist,
      songs: Array.isArray(newPlaylist.songs)
        ? newPlaylist.songs
        : [],
    };

    // Add the newly created playlist to the UI immediately.
    setPlaylists((current) => [
      createdPlaylist,
      ...current.filter(
        (item) =>
          String(item?._id) !== String(createdPlaylist._id)
      ),
    ]);

    // Step 2: Add the current song.
    try {
      await addSongToPlaylist(
        createdPlaylist._id,
        song._id
      );

      setPlaylists((current) =>
        current.map((item) => {
          if (
            String(item?._id) !==
            String(createdPlaylist._id)
          ) {
            return item;
          }

          const existingSongs = Array.isArray(item.songs)
            ? item.songs
            : [];

          const alreadyPresent = existingSongs.some(
            (entry) => {
              const entryId =
                typeof entry === "string"
                  ? entry
                  : entry?._id;

              return String(entryId) === String(song._id);
            }
          );

          return {
            ...item,
            songs: alreadyPresent
              ? existingSongs
              : [...existingSongs, song],
            songCount: alreadyPresent
              ? existingSongs.length
              : existingSongs.length + 1,
          };
        })
      );

      setAddedPlaylistId(createdPlaylist._id);

      showFeedback(
        `"${getSongTitle(song)}" added to "${name}".`,
        "success"
      );
    } catch (addError) {
      console.error("PLAYLIST CREATED, BUT SONG ADDITION FAILED:", {
        message: addError?.message,
        status: addError?.response?.status,
        response: addError?.response?.data,
      });

      showFeedback(
        `Playlist "${name}" was created, but the song could not be added.`,
        "error"
      );
    }

    setPlaylistName("");
    setPlaylistDescription("");
    setShowCreateForm(false);
  } catch (error) {
    console.error("FAILED TO CREATE PLAYLIST:", {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
      endpoint: error?.config?.url,
    });

    showFeedback(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to create playlist.",
      "error"
    );
  } finally {
    setCreatingPlaylist(false);
  }
};
  // ===================================================
  // BUTTON SIZE
  // ===================================================

  const buttonSize =
    size === "small"
      ? "h-9 w-9"
      : size === "large"
        ? "h-12 w-12"
        : "h-10 w-10";

  const iconSize =
    size === "small"
      ? 15
      : size === "large"
        ? 20
        : 17;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* ADD TO PLAYLIST BUTTON */}
      <motion.button
        type="button"
        onClick={handleOpen}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        title="Add to Playlist"
        aria-label="Add to Playlist"
        className={`
          relative flex items-center justify-center
          rounded-xl text-[#bfc5d2]
          transition-all duration-200
          hover:text-[#a99cff]
          ${smallRaised}
          ${buttonSize}
          ${className}
        `}
      >
        <Plus size={iconSize} />

        <span className="
          absolute right-[5px] top-[5px]
          h-[4px] w-[4px] rounded-full
          bg-[#8c7cf7] opacity-80
        " />
      </motion.button>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="
              fixed inset-0 z-[9999]
              flex items-center justify-center p-4
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleClose();
              }
            }}
          >
            {/* BACKDROP */}
            <div className="
              absolute inset-0
              bg-black/75 backdrop-blur-[5px]
            " />

            {/* MODAL PANEL */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onMouseDown={(event) => event.stopPropagation()}
              className={`
                relative z-10 w-full max-w-[540px]
                max-h-[88vh] overflow-hidden rounded-[28px]
                ${raised}
              `}
              role="dialog"
              aria-modal="true"
              aria-labelledby="playlist-modal-title"
            >
              {/* HEADER */}
              <div className="
                flex items-center justify-between
                border-b border-[#252b35] px-5 py-4
              ">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="
                    flex h-11 w-11 shrink-0 items-center justify-center
                    rounded-2xl bg-[#15181d] text-[#9b8cff]
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,.7),inset_-4px_-4px_8px_rgba(168,178,198,.04)]
                  ">
                    <ListMusic size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="
                      text-[11px] font-medium uppercase
                      tracking-[0.22em] text-[#777f8f]
                    ">
                      Music Library
                    </p>

                    <h2
                      id="playlist-modal-title"
                      className="mt-0.5 text-lg font-semibold text-[#e7e9ee]"
                    >
                      Add to Playlist
                    </h2>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-xl text-[#7f8795] hover:text-[#e6e8ed]
                    ${smallRaised}
                  `}
                  aria-label="Close"
                >
                  <X size={17} />
                </motion.button>
              </div>

              {/* CONTENT */}
              <div className="
                custom-scrollbar max-h-[calc(88vh-76px)]
                overflow-y-auto px-5 py-5
              ">
                {/* CURRENT SONG */}
                <div className={`
                  flex items-center gap-3 rounded-2xl p-3
                  ${pressed}
                `}>
                  <div className="
                    relative h-12 w-12 shrink-0 overflow-hidden
                    rounded-xl bg-[#20242a]
                  ">
                    <img
                      src={getSongCover(song)}
                      alt={getSongTitle(song)}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        if (
                          event.currentTarget.dataset.fallbackApplied
                        ) {
                          return;
                        }

                        event.currentTarget.dataset.fallbackApplied = "true";
                        event.currentTarget.src = "/image/default-cover.jpg";
                      }}
                    />

                    <div className="
                      pointer-events-none absolute inset-0
                      bg-gradient-to-t from-black/30 to-transparent
                    " />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#e5e7eb]">
                      {getSongTitle(song)}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-[#7e8695]">
                      {getArtistName(song)}
                    </p>
                  </div>

                  <div className="ml-auto shrink-0 text-[#696f7c]">
                    <Disc3 size={18} />
                  </div>
                </div>

                {/* CREATE PLAYLIST */}
                <div className="mt-5">
                  {!showCreateForm ? (
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(true);
                        setMessage("");
                      }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className={`
                        flex w-full items-center gap-3
                        rounded-2xl p-3.5 text-left
                        transition-colors hover:border-[#665bb2]/40
                        ${raised}
                      `}
                    >
                      <div className="
                        flex h-10 w-10 shrink-0 items-center justify-center
                        rounded-xl bg-[#1b1e24] text-[#9b8cff]
                        shadow-[inset_3px_3px_7px_rgba(0,0,0,.65),inset_-3px_-3px_7px_rgba(168,178,198,.035)]
                      ">
                        <Plus size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#e0e3e8]">
                          Create New Playlist
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#707887]">
                          Create a playlist and add this song automatically
                        </p>
                      </div>

                      <Sparkles
                        size={16}
                        className="shrink-0 text-[#6f63c5]"
                      />
                    </motion.button>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreatePlaylist}
                      className={`overflow-hidden rounded-2xl p-4 ${pressed}`}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (creatingPlaylist) return;

                            setShowCreateForm(false);
                            setPlaylistName("");
                            setPlaylistDescription("");
                            setMessage("");
                          }}
                          disabled={creatingPlaylist}
                          className="
                            flex h-8 w-8 items-center justify-center
                            rounded-lg text-[#8c94a3]
                            hover:text-[#e4e6eb]
                            disabled:opacity-40
                          "
                          aria-label="Back to playlists"
                        >
                          <ArrowLeft size={17} />
                        </button>

                        <div>
                          <p className="text-sm font-semibold text-[#e4e6eb]">
                            New Playlist
                          </p>

                          <p className="text-[10px] text-[#707887]">
                            Your song will be added automatically
                          </p>
                        </div>
                      </div>

                      {/* NAME */}
                      <div>
                        <label
                          htmlFor="new-playlist-name"
                          className="
                            mb-2 block text-[11px] font-semibold
                            uppercase tracking-wider text-[#737b8a]
                          "
                        >
                          Playlist Name
                        </label>

                        <input
                          id="new-playlist-name"
                          type="text"
                          value={playlistName}
                          onChange={(event) =>
                            setPlaylistName(event.target.value)
                          }
                          placeholder="e.g. Late Night Vibes"
                          maxLength={100}
                          autoFocus
                          required
                          disabled={creatingPlaylist}
                          className="
                            w-full rounded-xl border border-[#252b35]
                            bg-[#15181d] px-4 py-3 text-base
                            text-[#e5e7eb] outline-none
                            placeholder:text-[#555d6b]
                            shadow-[inset_5px_5px_10px_rgba(0,0,0,.68),inset_-5px_-5px_10px_rgba(168,178,198,.035)]
                            transition-colors focus:border-[#665bb2]/60
                          "
                        />
                      </div>

                      {/* DESCRIPTION */}
                      <div className="mt-3">
                        <label
                          htmlFor="new-playlist-description"
                          className="
                            mb-2 block text-[11px] font-semibold
                            uppercase tracking-wider text-[#737b8a]
                          "
                        >
                          Description
                          <span className="
                            ml-1 font-normal normal-case tracking-normal
                            text-[#4f5663]
                          ">
                            optional
                          </span>
                        </label>

                        <textarea
                          id="new-playlist-description"
                          value={playlistDescription}
                          onChange={(event) =>
                            setPlaylistDescription(event.target.value)
                          }
                          placeholder="What kind of music belongs here?"
                          maxLength={500}
                          rows={3}
                          disabled={creatingPlaylist}
                          className="
                            w-full resize-none rounded-xl
                            border border-[#252b35] bg-[#15181d]
                            px-4 py-3 text-base text-[#e5e7eb]
                            outline-none placeholder:text-[#555d6b]
                            shadow-[inset_5px_5px_10px_rgba(0,0,0,.68),inset_-5px_-5px_10px_rgba(168,178,198,.035)]
                            transition-colors focus:border-[#665bb2]/60
                          "
                        />
                      </div>

                      {/* SUBMIT */}
                      <button
                        type="submit"
                        disabled={
                          creatingPlaylist || !playlistName.trim()
                        }
                        className="
                          mt-4 flex w-full items-center justify-center
                          gap-2 rounded-xl bg-[#7567d8] px-4 py-3
                          text-sm font-semibold text-white
                          shadow-[5px_5px_12px_rgba(0,0,0,.5),-4px_-4px_10px_rgba(168,178,198,.045)]
                          transition-colors hover:bg-[#8173e4]
                          disabled:cursor-not-allowed disabled:opacity-40
                        "
                      >
                        {creatingPlaylist ? (
                          <>
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={17} />
                            Create Playlist
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </div>

                {/* DIVIDER */}
                {!showCreateForm && (
                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#252b35]" />

                    <span className="
                      text-[10px] uppercase tracking-[0.18em]
                      text-[#535b68]
                    ">
                      Your Playlists
                    </span>

                    <div className="h-px flex-1 bg-[#252b35]" />
                  </div>
                )}

                {/* SEARCH AND PLAYLISTS */}
                {!showCreateForm && (
                  <>
                    <div className={`relative flex items-center rounded-xl ${pressed}`}>
                      <Search
                        size={16}
                        className="absolute left-4 text-[#606877]"
                      />

                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search playlists..."
                        aria-label="Search playlists"
                        className="
                          w-full bg-transparent py-3 pl-11 pr-10
                          text-base text-[#e3e5ea] outline-none
                          placeholder:text-[#555d6a]
                        "
                      />

                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="
                            absolute right-3 flex h-6 w-6
                            items-center justify-center rounded-md
                            text-[#686f7c] hover:text-[#d4d7dd]
                          "
                          aria-label="Clear search"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* PLAYLIST LIST */}
                    <div className="mt-4">
                      {loading ? (
                        <div className="
                          flex flex-col items-center justify-center
                          py-12 text-center
                        ">
                          <div className="
                            flex h-12 w-12 items-center justify-center
                            rounded-2xl bg-[#15181d] text-[#8c7cf7]
                            shadow-[inset_4px_4px_9px_rgba(0,0,0,.7),inset_-4px_-4px_9px_rgba(168,178,198,.04)]
                          ">
                            <Loader2
                              size={21}
                              className="animate-spin"
                            />
                          </div>

                          <p className="mt-3 text-xs text-[#707887]">
                            Loading your playlists...
                          </p>
                        </div>
                      ) : filteredPlaylists.length === 0 ? (
                        <div className="
                          flex flex-col items-center justify-center
                          px-5 py-10 text-center
                        ">
                          <div className="
                            flex h-14 w-14 items-center justify-center
                            rounded-2xl bg-[#15181d] text-[#626a78]
                            shadow-[inset_5px_5px_10px_rgba(0,0,0,.7),inset_-5px_-5px_10px_rgba(168,178,198,.035)]
                          ">
                            <ListMusic size={23} />
                          </div>

                          <h3 className="mt-4 text-sm font-semibold text-[#cfd2d9]">
                            {search ? "No playlists found" : "No playlists yet"}
                          </h3>

                          <p className="
                            mt-1.5 max-w-[280px] text-xs
                            leading-5 text-[#666e7c]
                          ">
                            {search
                              ? "Try another playlist name."
                              : "Create your first playlist and start building your music collection."}
                          </p>

                          {!search && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateForm(true);
                                setMessage("");
                              }}
                              className="
                                mt-4 flex items-center gap-2
                                rounded-xl bg-[#7567d8] px-4 py-2.5
                                text-xs font-semibold text-white
                                transition-colors hover:bg-[#8173e4]
                              "
                            >
                              <Plus size={15} />
                              Create Playlist
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {filteredPlaylists.map((playlist, index) => {
                            const playlistId = playlist?._id;

                            const name =
                              playlist?.name ||
                              playlist?.title ||
                              "Untitled Playlist";

                            const songCount = getSongCount(playlist);
                            const isAdding = addingId === playlistId;
                            const isAdded = addedPlaylistId === playlistId;

                            return (
                              <motion.div
                                key={playlistId || `${name}-${index}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.025 }}
                                className={`
                                  flex items-center gap-3 rounded-2xl
                                  border p-3 transition-all
                                  ${
                                    isAdded
                                      ? "border-[#2bd4c4]/30"
                                      : "border-[#252b35]"
                                  }
                                  ${raised}
                                `}
                              >
                                {/* ROUND NEUMORPHIC PLAYLIST ICON */}
                                <div className="
                                  relative flex h-12 w-12 shrink-0
                                  items-center justify-center rounded-full
                                  border border-[#252b35] bg-[#15181d]
                                  shadow-[6px_6px_12px_rgba(0,0,0,.72),-5px_-5px_10px_rgba(168,178,198,.045)]
                                ">
                                  <div className="
                                    absolute inset-[5px] rounded-full
                                    bg-[#181c23]
                                    shadow-[inset_4px_4px_8px_rgba(0,0,0,.65),inset_-3px_-3px_7px_rgba(168,178,198,.035)]
                                  " />

                                  <ListMusic
                                    size={21}
                                    strokeWidth={1.7}
                                    className="
                                      relative z-10 text-[#8c7cf7]
                                      drop-shadow-[0_0_6px_rgba(140,124,247,.25)]
                                    "
                                  />
                                </div>

                                {/* PLAYLIST DETAILS */}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-[#dfe2e8]">
                                    {name}
                                  </p>

                                  <div className="mt-1 flex items-center gap-1.5">
                                    <Music2
                                      size={11}
                                      className="text-[#636b79]"
                                    />

                                    <p className="text-[11px] text-[#686f7d]">
                                      {songCount}{" "}
                                      {songCount === 1 ? "song" : "songs"}
                                    </p>
                                  </div>
                                </div>

                                {/* ADD BUTTON */}
                                <motion.button
                                  type="button"
                                  onClick={(event) =>
                                    handleAddSong(playlistId, event)
                                  }
                                  disabled={
                                    isAdding ||
                                    isAdded ||
                                    creatingPlaylist ||
                                    !playlistId
                                  }
                                  whileHover={
                                    !isAdding && !isAdded
                                      ? { scale: 1.04 }
                                      : {}
                                  }
                                  whileTap={
                                    !isAdding && !isAdded
                                      ? { scale: 0.94 }
                                      : {}
                                  }
                                  title={isAdded ? "Added" : "Add song"}
                                  aria-label={`Add song to ${name}`}
                                  className={`
                                    flex h-10 w-10 shrink-0
                                    items-center justify-center rounded-xl
                                    transition-all disabled:cursor-default
                                    ${
                                      isAdded
                                        ? "border border-[#2bd4c4]/20 bg-[#16312f] text-[#2bd4c4]"
                                        : `text-[#969daa] hover:text-[#a99cff] ${smallRaised}`
                                    }
                                  `}
                                >
                                  {isAdding ? (
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : isAdded ? (
                                    <Check size={17} />
                                  ) : (
                                    <Plus size={18} />
                                  )}
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* STATUS MESSAGE */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      role="status"
                      aria-live="polite"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className={`
                        mt-4 flex items-start gap-2.5 rounded-xl
                        border px-3.5 py-3 text-xs
                        ${
                          messageType === "error"
                            ? "border-[#743845]/30 bg-[#2b1b20] text-[#e995a4]"
                            : "border-[#2bd4c4]/15 bg-[#152826] text-[#78d9cf]"
                        }
                      `}
                    >
                      {messageType === "error" ? (
                        <X
                          size={15}
                          className="mt-0.5 shrink-0"
                        />
                      ) : (
                        <Check
                          size={15}
                          className="mt-0.5 shrink-0"
                        />
                      )}

                      <span className="leading-5">{message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* FOOTER */}
                {!showCreateForm && (
                  <div className="
                    mt-5 flex items-center justify-center gap-2
                    text-[10px] text-[#4f5662]
                  ">
                    <Sparkles size={11} />
                    <span>Organize your music your way</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
