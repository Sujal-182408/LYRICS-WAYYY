import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ImagePlus,
  Music2,
  Save,
  X,
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Disc3,
  FileAudio,
  RefreshCw,
} from "lucide-react";
import { BASE_URL } from "../../config/api";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = BASE_URL.replace(/\/+$/, "");
const DEFAULT_COVER = "/image/default-cover.jpg";

const getToken = () => localStorage.getItem("token");

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const getMediaUrl = (path) => {
  if (!path || typeof path !== "string") return "";

  const value = path.trim();

  if (/^https?:\/\//i.test(value)) return value;

  return `${API_BASE}/${value.replace(/^\/+/, "")}`;
};

/* =========================================================
   THEME-AWARE NEUMORPHIC STYLES
========================================================= */

const raisedStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "8px 8px 16px var(--theme-shadowDark), -8px -8px 16px var(--theme-shadowLight)",
};

const raisedSmallStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "4px 4px 9px var(--theme-shadowDark), -4px -4px 9px var(--theme-shadowLight)",
};

const pressedStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 5px 5px 10px var(--theme-shadowDark), inset -5px -5px 10px var(--theme-shadowLight)",
};

const inputStyle = {
  backgroundColor: "var(--theme-surface)",
  color: "var(--theme-text)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
};

const primaryButtonStyle = {
  background: "var(--theme-gradient)",
  color: "var(--theme-text)",
  border: "1px solid var(--theme-border)",
};

const mutedStyle = { color: "var(--theme-textMuted)" };
const primaryStyle = { color: "var(--theme-primary)" };
const secondaryStyle = { color: "var(--theme-secondary)" };

/* =========================================================
   REUSABLE FORM FIELD
========================================================= */

const Field = ({ label, children, hint }) => (
  <div className="min-w-0">
    <label className="mb-2 block text-sm font-semibold">{label}</label>
    {children}
    {hint && (
      <p className="mt-2 text-xs leading-5" style={mutedStyle}>
        {hint}
      </p>
    )}
  </div>
);

/* =========================================================
   EDIT SONG
========================================================= */

const EditSongs = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const coverInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const coverObjectUrlRef = useRef("");

  const [form, setForm] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    duration: "",
  });

  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  const [coverFile, setCoverFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const [coverPreview, setCoverPreview] = useState("");
  const [currentAudio, setCurrentAudio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =======================================================
     CLEAN UP TEMPORARY COVER PREVIEW URL
  ======================================================= */

  const clearCoverObjectUrl = useCallback(() => {
    if (coverObjectUrlRef.current) {
      URL.revokeObjectURL(coverObjectUrlRef.current);
      coverObjectUrlRef.current = "";
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCoverObjectUrl();
    };
  }, [clearCoverObjectUrl]);

  /* =======================================================
     LOAD SONG
  ======================================================= */

  useEffect(() => {
    if (!id) {
      setError("A song ID was not provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSong = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const response = await axios.get(
          `${API_BASE}/api/songs/${id}`,
          authConfig(),
        );

        if (cancelled) return;

        const song = response.data?.song || response.data?.data;

        if (!song) {
          throw new Error("Song not found.");
        }

        setForm({
          title: song.title || "",
          artist:
            typeof song.artist === "object"
              ? song.artist?._id || ""
              : song.artist || "",
          album:
            typeof song.album === "object"
              ? song.album?._id || ""
              : song.album || "",
          genre: song.genre || "",
          duration:
            song.duration === undefined || song.duration === null
              ? ""
              : String(song.duration),
        });

        setCoverPreview(getMediaUrl(song.coverImage) || DEFAULT_COVER);
        setCurrentAudio(getMediaUrl(song.audioFile));
      } catch (err) {
        if (cancelled) return;

        console.error("LOAD SONG ERROR:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load song.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSong();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =======================================================
     LOAD ARTISTS AND ALBUMS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const [artistResponse, albumResponse] = await Promise.all([
          axios.get(`${API_BASE}/api/artists`, authConfig()),
          axios.get(`${API_BASE}/api/albums`, authConfig()),
        ]);

        if (cancelled) return;

        setArtists(
          artistResponse.data?.artists ||
            artistResponse.data?.data ||
            [],
        );

        setAlbums(
          albumResponse.data?.albums ||
            albumResponse.data?.data ||
            [],
        );
      } catch (err) {
        if (!cancelled) {
          console.error("LOAD ARTIST/ALBUM ERROR:", err);
        }
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     HANDLE FORM CHANGES
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  /* =======================================================
     COVER IMAGE
  ======================================================= */

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    // Allow choosing the same file again after removing it.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Cover image must be 10 MB or smaller.");
      return;
    }

    clearCoverObjectUrl();

    const objectUrl = URL.createObjectURL(file);
    coverObjectUrlRef.current = objectUrl;

    setCoverFile(file);
    setCoverPreview(objectUrl);
    setError("");
    setSuccessMessage("");
  };

  const removeCover = () => {
    clearCoverObjectUrl();
    setCoverFile(null);
    setCoverPreview("");
    setError("");
    setSuccessMessage("");
  };

  /* =======================================================
     AUDIO FILE
  ======================================================= */

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file.");
      return;
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Audio file must be 100 MB or smaller.");
      return;
    }

    setAudioFile(file);
    setError("");
    setSuccessMessage("");
  };

  const removeAudio = () => {
    setAudioFile(null);
    setError("");
    setSuccessMessage("");
  };

  /* =======================================================
     SAVE CHANGES
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!form.title.trim()) {
      setError("Song title is required.");
      return;
    }

    if (!id) {
      setError("Cannot update the song because its ID is missing.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());

      if (form.artist) {
        formData.append("artist", form.artist);
      }

      if (form.album) {
        formData.append("album", form.album);
      }

      if (form.genre.trim()) {
        formData.append("genre", form.genre.trim());
      }

      if (form.duration.trim()) {
        formData.append("duration", form.duration.trim());
      }

      if (coverFile) {
        formData.append("coverImage", coverFile);
      }

      if (audioFile) {
        formData.append("audioFile", audioFile);
      }

      await axios.put(`${API_BASE}/api/songs/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      clearCoverObjectUrl();

      navigate("/artist/songs", {
        replace: true,
        state: { message: "Song updated successfully." },
      });
    } catch (err) {
      console.error("UPDATE SONG ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update song.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        style={{
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={pressedStyle}
          >
            <Loader2
              size={27}
              className="animate-spin"
              style={primaryStyle}
            />
          </div>

          <p className="mt-5 text-sm" style={mutedStyle}>
            Loading song details...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
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

      <header className="flex items-start gap-4">
        <Link
          to="/artist/songs"
          aria-label="Back to my songs"
          title="Back to my songs"
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition hover:-translate-y-0.5 active:scale-95"
          style={raisedSmallStyle}
        >
          <ArrowLeft size={19} style={primaryStyle} />
        </Link>

        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={secondaryStyle}
          >
            Artist Studio
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Edit Song
          </h1>

          <p className="mt-2 text-sm leading-6" style={mutedStyle}>
            Update your track details, cover artwork, and audio file.
          </p>
        </div>
      </header>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl p-4 text-sm"
          style={{
            ...pressedStyle,
            color: "var(--theme-danger)",
          }}
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <p className="min-w-0 flex-1">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="shrink-0"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl p-4 text-sm"
          style={{
            ...pressedStyle,
            color: "var(--theme-secondary)",
          }}
        >
          <CheckCircle2 size={19} />
          <p className="flex-1">{successMessage}</p>
        </div>
      )}

      {/* EDIT FORM */}

      <form onSubmit={handleSubmit} className="rounded-3xl p-4 sm:p-6 lg:p-8" style={raisedStyle}>
        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.8fr)]">
          {/* COVER ARTWORK */}

          <section className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={pressedStyle}
              >
                <ImagePlus size={20} style={primaryStyle} />
              </div>

              <div>
                <h2 className="font-bold">Cover Artwork</h2>
                <p className="mt-1 text-xs" style={mutedStyle}>
                  Personalize your track
                </p>
              </div>
            </div>

            <div
              className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl p-3"
              style={pressedStyle}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Song cover preview"
                  className="h-full w-full rounded-2xl object-cover"
                  onError={(event) => {
                    if (event.currentTarget.src !== DEFAULT_COVER) {
                      event.currentTarget.src = DEFAULT_COVER;
                    }
                  }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl">
                  <Disc3 size={60} style={primaryStyle} />
                  <p className="mt-4 text-sm" style={mutedStyle}>
                    No cover selected
                  </p>
                </div>
              )}

              {coverPreview && (
                <button
                  type="button"
                  onClick={removeCover}
                  title="Remove cover preview"
                  aria-label="Remove cover preview"
                  className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl transition hover:scale-105"
                  style={{
                    ...raisedSmallStyle,
                    color: "var(--theme-danger)",
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                style={raisedSmallStyle}
              >
                <ImagePlus size={18} style={primaryStyle} />
                {coverFile ? "Choose Another Cover" : "Upload New Cover"}
              </button>

              <p className="text-center text-xs" style={mutedStyle}>
                JPG, PNG, WEBP or GIF · Maximum 10 MB
              </p>

              {coverFile && (
                <p className="break-all text-center text-xs" style={secondaryStyle}>
                  Selected: {coverFile.name}
                </p>
              )}
            </div>
          </section>

          {/* SONG DETAILS */}

          <section className="min-w-0 space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={pressedStyle}
              >
                <Music2 size={20} style={secondaryStyle} />
              </div>

              <div>
                <h2 className="font-bold">Track Details</h2>
                <p className="mt-1 text-xs" style={mutedStyle}>
                  Keep your song information accurate
                </p>
              </div>
            </div>

            {/* TITLE */}

            <Field label="Song Title *">
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter song title"
                maxLength={200}
                required
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition focus:ring-2"
                style={inputStyle}
              />
            </Field>

            {/* ARTIST / ALBUM */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Artist">
                <select
                  name="artist"
                  value={form.artist}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">Select artist</option>

                  {artists.map((artist) => (
                    <option key={artist._id} value={artist._id}>
                      {artist.name || artist.stageName || "Unnamed Artist"}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Album">
                <select
                  name="album"
                  value={form.album}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">No album</option>

                  {albums.map((album) => (
                    <option key={album._id} value={album._id}>
                      {album.title || album.name || "Untitled Album"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* GENRE / DURATION */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Genre">
                <input
                  type="text"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="e.g. Pop, Rock, Classical"
                  maxLength={100}
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="Duration" hint="Use the format your backend expects, such as 3:45.">
                <input
                  type="text"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="e.g. 3:45"
                  className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* AUDIO SECTION */}

            <div
              className="space-y-4 rounded-2xl p-4 sm:p-5"
              style={pressedStyle}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={raisedSmallStyle}
                >
                  <FileAudio size={21} style={secondaryStyle} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold">Audio File</h3>
                  <p className="mt-1 text-xs" style={mutedStyle}>
                    Replace the existing track if needed
                  </p>
                </div>
              </div>

              {/* CURRENT AUDIO */}

              {currentAudio && !audioFile && (
                <div className="min-w-0 space-y-3">
                  <p className="text-xs font-semibold" style={mutedStyle}>
                    CURRENT TRACK
                  </p>

                  <audio
                    controls
                    preload="metadata"
                    src={currentAudio}
                    className="w-full"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {/* NEW AUDIO SELECTED */}

              {audioFile && (
                <div
                  className="flex min-w-0 items-center gap-3 rounded-xl p-3"
                  style={raisedSmallStyle}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={pressedStyle}
                  >
                    <Music2 size={19} style={secondaryStyle} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {audioFile.name}
                    </p>

                    <p className="mt-1 text-xs" style={mutedStyle}>
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB · New
                      audio selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeAudio}
                    aria-label="Remove selected audio"
                    title="Remove selected audio"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: "var(--theme-danger)" }}
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                style={raisedSmallStyle}
              >
                <Upload size={18} style={secondaryStyle} />
                {audioFile ? "Choose Another Audio" : "Replace Audio File"}
              </button>

              <p className="text-xs leading-5" style={mutedStyle}>
                Leave the audio unchanged to keep the current track. Audio
                files up to 100 MB can be selected.
              </p>
            </div>
          </section>
        </div>

        {/* FORM FOOTER */}

        <footer
          className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end"
          style={{ borderColor: "var(--theme-border)" }}
        >
          <Link
            to="/artist/songs"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
            style={raisedSmallStyle}
          >
            <ArrowLeft size={17} />
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={primaryButtonStyle}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default EditSongs;