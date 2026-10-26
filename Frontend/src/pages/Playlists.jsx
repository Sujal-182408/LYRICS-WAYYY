import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Pencil,
  Trash2,
  Music2,
  X,
  Lock,
  Globe,
  RefreshCw,
  ListMusic,
  ChevronRight,
  ImagePlus,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  getMyPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} from "../services/playlistService";

/*
 * LYRICS WAYYY — Playlists
 * Uses the existing ThemeContext and themes.js configuration.
 * No duplicate theme state, selector, observer, or persistence logic.
 */

const makeShadows = (theme) => ({
  raised: `9px 9px 18px ${theme.darkShadow}, -9px -9px 18px ${theme.lightShadow}`,
  raisedSmall: `5px 5px 12px ${theme.darkShadow}, -5px -5px 12px ${theme.lightShadow}`,
  pressed: `inset 6px 6px 12px ${theme.darkShadow}, inset -6px -6px 12px ${theme.lightShadow}`,
  pressedSmall: `inset 4px 4px 8px ${theme.darkShadow}, inset -4px -4px 8px ${theme.lightShadow}`,
});

const getMediaUrl = (path) => {
  if (!path || typeof path !== "string") return "";
  if (/^(https?:\/\/|data:image\/)/i.test(path)) return path;

  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return apiUrl ? `${apiUrl}/${cleanPath}` : `/${cleanPath}`;
};

const getSongCount = (playlist) => {
  if (Array.isArray(playlist?.songs)) return playlist.songs.length;
  if (typeof playlist?.songCount === "number") return playlist.songCount;
  return 0;
};

export default function Playlists() {
  const navigate = useNavigate();
  const { theme: activeTheme } = useTheme();
  const colors = activeTheme?.colors || {};

  // Adapt the existing theme schema to the page's neumorphic design tokens.
  // These values update automatically whenever ThemeContext changes.
  const theme = useMemo(() => ({
    base: colors.background || "#15181D",
    surface: colors.surface || "#252933",
    insetSurface: colors.surfaceLight || colors.surface || "#2A3543",
    lightShadow: colors.shadowLight || colors.surfaceLight || "#2A3543",
    darkShadow: colors.shadowDark || "#0F141A",
    accent: colors.primary || "#8C7CF7",
    teal: colors.secondary || "#2BD4C4",
    text: colors.text || "#D9DCE8",
    muted: colors.textMuted || "#858B9A",
    soft: colors.textMuted || "#AEB5C2",
    danger: colors.danger || "#FF6B6B",
    overlay: colors.overlay || "rgba(15,20,26,0.72)",
    border: colors.border || "rgba(255,255,255,0.04)",
    hover: colors.hover || "#303647",
    active: colors.active || "#343B4D",
    gradient: colors.gradient || "linear-gradient(135deg, #8C7CF7 0%, #665DE8 45%, #2BD4C4 100%)",
    glowPrimary: colors.glowPrimary || "rgba(140,124,247,0.35)",
    glowSecondary: colors.glowSecondary || "rgba(43,212,196,0.30)",
    success: colors.success || "#2BD4C4",
    warning: colors.warning || "#F5B942",
    info: colors.info || "#6EA8FE",
    textDark: colors.textDark || "#15181D",
  }), [colors]);

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    visibility: "private",
    coverImage: "",
  });
  const [coverPreview, setCoverPreview] = useState("");
  const [coverError, setCoverError] = useState("");
  const [coverProcessing, setCoverProcessing] = useState(false);

  const shadows = useMemo(() => makeShadows(theme), [theme]);

  const raised = { boxShadow: shadows.raised };
  const raisedSmall = { boxShadow: shadows.raisedSmall };
  const pressed = { boxShadow: shadows.pressed };
  const pressedSmall = { boxShadow: shadows.pressedSmall };

  const fetchPlaylists = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      setError("");

      const response = await getMyPlaylists();
      if (!response?.success) {
        throw new Error(response?.message || "Failed to load playlists");
      }

      setPlaylists(Array.isArray(response.playlists) ? response.playlists : []);
    } catch (err) {
      console.error("PLAYLIST FETCH ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load playlists",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const filteredPlaylists = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return playlists;

    return playlists.filter((playlist) => {
      return (
        playlist.name?.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query)
      );
    });
  }, [playlists, search]);

  const resetForm = () => {
    setForm({ name: "", description: "", visibility: "private", coverImage: "" });
    setCoverPreview("");
    setCoverError("");
    setCoverProcessing(false);
  };

  // Compress gallery images before saving them as coverImage.
  // This keeps the existing playlist service/API contract unchanged.
  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCoverError("");
    if (!file.type.startsWith("image/")) {
      setCoverError("Choose a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCoverError("Choose an image smaller than 10 MB.");
      return;
    }

    setCoverProcessing(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setCoverProcessing(false);
      setCoverError("Unable to read this image. Please try another one.");
    };
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => {
        setCoverProcessing(false);
        setCoverError("This image could not be opened.");
      };
      image.onload = () => {
        try {
          const maxSize = 900;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Image processing is not supported by this browser.");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.68);
          if (dataUrl.length > 900_000) {
            throw new Error("This image is still too large after compression. Choose a smaller image.");
          }
          setForm((previous) => ({ ...previous, coverImage: dataUrl }));
          setCoverPreview(dataUrl);
          setCoverProcessing(false);
        } catch (error) {
          setCoverProcessing(false);
          setCoverError(error?.message || "Unable to process this image.");
        }
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverPreview("");
    setCoverError("");
    setForm((previous) => ({ ...previous, coverImage: "" }));
  };

  const openCreate = () => {
    resetForm();
    setEditingPlaylist(null);
    setShowCreate(true);
    setError("");
  };

  const openEdit = (playlist) => {
    resetForm();
    setEditingPlaylist(playlist);
    setForm({
      name: playlist.name || "",
      description: playlist.description || "",
      visibility: playlist.visibility || "private",
      coverImage: playlist.coverImage || "",
    });
    setCoverPreview(playlist.coverImage ? getMediaUrl(playlist.coverImage) : "");
    setShowCreate(true);
    setMenuId(null);
    setError("");
  };

  const closeModal = () => {
    if (saving) return;
    setShowCreate(false);
    setEditingPlaylist(null);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || saving) return;

    try {
      setSaving(true);
      setError("");

      if (editingPlaylist) {
        const response = await updatePlaylist(editingPlaylist._id, {
          ...form,
          name: form.name.trim(),
        });

        if (!response?.success) {
          throw new Error(response?.message || "Failed to update playlist");
        }

        setPlaylists((previous) =>
          previous.map((playlist) =>
            playlist._id === editingPlaylist._id
              ? response.playlist
              : playlist,
          ),
        );
      } else {
        const response = await createPlaylist({
          ...form,
          name: form.name.trim(),
        });

        if (!response?.success) {
          throw new Error(response?.message || "Failed to create playlist");
        }

        setPlaylists((previous) => [response.playlist, ...previous]);
      }

      setShowCreate(false);
      setEditingPlaylist(null);
      resetForm();
    } catch (err) {
      console.error("SAVE PLAYLIST ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save playlist",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlist) => {
    setMenuId(null);

    if (!window.confirm(`Delete "${playlist.name}"?`)) return;

    try {
      setError("");
      const response = await deletePlaylist(playlist._id);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete playlist");
      }

      setPlaylists((previous) =>
        previous.filter((item) => item._id !== playlist._id),
      );
    } catch (err) {
      console.error("DELETE PLAYLIST ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete playlist",
      );
    }
  };

  const pageStyle = {
    "--playlist-bg": theme.base,
    "--playlist-surface": theme.surface,
    "--playlist-inset": theme.insetSurface,
    "--playlist-text": theme.text,
    "--playlist-muted": theme.muted,
    "--playlist-soft": theme.soft,
    "--playlist-accent": theme.accent,
    "--playlist-teal": theme.teal,
    "--playlist-danger": theme.danger,
    "--playlist-light-shadow": theme.lightShadow,
    "--playlist-dark-shadow": theme.darkShadow,
    "--playlist-border": theme.border,
    "--playlist-hover": theme.hover,
    "--playlist-active": theme.active,
    "--playlist-gradient": theme.gradient,
    "--playlist-glow-primary": theme.glowPrimary,
    "--playlist-glow-secondary": theme.glowSecondary,
    "--playlist-success": theme.success,
    "--playlist-warning": theme.warning,
    "--playlist-info": theme.info,
    "--playlist-text-dark": theme.textDark,
    background: theme.base,
    color: theme.text,
    minHeight: "100vh",
    transition: "background-color 280ms ease, color 280ms ease",
  };

  const surfaceStyle = {
    background: theme.surface,
    transition: "background-color 280ms ease, color 280ms ease, box-shadow 280ms ease, border-color 280ms ease",
  };

  const inputStyle = {
    background: theme.surface,
    color: theme.text,
    caretColor: theme.accent,
    transition: "background-color 280ms ease, color 280ms ease, box-shadow 280ms ease",
  };

  if (loading) {
    return (
      <div className="playlist-page flex min-h-screen items-center justify-center px-4" style={pageStyle}>
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ ...surfaceStyle, ...raised }}
        >
          <RefreshCw size={27} className="animate-spin" style={{ color: theme.accent }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="playlist-page min-h-screen px-4 py-6 sm:px-6 md:px-8"
      style={pageStyle}
      onClick={() => setMenuId(null)}
    >
      <style>{`
        .playlist-page, .playlist-page * {
          box-sizing: border-box;
        }
        .playlist-page button, .playlist-page input, .playlist-page textarea {
          -webkit-tap-highlight-color: transparent;
        }
        .playlist-page button:focus-visible,
        .playlist-page input:focus-visible,
        .playlist-page textarea:focus-visible {
          outline: 2px solid var(--playlist-accent);
          outline-offset: 3px;
        }
        .playlist-page .theme-transition {
          transition: background-color 280ms ease, color 280ms ease, box-shadow 280ms ease, border-color 280ms ease, transform 220ms ease;
        }
        .playlist-page .playlist-card:hover {
          transform: translateY(-4px);
        }
        .playlist-page .playlist-image {
          background: var(--playlist-inset);
        }
        .playlist-page .playlist-wave {
          animation: playlist-wave 1.3s ease-in-out infinite alternate;
          transform-origin: bottom;
        }
        .playlist-page .playlist-wave:nth-child(2n) { animation-delay: -0.4s; }
        .playlist-page .playlist-wave:nth-child(3n) { animation-delay: -0.8s; }
        @keyframes playlist-wave {
          from { transform: scaleY(.65); opacity: .5; }
          to { transform: scaleY(1.15); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .playlist-page *, .playlist-page *::before, .playlist-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="mx-auto mt-25 w-full max-w-7xl">
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div
                className="theme-transition flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 sm:rounded-[1.4rem]"
                style={{ ...surfaceStyle, ...raised }}
              >
                <ListMusic size={28} style={{ color: theme.accent }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                  Your Playlists
                </h1>
                <p className="mt-1 text-sm sm:text-base" style={{ color: theme.muted }}>
                  Your music. Your mood. Your playlists.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="theme-transition inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl px-5 py-3 font-bold active:scale-[.98] sm:w-auto sm:px-6"
              style={{ ...surfaceStyle, ...raised, color: theme.text }}
            >
              <span
                className="theme-transition flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ ...surfaceStyle, ...pressedSmall }}
              >
                <Plus size={17} style={{ color: theme.teal }} />
              </span>
              Create Playlist
            </button>
          </div>

          <div className="mt-6 flex gap-3 sm:mt-7">
            <div
              className="theme-transition relative min-w-0 flex-1 rounded-2xl"
              style={{ ...surfaceStyle, ...pressed }}
            >
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 sm:left-5"
                style={{ color: theme.muted }}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your playlists..."
                aria-label="Search your playlists"
                className="w-full border-none bg-transparent py-4 pl-11 pr-11 text-base outline-none sm:pl-14"
                style={{ color: theme.text, caretColor: theme.accent }}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl"
                  style={{ color: theme.muted }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label="Refresh playlists"
              onClick={() => fetchPlaylists(false)}
              disabled={refreshing}
              className="theme-transition flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl disabled:opacity-60"
              style={{ ...surfaceStyle, ...raised }}
            >
              <RefreshCw
                size={19}
                className={refreshing ? "animate-spin" : ""}
                style={{ color: theme.muted }}
              />
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="theme-transition mb-7 rounded-2xl px-4 py-4 text-sm sm:px-5"
            style={{ ...surfaceStyle, ...pressed, color: theme.danger }}
          >
            {error}
          </div>
        )}

        {filteredPlaylists.length === 0 ? (
          <div
            className="theme-transition rounded-[2rem] p-7 text-center sm:p-12 md:rounded-[2.5rem] md:p-20"
            style={{ ...surfaceStyle, ...raised }}
          >
            <div
              className="theme-transition mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.7rem] sm:h-24 sm:w-24"
              style={{ ...surfaceStyle, ...pressed }}
            >
              <ListMusic size={38} style={{ color: theme.accent }} />
            </div>
            <h2 className="mb-2 text-xl font-black sm:text-2xl">
              {search ? "No playlists found" : "Create your first playlist"}
            </h2>
            <p className="mx-auto max-w-md text-sm leading-6" style={{ color: theme.muted }}>
              {search
                ? "Try another playlist name or description."
                : "Build your own collection of songs and make every listening session yours."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreate}
                className="theme-transition mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold active:scale-[.98]"
                style={{ ...surfaceStyle, ...raised }}
              >
                <Plus size={18} style={{ color: theme.teal }} />
                Create Playlist
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlaylists.map((playlist) => {
              const songCount = getSongCount(playlist);
              const isPublic = playlist.visibility === "public";
              const coverUrl = getMediaUrl(playlist.coverImage);

              return (
                <article
                  key={playlist._id}
                  className="playlist-card theme-transition group relative min-w-0 cursor-pointer rounded-[1.8rem] p-4 sm:rounded-[2rem] sm:p-5"
                  style={{ ...surfaceStyle, ...raised }}
                  onClick={() => navigate(`/playlists/${playlist._id}`)}
                >
                  <div
                    className="playlist-image theme-transition relative aspect-square overflow-hidden rounded-[1.4rem] sm:rounded-[1.6rem]"
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`${playlist.name} cover`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="theme-transition flex h-28 w-28 items-center justify-center rounded-full sm:h-36 sm:w-36"
                        style={{ ...surfaceStyle, ...raised }}
                      >
                        <div
                          className="theme-transition flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24"
                          style={{ ...surfaceStyle, ...pressed }}
                        >
                          <ListMusic size={38} strokeWidth={1.7} style={{ color: theme.accent }} />
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-end gap-1 opacity-70" aria-hidden="true">
                      {[12, 24, 16, 28, 13].map((height, index) => (
                        <span
                          key={index}
                          className="playlist-wave w-1 rounded-full"
                          style={{
                            height,
                            background: index % 2 ? theme.accent : theme.teal,
                          }}
                        />
                      ))}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                      <div
                        className="theme-transition flex h-14 w-14 items-center justify-center rounded-full"
                        style={{ ...surfaceStyle, ...raised, color: theme.teal }}
                      >
                        <Play size={22} fill="currentColor" />
                      </div>
                    </div>

                    <div
                      className="theme-transition absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ ...surfaceStyle, ...raisedSmall }}
                      aria-label={isPublic ? "Public playlist" : "Private playlist"}
                    >
                      {isPublic ? (
                        <Globe size={16} style={{ color: theme.teal }} />
                      ) : (
                        <Lock size={16} style={{ color: theme.accent }} />
                      )}
                    </div>

                    <div
                      className="absolute right-3 top-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Options for ${playlist.name}`}
                        aria-expanded={menuId === playlist._id}
                        onClick={() => setMenuId((current) => current === playlist._id ? null : playlist._id)}
                        className="theme-transition flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ ...surfaceStyle, ...raisedSmall, color: theme.soft }}
                      >
                        <MoreVertical size={17} />
                      </button>

                      {menuId === playlist._id && (
                        <div
                          className="theme-transition absolute right-0 z-30 mt-3 w-48 rounded-2xl p-2"
                          style={{ ...surfaceStyle, ...raised }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEdit(playlist)}
                            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold"
                            style={{ color: theme.text }}
                          >
                            <Pencil size={16} style={{ color: theme.accent }} />
                            Edit playlist
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(playlist)}
                            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold"
                            style={{ color: theme.danger }}
                          >
                            <Trash2 size={16} />
                            Delete playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-1 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black">{playlist.name}</h3>
                        <p className="mt-1 truncate text-sm" style={{ color: theme.muted }}>
                          {playlist.description || "No description"}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-1 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
                        style={{ color: theme.teal }}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div
                        className="theme-transition flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{ ...surfaceStyle, ...pressedSmall }}
                      >
                        <Music2 size={13} style={{ color: theme.teal }} />
                        <span className="text-xs font-bold" style={{ color: theme.soft }}>
                          {songCount} {songCount === 1 ? "song" : "songs"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: isPublic ? theme.teal : theme.muted }}>
                        {isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{ background: theme.overlay, backdropFilter: "blur(8px)" }}
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-modal-title"
            className="theme-transition max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] p-5 sm:max-w-lg sm:rounded-[2.2rem] sm:p-7 md:p-8"
            style={{ ...surfaceStyle, ...raised }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4 sm:mb-7">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="theme-transition flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ ...surfaceStyle, ...pressedSmall }}
                  >
                    <ListMusic size={19} style={{ color: theme.accent }} />
                  </div>
                  <h2 id="playlist-modal-title" className="text-xl font-black sm:text-2xl">
                    {editingPlaylist ? "Edit Playlist" : "Create Playlist"}
                  </h2>
                </div>
                <p className="mt-3 text-sm" style={{ color: theme.muted }}>
                  {editingPlaylist
                    ? "Update your playlist details."
                    : "Create a space for your favorite music."}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close dialog"
                onClick={closeModal}
                className="theme-transition flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ ...surfaceStyle, ...raisedSmall, color: theme.soft }}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="playlist-name" className="mb-2 block text-sm font-bold">
                  Playlist name
                </label>
                <input
                  id="playlist-name"
                  type="text"
                  value={form.name}
                  maxLength={100}
                  required
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="My Night Vibes"
                  className="theme-transition w-full rounded-2xl px-4 py-4 outline-none"
                  style={{ ...inputStyle, ...pressed }}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="playlist-description" className="mb-2 block text-sm font-bold">
                  Description
                </label>
                <textarea
                  id="playlist-description"
                  value={form.description}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder="What kind of mood is this playlist?"
                  className="theme-transition w-full resize-none rounded-2xl px-4 py-4 outline-none"
                  style={{ ...inputStyle, ...pressed }}
                />
              </div>

              <div>
                <p className="mb-2 block text-sm font-bold">Visibility</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, visibility: "private" }))}
                    aria-pressed={form.visibility === "private"}
                    className="theme-transition rounded-2xl p-4 text-left active:scale-[.98]"
                    style={{
                      ...surfaceStyle,
                      ...(form.visibility === "private" ? pressed : raisedSmall),
                    }}
                  >
                    <Lock size={19} style={{ color: theme.accent }} />
                    <div className="mt-3 font-bold">Private</div>
                    <div className="mt-1 text-xs" style={{ color: theme.muted }}>Only you</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, visibility: "public" }))}
                    aria-pressed={form.visibility === "public"}
                    className="theme-transition rounded-2xl p-4 text-left active:scale-[.98]"
                    style={{
                      ...surfaceStyle,
                      ...(form.visibility === "public" ? pressed : raisedSmall),
                    }}
                  >
                    <Globe size={19} style={{ color: theme.teal }} />
                    <div className="mt-3 font-bold">Public</div>
                    <div className="mt-1 text-xs" style={{ color: theme.muted }}>Share with everyone</div>
                  </button>
                </div>
              </div>

              {/* PLAYLIST COVER — CHOOSE FROM DEVICE GALLERY */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Playlist Cover</p>
                    <p className="mt-1 text-xs" style={{ color: theme.muted }}>
                      Choose an image from your gallery (optional).
                    </p>
                  </div>
                  {coverPreview && (
                    <button
                      type="button"
                      onClick={removeCover}
                      className="flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
                      style={{ background: theme.surface, color: theme.danger, boxShadow: shadows.raisedSmall }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="rounded-3xl p-4 sm:p-5" style={{ background: theme.surface, boxShadow: shadows.pressed, border: `1px solid ${theme.border}` }}>
                  <div className="relative mx-auto mb-5 flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-2xl" style={{ background: theme.insetSurface, boxShadow: shadows.raisedSmall }}>
                    {coverPreview ? (
                      <img src={coverPreview} alt="Playlist cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-5 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: theme.surface, boxShadow: shadows.raised }}>
                          <ListMusic size={36} style={{ color: theme.accent }} />
                        </div>
                        <p className="text-sm font-semibold" style={{ color: theme.muted }}>No cover selected</p>
                      </div>
                    )}
                    {coverPreview && <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: theme.surface, boxShadow: shadows.raisedSmall }}><ImagePlus size={18} style={{ color: theme.teal }} /></div>}
                  </div>

                  <input id="playlist-cover-file" type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  <label htmlFor="playlist-cover-file" className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 font-bold ${coverProcessing ? "cursor-wait opacity-60" : "cursor-pointer active:scale-[.98]"}`} style={{ background: theme.surface, color: theme.text, boxShadow: shadows.raised, border: `1px solid ${theme.border}` }}>
                    <Upload size={19} style={{ color: theme.accent }} />
                    {coverProcessing ? "Preparing image…" : coverPreview ? "Change Cover Image" : "Choose from Gallery"}
                  </label>
                  <p className="mt-3 text-center text-xs" style={{ color: theme.muted }}>Image files · Up to 10 MB before compression</p>
                  {coverError && <p role="alert" className="mt-3 text-center text-sm font-medium" style={{ color: theme.danger }}>{coverError}</p>}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="theme-transition min-h-12 flex-1 rounded-2xl py-3.5 font-bold active:scale-[.98] disabled:opacity-50"
                  style={{ ...surfaceStyle, ...raisedSmall, color: theme.soft }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || coverProcessing || !form.name.trim()}
                  className="theme-transition min-h-12 flex-1 rounded-2xl py-3.5 font-bold active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ ...surfaceStyle, ...raisedSmall, color: theme.text }}
                >
                  {coverProcessing ? "Preparing image..." : saving ? "Saving..." : editingPlaylist ? "Save Changes" : "Create Playlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
