
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Music,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Music2,
  X,
  Loader2,
  Check,
  Disc3,
  Minus,
  RefreshCw,
  Users,
  AlertCircle,
  ImagePlus,
} from "lucide-react";
import { BASE_URL } from "../../config/api";

/* =========================================================
   THEME-AWARE NEUMORPHIC STYLES
   Uses the CSS variables supplied by your ThemeContext.
========================================================= */

const neuRaised = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "8px 8px 16px var(--theme-shadowDark), -8px -8px 16px var(--theme-shadowLight)",
};

const neuRaisedSmall = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "4px 4px 9px var(--theme-shadowDark), -4px -4px 9px var(--theme-shadowLight)",
};

const neuPressed = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 5px 5px 10px var(--theme-shadowDark), inset -5px -5px 10px var(--theme-shadowLight)",
};

const primaryText = { color: "var(--theme-primary)" };
const secondaryText = { color: "var(--theme-secondary)" };
const mutedText = { color: "var(--theme-textMuted)" };

const primaryButton = {
  background: "var(--theme-gradient)",
  color: "var(--theme-textDark)",
  border: "1px solid var(--theme-border)",
};

const BASE_URL_CLEAN = BASE_URL.replace(/\/+$/, "");

const getToken = () => localStorage.getItem("token");

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") return "";

  const imagePath = image.trim();

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${BASE_URL_CLEAN}/${imagePath.replace(/^\/+/, "")}`;
};

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

/* =========================================================
   REUSABLE BUTTON
========================================================= */

const NeuButton = ({
  children,
  className = "",
  style = {},
  type = "button",
  disabled = false,
  title,
  onClick,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    style={{ ...neuRaisedSmall, ...style }}
  >
    {children}
  </button>
);

/* =========================================================
   COLLECTIONS
========================================================= */

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    artist: "",
    visible: true,
    coverImage: "",
  });

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showSongsModal, setShowSongsModal] = useState(false);

  const [availableSongs, setAvailableSongs] = useState([]);
  const [songSearch, setSongSearch] = useState("");
  const [songsLoading, setSongsLoading] = useState(false);
  const [songAction, setSongAction] = useState("");

  /* =======================================================
     FETCH MY COLLECTIONS
  ======================================================= */

  const fetchCollections = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${BASE_URL_CLEAN}/api/collections/my`,
        authConfig(),
      );

      setCollections(response.data.collections || []);
    } catch (err) {
      console.error("GET MY COLLECTIONS ERROR:", err);
      setError(getErrorMessage(err, "Failed to load collections."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  /* =======================================================
     SEARCH COLLECTIONS
  ======================================================= */

  const filteredCollections = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return collections;

    return collections.filter((collection) =>
      [
        collection.name,
        collection.description,
        collection.artist?.name,
      ].some((field) => field?.toLowerCase().includes(value)),
    );
  }, [collections, search]);

  /* =======================================================
     CREATE COLLECTION
  ======================================================= */

  const openCreateModal = () => {
    setEditingCollection(null);

    setForm({
      name: "",
      description: "",
      artist: "",
      visible: true,
      coverImage: "",
    });

    setModalError("");
    setError("");
    setShowModal(true);
  };

  /* =======================================================
     EDIT COLLECTION
  ======================================================= */

  const openEditModal = (collection) => {
    setEditingCollection(collection);

    setForm({
      name: collection.name || "",
      description: collection.description || "",
      artist: collection.artist?._id || collection.artist || "",
      visible: collection.visible !== false,
      coverImage: collection.coverImage || "",
    });

    setModalError("");
    setError("");
    setShowModal(true);
  };

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCollection(null);
    setModalError("");
  };

  /* =======================================================
     SAVE COLLECTION
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setModalError("Collection name is required.");
      return;
    }

    if (!form.artist.trim()) {
      setModalError("Artist ID is required.");
      return;
    }

    try {
      setSaving(true);
      setModalError("");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        artist: form.artist.trim(),
        visible: form.visible,
        coverImage: form.coverImage.trim(),
      };

      if (editingCollection) {
        await axios.put(
          `${BASE_URL_CLEAN}/api/collections/${editingCollection._id}`,
          payload,
          authConfig(),
        );
      } else {
        await axios.post(
          `${BASE_URL_CLEAN}/api/collections`,
          payload,
          authConfig(),
        );
      }

      setShowModal(false);
      setEditingCollection(null);

      await fetchCollections(true);
    } catch (err) {
      console.error("SAVE COLLECTION ERROR:", err);
      setModalError(getErrorMessage(err, "Failed to save collection."));
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE COLLECTION
  ======================================================= */

  const handleDelete = async (collection) => {
    const confirmed = window.confirm(
      `Delete "${collection.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await axios.delete(
        `${BASE_URL_CLEAN}/api/collections/${collection._id}`,
        authConfig(),
      );

      if (selectedCollection?._id === collection._id) {
        setSelectedCollection(null);
        setShowSongsModal(false);
      }

      await fetchCollections(true);
    } catch (err) {
      console.error("DELETE COLLECTION ERROR:", err);
      setError(getErrorMessage(err, "Failed to delete collection."));
    }
  };

  /* =======================================================
     LOAD AVAILABLE SONGS
  ======================================================= */

  const loadAvailableSongs = async (collectionId) => {
    try {
      setSongsLoading(true);

      const response = await axios.get(
        `${BASE_URL_CLEAN}/api/collections/${collectionId}/available-songs`,
        authConfig(),
      );

      setAvailableSongs(response.data.songs || []);
    } catch (err) {
      console.error("GET AVAILABLE SONGS ERROR:", err);
      setAvailableSongs([]);
    } finally {
      setSongsLoading(false);
    }
  };

  /* =======================================================
     OPEN SONGS MODAL
  ======================================================= */

  const openSongsModal = async (collection) => {
    setSongsLoading(true);
    setSongSearch("");
    setAvailableSongs([]);
    setSelectedCollection(null);
    setShowSongsModal(true);

    try {
      const response = await axios.get(
        `${BASE_URL_CLEAN}/api/collections/${collection._id}`,
        authConfig(),
      );

      setSelectedCollection(response.data.collection);

      await loadAvailableSongs(collection._id);
    } catch (err) {
      console.error("GET COLLECTION DETAILS ERROR:", err);
      setError(getErrorMessage(err, "Failed to load collection details."));
      setShowSongsModal(false);
    } finally {
      setSongsLoading(false);
    }
  };

  /* =======================================================
     ADD SONG
  ======================================================= */

  const handleAddSong = async (songId) => {
    if (!selectedCollection || songAction) return;

    try {
      setSongAction(songId);

      const response = await axios.post(
        `${BASE_URL_CLEAN}/api/collections/${selectedCollection._id}/songs/${songId}`,
        {},
        authConfig(),
      );

      setSelectedCollection(response.data.collection);

      setAvailableSongs((previous) =>
        previous.filter((song) => song._id !== songId),
      );

      await fetchCollections(true);
    } catch (err) {
      console.error("ADD SONG ERROR:", err);
      setModalError(getErrorMessage(err, "Failed to add song."));
    } finally {
      setSongAction("");
    }
  };

  /* =======================================================
     REMOVE SONG
  ======================================================= */

  const handleRemoveSong = async (songId) => {
    if (!selectedCollection || songAction) return;

    try {
      setSongAction(songId);

      const response = await axios.delete(
        `${BASE_URL_CLEAN}/api/collections/${selectedCollection._id}/songs/${songId}`,
        authConfig(),
      );

      setSelectedCollection(response.data.collection);

      await loadAvailableSongs(selectedCollection._id);

      await fetchCollections(true);
    } catch (err) {
      console.error("REMOVE SONG ERROR:", err);
      setModalError(getErrorMessage(err, "Failed to remove song."));
    } finally {
      setSongAction("");
    }
  };

  /* =======================================================
     FILTER AVAILABLE SONGS
  ======================================================= */

  const filteredSongs = useMemo(() => {
    const value = songSearch.trim().toLowerCase();

    if (!value) return availableSongs;

    return availableSongs.filter((song) =>
      [
        song.title,
        song.artist?.name,
        typeof song.album === "string" ? song.album : song.album?.title,
      ].some((field) => field?.toLowerCase().includes(value)),
    );
  }, [availableSongs, songSearch]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="min-h-screen space-y-7 pb-10"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      {/* HEADER */}

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em]"
            style={secondaryText}
          >
            Artist Studio
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Collections
          </h1>

          <p className="mt-2 text-sm" style={mutedText}>
            Curate your music. Build your sound. Make it yours.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <NeuButton
            onClick={() => fetchCollections(true)}
            disabled={refreshing || loading}
            title="Refresh collections"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </NeuButton>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              ...primaryButton,
              boxShadow:
                "5px 5px 12px var(--theme-shadowDark), -3px -3px 8px var(--theme-shadowLight)",
            }}
          >
            <Plus size={19} />
            Create Collection
          </button>
        </div>
      </header>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Collections",
            value: collections.length,
            icon: Music,
            accent: primaryText,
          },
          {
            label: "Total Tracks",
            value: collections.reduce(
              (total, collection) =>
                total + (collection.songs?.length || 0),
              0,
            ),
            icon: Music2,
            accent: secondaryText,
          },
          {
            label: "Public Collections",
            value: collections.filter(
              (collection) => collection.visible !== false,
            ).length,
            icon: Users,
            accent: primaryText,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl p-5"
              style={neuRaised}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={neuPressed}
              >
                <Icon size={22} style={stat.accent} />
              </div>

              <div>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="mt-1 text-xs" style={mutedText}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH */}

      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
        style={neuPressed}
      >
        <Search size={20} style={mutedText} />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search collections by name, description, or artist..."
          aria-label="Search collections"
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
          style={{ color: "var(--theme-text)" }}
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear collection search"
            className="rounded-lg p-1"
            style={mutedText}
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl p-4 text-sm"
          style={{
            ...neuRaisedSmall,
            color: "var(--theme-danger)",
            borderColor: "var(--theme-danger)",
          }}
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div
          className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-3xl"
          style={neuRaised}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={neuPressed}
          >
            <Loader2
              size={30}
              className="animate-spin"
              style={primaryText}
            />
          </div>

          <p className="text-sm" style={mutedText}>
            Loading your collections...
          </p>
        </div>
      ) : filteredCollections.length === 0 ? (
        /* EMPTY STATE */

        <div
          className="flex min-h-80 flex-col items-center justify-center rounded-3xl px-6 py-12 text-center"
          style={neuRaised}
        >
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={neuPressed}
          >
            {search ? (
              <Search size={35} style={primaryText} />
            ) : (
              <Music size={35} style={primaryText} />
            )}
          </div>

          <h2 className="text-xl font-bold">
            {search ? "No collections found" : "Your studio is waiting"}
          </h2>

          <p
            className="mt-2 max-w-md text-sm leading-6"
            style={mutedText}
          >
            {search
              ? "Try a different search term."
              : "Create your first collection and bring your music together in one place."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
              style={primaryButton}
            >
              <Plus size={18} />
              Create Your First Collection
            </button>
          )}
        </div>
      ) : (
        /* COLLECTION GRID */

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map((collection) => (
            <article
              key={collection._id}
              className="group min-w-0 overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1"
              style={neuRaised}
            >
              {/* COVER */}

              <div
                className="relative h-52 overflow-hidden"
                style={{
                  backgroundColor: "var(--theme-surface-light)",
                }}
              >
                {collection.coverImage ? (
                  <img
                    src={getImageUrl(collection.coverImage)}
                    alt={`${collection.name} cover`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}

                <div className="absolute inset-0 flex items-center justify-center">
                  <Disc3
                    size={60}
                    style={{
                      color: "var(--theme-primary)",
                      opacity: 0.65,
                    }}
                  />
                </div>

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, var(--theme-overlay), transparent 70%)",
                  }}
                />

                <div className="absolute right-4 top-4">
                  <span
                    className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--theme-surface)",
                      color:
                        collection.visible !== false
                          ? "var(--theme-secondary)"
                          : "var(--theme-textMuted)",
                      border: "1px solid var(--theme-border)",
                      boxShadow:
                        "3px 3px 7px var(--theme-shadowDark)",
                    }}
                  >
                    {collection.visible !== false ? (
                      <Eye size={14} />
                    ) : (
                      <EyeOff size={14} />
                    )}

                    {collection.visible !== false ? "Public" : "Hidden"}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="truncate text-xl font-extrabold text-white">
                    {collection.name}
                  </h2>

                  <p className="mt-1 text-xs text-white/80">
                    {collection.songs?.length || 0} tracks
                  </p>
                </div>
              </div>

              {/* CONTENT */}

              <div className="p-5">
                <p
                  className="line-clamp-2 min-h-10 text-sm leading-5"
                  style={mutedText}
                >
                  {collection.description || "No description added yet."}
                </p>

                <div
                  className="mt-4 flex items-center justify-between gap-3 border-t pt-4"
                  style={{ borderColor: "var(--theme-border)" }}
                >
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={secondaryText}
                  >
                    <Music2 size={16} />
                    <span>
                      {collection.songs?.length || 0} songs
                    </span>
                  </div>

                  <span
                    className="text-xs"
                    style={mutedText}
                  >
                    {collection.artist?.name || "Your collection"}
                  </span>
                </div>

                {/* ACTIONS */}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <NeuButton
                    onClick={() => openSongsModal(collection)}
                    className="min-w-0 px-2"
                    style={secondaryText}
                  >
                    <Music2 size={16} />
                    Songs
                  </NeuButton>

                  <NeuButton
                    onClick={() => openEditModal(collection)}
                    className="min-w-0 px-2"
                    style={primaryText}
                  >
                    <Edit3 size={16} />
                    Edit
                  </NeuButton>

                  <NeuButton
                    onClick={() => handleDelete(collection)}
                    className="min-w-0 px-2"
                    style={{ color: "var(--theme-danger)" }}
                    title={`Delete ${collection.name}`}
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Delete</span>
                  </NeuButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          style={{
            backgroundColor: "var(--theme-overlay)",
            backdropFilter: "blur(5px)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
            style={neuRaised}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p
                  className="mb-2 text-xs font-bold uppercase tracking-widest"
                  style={secondaryText}
                >
                  Artist Studio
                </p>

                <h2
                  id="collection-modal-title"
                  className="text-xl font-extrabold"
                >
                  {editingCollection
                    ? "Edit Collection"
                    : "Create Collection"}
                </h2>

                <p className="mt-1 text-sm" style={mutedText}>
                  {editingCollection
                    ? "Update your collection details."
                    : "Build a new home for your music."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close collection form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:scale-105 disabled:opacity-50"
                style={neuRaisedSmall}
              >
                <X size={19} />
              </button>
            </div>

            {modalError && (
              <div
                className="mb-5 rounded-xl p-3 text-sm"
                style={{
                  ...neuPressed,
                  color: "var(--theme-danger)",
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NAME */}

              <div>
                <label
                  htmlFor="collection-name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Collection Name *
                </label>

                <input
                  id="collection-name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Chill Vibes"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuPressed,
                    color: "var(--theme-text)",
                  }}
                />
              </div>

              {/* ARTIST */}

              <div>
                <label
                  htmlFor="collection-artist"
                  className="mb-2 block text-sm font-semibold"
                >
                  Artist ID *
                </label>

                <input
                  id="collection-artist"
                  required
                  value={form.artist}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      artist: event.target.value,
                    }))
                  }
                  placeholder="Artist profile ID"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuPressed,
                    color: "var(--theme-text)",
                  }}
                />

                <p className="mt-2 text-xs leading-5" style={mutedText}>
                  Enter the artist profile ID associated with this collection.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="collection-description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Description
                </label>

                <textarea
                  id="collection-description"
                  rows={4}
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe this collection..."
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuPressed,
                    color: "var(--theme-text)",
                  }}
                />
              </div>

              {/* COVER IMAGE */}

              <div>
                <label
                  htmlFor="collection-cover"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold"
                >
                  <ImagePlus size={16} style={primaryText} />
                  Cover Image URL
                </label>

                <input
                  id="collection-cover"
                  type="text"
                  value={form.coverImage}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      coverImage: event.target.value,
                    }))
                  }
                  placeholder="uploads/covers/..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    ...neuPressed,
                    color: "var(--theme-text)",
                  }}
                />

                {form.coverImage && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={getImageUrl(form.coverImage)}
                      alt="Collection cover preview"
                      className="h-14 w-14 rounded-xl object-cover"
                      style={neuRaisedSmall}
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />

                    <p className="text-xs" style={mutedText}>
                      Cover preview
                    </p>
                  </div>
                )}
              </div>

              {/* VISIBILITY */}

              <button
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    visible: !previous.visible,
                  }))
                }
                className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left transition-all duration-200"
                style={neuRaisedSmall}
                aria-pressed={form.visible}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={neuPressed}
                  >
                    {form.visible ? (
                      <Eye size={18} style={secondaryText} />
                    ) : (
                      <EyeOff size={18} style={mutedText} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Collection Visibility
                    </p>

                    <p className="mt-1 text-xs" style={mutedText}>
                      {form.visible
                        ? "Visible to users"
                        : "Hidden from users"}
                    </p>
                  </div>
                </div>

                <span
                  className="flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-all duration-200"
                  style={{
                    backgroundColor: form.visible
                      ? "var(--theme-primary)"
                      : "var(--theme-background)",
                    boxShadow:
                      "inset 2px 2px 4px var(--theme-shadowDark)",
                  }}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                      form.visible ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              {/* FORM ACTIONS */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <NeuButton
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </NeuButton>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={primaryButton}
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingCollection
                      ? "Update Collection"
                      : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          SONGS MANAGEMENT MODAL
      ===================================================== */}

      {showSongsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
          style={{
            backgroundColor: "var(--theme-overlay)",
            backdropFilter: "blur(5px)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowSongsModal(false);
              setSelectedCollection(null);
              setModalError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="songs-modal-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
            style={neuRaised}
          >
            {/* MODAL HEADER */}

            <div
              className="flex items-center justify-between gap-4 p-5 sm:p-6"
              style={{ borderBottom: "1px solid var(--theme-border)" }}
            >
              <div className="min-w-0">
                <p
                  className="mb-1 text-xs font-bold uppercase tracking-widest"
                  style={secondaryText}
                >
                  Collection Manager
                </p>

                <h2
                  id="songs-modal-title"
                  className="truncate text-xl font-extrabold"
                >
                  {selectedCollection?.name || "Loading collection..."}
                </h2>

                <p className="mt-1 text-sm" style={mutedText}>
                  Add tracks or manage the songs in your collection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSongsModal(false);
                  setSelectedCollection(null);
                  setModalError("");
                }}
                aria-label="Close songs manager"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={neuRaisedSmall}
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-5 sm:p-6">
              {modalError && (
                <div
                  className="rounded-xl p-3 text-sm"
                  style={{
                    ...neuPressed,
                    color: "var(--theme-danger)",
                  }}
                >
                  {modalError}
                </div>
              )}

              {!selectedCollection || songsLoading ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3">
                  <Loader2
                    size={30}
                    className="animate-spin"
                    style={primaryText}
                  />
                  <p className="text-sm" style={mutedText}>
                    Loading collection songs...
                  </p>
                </div>
              ) : (
                <>
                  {/* CURRENT SONGS */}

                  <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold">
                          Songs in Collection
                        </h3>
                        <p className="mt-1 text-xs" style={mutedText}>
                          {selectedCollection.songs?.length || 0} tracks
                        </p>
                      </div>

                      <div
                        className="rounded-xl px-3 py-2 text-xs font-semibold"
                        style={neuPressed}
                      >
                        <span style={secondaryText}>Your collection</span>
                      </div>
                    </div>

                    {selectedCollection.songs?.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCollection.songs.map((song) => (
                          <div
                            key={song._id}
                            className="flex min-w-0 items-center gap-3 rounded-2xl p-3 sm:gap-4"
                            style={neuRaisedSmall}
                          >
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                              style={neuPressed}
                            >
                              {song.coverImage ? (
                                <img
                                  src={getImageUrl(song.coverImage)}
                                  alt={`${song.title} cover`}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Music2 size={20} style={primaryText} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {song.title || "Untitled Song"}
                              </p>

                              <p className="mt-1 truncate text-xs" style={mutedText}>
                                {song.artist?.name || "Unknown Artist"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSong(song._id)}
                              disabled={Boolean(songAction)}
                              aria-label={`Remove ${song.title} from collection`}
                              title="Remove song"
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:scale-105 disabled:opacity-50"
                              style={{
                                ...neuRaisedSmall,
                                color: "var(--theme-danger)",
                              }}
                            >
                              {songAction === song._id ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <Minus size={17} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="rounded-2xl px-5 py-8 text-center"
                        style={neuPressed}
                      >
                        <Music2
                          size={30}
                          className="mx-auto mb-3"
                          style={mutedText}
                        />
                        <p className="text-sm" style={mutedText}>
                          No songs in this collection yet.
                        </p>
                      </div>
                    )}
                  </section>

                  {/* AVAILABLE SONGS */}

                  <section>
                    <div className="mb-4">
                      <h3 className="text-base font-bold">Discover Your Tracks</h3>
                      <p className="mt-1 text-xs" style={mutedText}>
                        Only songs available to your artist account are listed.
                      </p>
                    </div>

                    {/* SONG SEARCH */}

                    <div
                      className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
                      style={neuPressed}
                    >
                      <Search size={17} style={mutedText} />

                      <input
                        value={songSearch}
                        onChange={(event) => setSongSearch(event.target.value)}
                        placeholder="Search available songs..."
                        aria-label="Search available songs"
                        className="w-full bg-transparent text-sm outline-none placeholder:opacity-60"
                        style={{ color: "var(--theme-text)" }}
                      />

                      {songSearch && (
                        <button
                          type="button"
                          onClick={() => setSongSearch("")}
                          aria-label="Clear song search"
                          style={mutedText}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {filteredSongs.length === 0 ? (
                      <div
                        className="rounded-2xl px-5 py-8 text-center"
                        style={neuPressed}
                      >
                        <Check
                          size={28}
                          className="mx-auto mb-3"
                          style={secondaryText}
                        />

                        <p className="text-sm" style={mutedText}>
                          {songSearch
                            ? "No matching songs found."
                            : "No more songs available to add."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredSongs.map((song) => (
                          <div
                            key={song._id}
                            className="flex min-w-0 items-center gap-3 rounded-2xl p-3 sm:gap-4"
                            style={neuRaisedSmall}
                          >
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                              style={neuPressed}
                            >
                              {song.coverImage ? (
                                <img
                                  src={getImageUrl(song.coverImage)}
                                  alt={`${song.title} cover`}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Music2 size={20} style={primaryText} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {song.title || "Untitled Song"}
                              </p>

                              <p className="mt-1 truncate text-xs" style={mutedText}>
                                {song.artist?.name || "Unknown Artist"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddSong(song._id)}
                              disabled={Boolean(songAction)}
                              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition hover:-translate-y-0.5 disabled:opacity-50 sm:px-4"
                              style={primaryButton}
                            >
                              {songAction === song._id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Plus size={15} />
                              )}
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;
