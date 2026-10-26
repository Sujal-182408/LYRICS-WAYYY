
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Upload,
  ImagePlus,
  Save,
  Loader2,
  X,
  Disc3,
  CalendarDays,
  UserRound,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { BASE_URL } from "../../config/api";

const API_BASE = String(BASE_URL || "").replace(/\/+$/, "");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const cardStyle = {
  background: "var(--theme-surface, #252933)",
  border: "1px solid var(--theme-border, rgba(255,255,255,0.06))",
  boxShadow:
    "9px 9px 18px var(--theme-shadowDark, #171a20), -9px -9px 18px var(--theme-shadowLight, #2f3440)",
};

const raisedSmallStyle = {
  background: "var(--theme-surface, #252933)",
  border: "1px solid var(--theme-border, rgba(255,255,255,0.05))",
  boxShadow:
    "5px 5px 10px var(--theme-shadowDark, #171a20), -5px -5px 10px var(--theme-shadowLight, #2f3440)",
};

const insetStyle = {
  background: "var(--theme-surface, #252933)",
  border: "1px solid var(--theme-border, rgba(255,255,255,0.04))",
  boxShadow:
    "inset 4px 4px 8px var(--theme-shadowDark, #171a20), inset -4px -4px 8px var(--theme-shadowLight, #2f3440)",
};

const inputStyle = {
  ...insetStyle,
  color: "var(--theme-text, #ffffff)",
  width: "100%",
  outline: "none",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
};

const iconTileStyle = {
  ...insetStyle,
  color: "var(--theme-primary, #8c7cf7)",
};

const primaryButtonStyle = {
  background:
    "var(--theme-gradient, linear-gradient(135deg, var(--theme-primary, #8c7cf7), var(--theme-secondary, #2bd4c4)))",
  color: "var(--theme-text, #ffffff)",
  border: "1px solid var(--theme-border, rgba(255,255,255,0.08))",
};

const AddAlbum = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [artists, setArtists] = useState([]);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    genre: "",
    releaseDate: "",
    description: "",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  const [loadingArtists, setLoadingArtists] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const artistName =
    artists.find((artist) => artist._id === form.artist)?.name ||
    "Select an artist";

  useEffect(() => {
    let active = true;

    const fetchArtists = async () => {
      if (!token) {
        setLoadingArtists(false);
        navigate("/signin", { replace: true });
        return;
      }

      try {
        setLoadingArtists(true);

        const response = await axios.get(`${API_BASE}/api/artists`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!active) return;

        const data = response.data;

        setArtists(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.artists)
              ? data.artists
              : [],
        );
      } catch (err) {
        console.error("FETCH ARTISTS ERROR:", err);

        if (active) {
          setError(
            err.response?.data?.message || "Failed to load artists.",
          );
        }
      } finally {
        if (active) setLoadingArtists(false);
      }
    };

    fetchArtists();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The cover image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const imageUrl = URL.createObjectURL(file);

    previewUrlRef.current = imageUrl;

    setCoverImage(file);
    setPreview(imageUrl);
    setPreviewFailed(false);
    setError("");
  };

  const removeImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setCoverImage(null);
    setPreview("");
    setPreviewFailed(false);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    if (!form.title.trim()) {
      setError("Album title is required.");
      return;
    }

    if (!form.artist) {
      setError("Please select an artist.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("artist", form.artist);

      if (form.genre.trim()) {
        formData.append("genre", form.genre.trim());
      }

      if (form.releaseDate) {
        formData.append("releaseDate", form.releaseDate);
      }

      if (form.description.trim()) {
        formData.append("description", form.description.trim());
      }

      if (coverImage) {
        formData.append("coverImage", coverImage);
      }

      await axios.post(`${API_BASE}/api/albums`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/artist/albums", {
        state: { message: "Album created successfully." },
      });
    } catch (err) {
      console.error("CREATE ALBUM ERROR:", err);

      setError(
        err.response?.data?.message || "Failed to create album.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="w-full space-y-6 pb-10"
      style={{ color: "var(--theme-text, #ffffff)" }}
    >
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/artist/albums")}
          aria-label="Back to albums"
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-95"
          style={raisedSmallStyle}
        >
          <ArrowLeft
            size={20}
            style={{ color: "var(--theme-primary, #8c7cf7)" }}
          />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: "var(--theme-secondary, #2bd4c4)" }}
          >
            Artist Studio / Albums
          </p>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Create Album
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--theme-textMuted, #9ca3af)" }}
          >
            Create a new release and showcase your music.
          </p>
        </div>

        <div
          className="hidden md:flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
          style={insetStyle}
        >
          <Disc3
            size={18}
            style={{ color: "var(--theme-primary, #8c7cf7)" }}
          />
          <span style={{ color: "var(--theme-textMuted, #9ca3af)" }}>
            New release
          </span>
        </div>
      </header>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{
            ...insetStyle,
            color: "var(--theme-danger, #fb7185)",
          }}
        >
          <AlertCircle size={19} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-6">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6"
      >
        {/* COVER PANEL */}
        <aside className="space-y-5">
          <section className="rounded-3xl p-5 md:p-6 h-fit" style={cardStyle}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p
                  className="text-xs uppercase tracking-[0.18em] font-semibold"
                  style={{ color: "var(--theme-secondary, #2bd4c4)" }}
                >
                  Artwork
                </p>

                <h2 className="text-lg font-bold mt-1">Album Cover</h2>
              </div>

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={iconTileStyle}
              >
                <ImagePlus size={19} />
              </div>
            </div>

            <div
              className="relative aspect-square overflow-hidden rounded-2xl p-2"
              style={insetStyle}
            >
              {preview && !previewFailed ? (
                <img
                  src={preview}
                  alt={`${form.title || "Album"} cover preview`}
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center rounded-xl gap-3">
                  <Disc3
                    size={58}
                    strokeWidth={1.2}
                    style={{ color: "var(--theme-primary, #8c7cf7)" }}
                  />

                  <span
                    className="text-sm"
                    style={{ color: "var(--theme-textMuted, #9ca3af)" }}
                  >
                    {previewFailed ? "Preview unavailable" : "No cover selected"}
                  </span>
                </div>
              )}

              {preview && (
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove album cover"
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95"
                  style={{
                    background: "var(--theme-surface, #252933)",
                    color: "var(--theme-danger, #fb7185)",
                    boxShadow:
                      "4px 4px 8px var(--theme-shadowDark, #171a20), -4px -4px 8px var(--theme-shadowLight, #2f3440)",
                  }}
                >
                  <X size={18} />
                </button>
              )}

              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(0,0,0,0.58)",
                    color: "#ffffff",
                  }}
                >
                  <p className="font-bold truncate">
                    {form.title || "Untitled Album"}
                  </p>

                  <p className="text-xs text-white/70 truncate">
                    {artistName}
                  </p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              id="coverImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            <label
              htmlFor="coverImage"
              className="mt-5 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl cursor-pointer font-semibold text-sm transition-transform active:scale-[0.98]"
              style={raisedSmallStyle}
            >
              <Upload
                size={18}
                style={{ color: "var(--theme-primary, #8c7cf7)" }}
              />
              {coverImage ? "Change Cover" : "Upload Cover"}
            </label>

            <p
              className="text-xs text-center mt-3 leading-5"
              style={{ color: "var(--theme-textMuted, #9ca3af)" }}
            >
              JPG, PNG or WEBP · Maximum 5 MB
            </p>
          </section>

          <section className="rounded-3xl p-5" style={cardStyle}>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={iconTileStyle}
              >
                <CalendarDays size={19} />
              </div>

              <div className="min-w-0">
                <p
                  className="text-xs"
                  style={{ color: "var(--theme-textMuted, #9ca3af)" }}
                >
                  Release date
                </p>

                <p className="font-semibold mt-1 truncate">
                  {form.releaseDate || "Not set"}
                </p>
              </div>
            </div>
          </section>
        </aside>

        {/* FORM PANEL */}
        <section className="rounded-3xl p-5 md:p-7 lg:p-8" style={cardStyle}>
          <div className="flex items-start gap-3 mb-7">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={iconTileStyle}
            >
              <FileText size={20} />
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-bold">
                Album Information
              </h2>

              <p
                className="text-sm mt-1"
                style={{ color: "var(--theme-textMuted, #9ca3af)" }}
              >
                Enter the details for your new release.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* TITLE */}
            <div>
              <label
                htmlFor="albumTitle"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--theme-textMuted, #c0c4ce)" }}
              >
                Album Title{" "}
                <span style={{ color: "var(--theme-primary, #8c7cf7)" }}>
                  *
                </span>
              </label>

              <input
                id="albumTitle"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter your album title"
                maxLength={120}
                required
                className="px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              />

              <p
                className="text-xs text-right mt-2"
                style={{ color: "var(--theme-textMuted, #9ca3af)" }}
              >
                {form.title.length}/120
              </p>
            </div>

            {/* ARTIST */}
            <div>
              <label
                htmlFor="albumArtist"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--theme-textMuted, #c0c4ce)" }}
              >
                Artist{" "}
                <span style={{ color: "var(--theme-primary, #8c7cf7)" }}>
                  *
                </span>
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--theme-primary, #8c7cf7)" }}
                />

                <select
                  id="albumArtist"
                  name="artist"
                  value={form.artist}
                  onChange={handleChange}
                  disabled={loadingArtists}
                  required
                  className="pl-11 pr-4 py-3.5 rounded-2xl appearance-none disabled:opacity-60"
                  style={inputStyle}
                >
                  <option value="">
                    {loadingArtists ? "Loading artists..." : "Select an artist"}
                  </option>

                  {artists.map((artist) => (
                    <option key={artist._id} value={artist._id}>
                      {artist.name || "Unnamed Artist"}
                    </option>
                  ))}
                </select>
              </div>

              {!loadingArtists && artists.length === 0 && (
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--theme-danger, #fb7185)" }}
                >
                  No artists were returned. Check your artist API and permissions.
                </p>
              )}
            </div>

            {/* GENRE + DATE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="albumGenre"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--theme-textMuted, #c0c4ce)" }}
                >
                  Genre
                </label>

                <input
                  id="albumGenre"
                  type="text"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="e.g. Pop, Indie, Classical"
                  maxLength={80}
                  className="px-4 py-3.5 rounded-2xl"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="albumReleaseDate"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--theme-textMuted, #c0c4ce)" }}
                >
                  Release Date
                </label>

                <input
                  id="albumReleaseDate"
                  type="date"
                  name="releaseDate"
                  value={form.releaseDate}
                  onChange={handleChange}
                  className="px-4 py-3.5 rounded-2xl"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label
                  htmlFor="albumDescription"
                  className="text-sm font-medium"
                  style={{ color: "var(--theme-textMuted, #c0c4ce)" }}
                >
                  Description
                </label>

                <span
                  className="text-xs"
                  style={{ color: "var(--theme-textMuted, #9ca3af)" }}
                >
                  {form.description.length}/1000
                </span>
              </div>

              <textarea
                id="albumDescription"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={6}
                maxLength={1000}
                placeholder="Tell listeners about your album, its inspiration, or the story behind it..."
                className="px-4 py-3.5 rounded-2xl resize-y min-h-36"
                style={inputStyle}
              />
            </div>

            {/* ACTIONS */}
            <div
              className="pt-5 flex flex-col-reverse sm:flex-row gap-3"
              style={{
                borderTop:
                  "1px solid var(--theme-border, rgba(255,255,255,0.07))",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/artist/albums")}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                style={raisedSmallStyle}
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || loadingArtists}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                style={primaryButtonStyle}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Album...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Album
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default AddAlbum;
