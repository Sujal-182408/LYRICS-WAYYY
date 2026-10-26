import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Music2,
  Upload,
  Image as ImageIcon,
  Disc3,
  Clock3,
  Tags,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  X,
  AudioLines,
  RefreshCw,
  FileAudio,
  Sparkles,
} from "lucide-react";

import { BASE_URL } from "../../config/api";

const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_COVER_SIZE = 8 * 1024 * 1024;

const ALLOWED_AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "m4a",
  "ogg",
  "aac",
  "flac",
  "webm",
];

const ALLOWED_COVER_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
];

const GENRES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "Rap",
  "R&B",
  "Jazz",
  "Classical",
  "Electronic",
  "Dance",
  "Indie",
  "Lo-fi",
  "Soul",
  "Country",
  "Folk",
  "Metal",
  "Instrumental",
  "Other",
];

const API_BASE = String(BASE_URL || "").replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  "";

const getFileExtension = (filename = "") => {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.error === "string") {
    return responseData.error;
  }

  if (
    typeof responseData === "string" &&
    responseData.trim()
  ) {
    return responseData;
  }

  switch (error?.response?.status) {
    case 400:
      return (
        "The server rejected the upload. Check the required fields, " +
        "selected files, and backend validation."
      );

    case 401:
      return "Your session has expired. Please sign in again.";

    case 403:
      return "You do not have permission to upload songs.";

    case 404:
      return (
        "The requested API endpoint was not found. " +
        "Check your backend song routes."
      );

    case 413:
      return "The selected file is too large for the server.";

    case 415:
      return "The server does not support this file format.";

    case 429:
      return "Too many requests. Please wait and try again.";

    default:
      if (!error?.response) {
        return (
          "Unable to connect to the server. Check that your backend " +
          "is running and your API URL is correct."
        );
      }

      return (
        error?.message ||
        "Something went wrong while uploading the song."
      );
  }
};

/*
 * Theme-aware neumorphic surfaces.
 *
 * These styles use your existing ThemeContext CSS variables.
 * The component does not define a separate color theme.
 */
const raisedStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "8px 8px 18px var(--theme-shadowDark), " +
    "-6px -6px 16px var(--theme-shadowLight)",
};

const raisedSmallStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "4px 4px 10px var(--theme-shadowDark), " +
    "-3px -3px 8px var(--theme-shadowLight)",
};

const insetStyle = {
  backgroundColor: "var(--theme-background)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 4px 4px 9px var(--theme-shadowDark), " +
    "inset -4px -4px 9px var(--theme-shadowLight)",
};

const primaryButtonStyle = {
  background: "var(--theme-gradient, var(--theme-primary))",
  color: "var(--theme-text)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "5px 5px 12px var(--theme-shadowDark), " +
    "-3px -3px 9px var(--theme-shadowLight)",
};

const primaryTextStyle = {
  color: "var(--theme-primary)",
};

const mutedTextStyle = {
  color: "var(--theme-textMuted)",
};

const labelStyle = {
  color: "var(--theme-text)",
};

const statusSuccessStyle = {
  color: "var(--theme-secondary)",
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
};

const statusErrorStyle = {
  color: "var(--theme-danger, #f87171)",
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
};

const AddSongs = () => {
  const navigate = useNavigate();

  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const requestRef = useRef(false);
  const redirectTimerRef = useRef(null);

  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    album: "",
    genre: "",
    duration: "",
    coverImage: null,
    audioFile: null,
  });

  const [loadingArtist, setLoadingArtist] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");

  const [audioDuration, setAudioDuration] = useState(null);

  const authHeaders = useCallback(() => {
    const token = getToken();

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  }, []);

  const resetMessages = useCallback(() => {
    setError("");
    setSuccess("");
    setPageError("");
  }, []);

  /*
   * Load the authenticated artist profile.
   */
  const fetchArtist = useCallback(async () => {
    setLoadingArtist(true);
    setPageError("");

    try {
      const token = getToken();

      if (!token) {
        setArtist(null);
        setPageError(
          "Your session has expired. Please sign in again."
        );
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/songs/my/artist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 20000,
        }
      );

      const artistData = response?.data?.artist;

      if (
        response?.data?.success === false ||
        !artistData?._id
      ) {
        setArtist(null);
        setPageError(
          response?.data?.message ||
            "Your artist profile could not be found. Contact the administrator if you believe this is an error."
        );
        return;
      }

      setArtist(artistData);
    } catch (err) {
      console.error(
        "FETCH ARTIST ERROR:",
        err?.response?.data || err
      );

      setArtist(null);
      setPageError(getErrorMessage(err));
    } finally {
      setLoadingArtist(false);
    }
  }, []);

  /*
   * Load albums belonging to the current artist.
   */
  const fetchAlbums = useCallback(async () => {
    setLoadingAlbums(true);

    try {
      const token = getToken();

      if (!token) {
        setAlbums([]);
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/albums/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 20000,
        }
      );

      const data = response?.data;

      const albumList = Array.isArray(data?.albums)
        ? data.albums
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      setAlbums(albumList);
    } catch (err) {
      console.error(
        "FETCH ALBUMS ERROR:",
        err?.response?.data || err
      );

      setAlbums([]);
    } finally {
      setLoadingAlbums(false);
    }
  }, []);

  useEffect(() => {
    fetchArtist();
    fetchAlbums();

    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [fetchArtist, fetchAlbums]);

  /*
   * Create and revoke local preview URLs safely.
   */
  useEffect(() => {
    if (!formData.audioFile) {
      setAudioPreviewUrl("");
      setAudioDuration(null);
      return undefined;
    }

    const url = URL.createObjectURL(formData.audioFile);
    setAudioPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [formData.audioFile]);

  useEffect(() => {
    if (!formData.coverImage) {
      setCoverPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(formData.coverImage);
    setCoverPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [formData.coverImage]);

  /*
   * Form fields.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    resetMessages();

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Audio validation.
   */
  const handleAudioChange = (event) => {
    const file = event.target.files?.[0] || null;

    resetMessages();

    if (!file) return;

    const extension = getFileExtension(file.name);

    if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
      setError(
        `Unsupported audio format. Allowed formats: ${ALLOWED_AUDIO_EXTENSIONS.join(
          ", "
        )}.`
      );

      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setError(
        "The selected audio file is empty. Please select another file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_AUDIO_SIZE) {
      setError(
        `Audio file is ${formatFileSize(
          file.size
        )}. The maximum allowed size is ${formatFileSize(
          MAX_AUDIO_SIZE
        )}.`
      );

      event.target.value = "";
      return;
    }

    setFormData((previous) => ({
      ...previous,
      audioFile: file,
    }));
  };

  /*
   * Cover validation.
   */
  const handleCoverChange = (event) => {
    const file = event.target.files?.[0] || null;

    resetMessages();

    if (!file) return;

    const extension = getFileExtension(file.name);

    if (!ALLOWED_COVER_EXTENSIONS.includes(extension)) {
      setError(
        "Unsupported artwork format. Use JPG, JPEG, PNG, or WEBP."
      );

      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setError("The selected cover image is empty.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_COVER_SIZE) {
      setError(
        `Cover image exceeds the ${formatFileSize(
          MAX_COVER_SIZE
        )} size limit.`
      );

      event.target.value = "";
      return;
    }

    setFormData((previous) => ({
      ...previous,
      coverImage: file,
    }));
  };

  const removeAudio = () => {
    resetMessages();

    setFormData((previous) => ({
      ...previous,
      audioFile: null,
    }));

    setAudioDuration(null);

    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

  const removeCover = () => {
    resetMessages();

    setFormData((previous) => ({
      ...previous,
      coverImage: null,
    }));

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  /*
   * Upload song.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (requestRef.current) return;

    resetMessages();

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please sign in again."
      );
      return;
    }

    if (!artist?._id) {
      setError(
        "Your artist profile is unavailable. Refresh the profile and try again."
      );
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a song title.");
      return;
    }

    if (formData.title.trim().length > 150) {
      setError("Song title cannot exceed 150 characters.");
      return;
    }

    if (!formData.audioFile) {
      setError("Please select an audio file.");
      return;
    }

    const audioExtension = getFileExtension(
      formData.audioFile.name
    );

    if (!ALLOWED_AUDIO_EXTENSIONS.includes(audioExtension)) {
      setError("Please select a supported audio file.");
      return;
    }

    if (
      formData.audioFile.size === 0 ||
      formData.audioFile.size > MAX_AUDIO_SIZE
    ) {
      setError(
        `Audio file must be between 1 byte and ${formatFileSize(
          MAX_AUDIO_SIZE
        )}.`
      );
      return;
    }

    if (
      formData.coverImage &&
      (
        formData.coverImage.size === 0 ||
        formData.coverImage.size > MAX_COVER_SIZE
      )
    ) {
      setError(
        `Cover image must be between 1 byte and ${formatFileSize(
          MAX_COVER_SIZE
        )}.`
      );
      return;
    }

    if (
      formData.duration !== "" &&
      (
        !Number.isFinite(Number(formData.duration)) ||
        Number(formData.duration) < 1 ||
        Number(formData.duration) > 86400
      )
    ) {
      setError(
        "Duration must be between 1 and 86400 seconds."
      );
      return;
    }

    requestRef.current = true;
    setUploading(true);

    try {
      const payload = new FormData();

      payload.append("title", formData.title.trim());

      if (formData.album) {
        payload.append("album", formData.album);
      }

      if (formData.genre.trim()) {
        payload.append(
          "genre",
          formData.genre.trim()
        );
      }

      if (formData.duration !== "") {
        payload.append(
          "duration",
          String(Number(formData.duration))
        );
      }

      if (formData.coverImage) {
        payload.append(
          "coverImage",
          formData.coverImage
        );
      }

      payload.append(
        "audioFile",
        formData.audioFile
      );

      console.info("ADD SONG REQUEST", {
        endpoint: `${API_BASE}/api/songs`,
        artistId: artist._id,
        title: formData.title.trim(),
        album: formData.album || null,
        genre: formData.genre || null,
        duration: formData.duration || null,
        audioSize: formatFileSize(
          formData.audioFile.size
        ),
        coverSize: formData.coverImage
          ? formatFileSize(formData.coverImage.size)
          : null,
      });

      /*
       * Let Axios/browser set the multipart Content-Type and boundary.
       *
       * Artist identity is resolved from the authenticated user by the
       * backend. Do not trust a client-supplied artist ID for authorization.
       */
      const response = await axios.post(
        `${API_BASE}/api/songs`,
        payload,
        {
          headers: {
            ...authHeaders(),
          },
          timeout: 120000,
        }
      );

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.message ||
            "The server could not create the song."
        );
      }

      setSuccess(
        response?.data?.message ||
          "Your song has been uploaded successfully!"
      );

      setFormData({
        title: "",
        album: "",
        genre: "",
        duration: "",
        coverImage: null,
        audioFile: null,
      });

      setAudioDuration(null);

      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }

      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/artist/songs", {
          state: {
            message: "Song uploaded successfully.",
          },
        });
      }, 1200);
    } catch (err) {
      console.error(
        "ADD SONG ERROR:",
        err?.response?.data || err
      );

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        setError(
          "Your session has expired. Please sign in again."
        );

        redirectTimerRef.current = window.setTimeout(() => {
          navigate("/signin");
        }, 1200);

        return;
      }

      setError(getErrorMessage(err));
    } finally {
      requestRef.current = false;
      setUploading(false);
    }
  };

  /*
   * Reusable theme-aware field classes.
   */
  const inputClass =
    "w-full rounded-2xl px-4 py-3.5 text-sm outline-none " +
    "transition-all duration-200 placeholder:opacity-50 " +
    "focus:border-[var(--theme-primary)] focus:ring-2 " +
    "focus:ring-[var(--theme-primary)]/15 disabled:cursor-not-allowed " +
    "disabled:opacity-50";

  const panelClass =
    "rounded-3xl p-5 sm:p-7";

  const iconBoxStyle = {
    backgroundColor: "var(--theme-background)",
    border: "1px solid var(--theme-border)",
    boxShadow:
      "inset 3px 3px 7px var(--theme-shadowDark), " +
      "inset -3px -3px 7px var(--theme-shadowLight)",
    color: "var(--theme-primary)",
  };

  const secondaryIconStyle = {
    ...iconBoxStyle,
    color: "var(--theme-secondary)",
  };

  /*
   * Loading screen.
   */
  if (loadingArtist) {
    return (
      <main
        className="min-h-screen px-4 py-12 sm:px-6"
        style={{
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
        }}
      >
        <div
          className="mx-auto flex max-w-5xl items-center justify-center gap-4 rounded-3xl p-10"
          style={raisedStyle}
        >
          <Loader2
            className="h-6 w-6 animate-spin"
            style={primaryTextStyle}
          />

          <span
            className="text-sm font-medium"
            style={mutedTextStyle}
          >
            Loading your artist studio...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen overflow-hidden px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={raisedSmallStyle}
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  color: "var(--theme-primary)",
                  border: "1px solid var(--theme-border)",
                }}
              >
                <AudioLines size={14} />
                Artist Studio
                <Sparkles size={12} />
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                Upload a{" "}
                <span style={primaryTextStyle}>
                  Song
                </span>
              </h1>

              <p
                className="mt-2 max-w-xl text-sm leading-6"
                style={mutedTextStyle}
              >
                Bring your next track to JOY MUSIC. Add your
                music, artwork, and details in one place.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchArtist();
              fetchAlbums();
            }}
            disabled={uploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl px-4 py-3 text-xs font-bold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            style={raisedSmallStyle}
          >
            <RefreshCw
              size={15}
              className={
                loadingAlbums ? "animate-spin" : ""
              }
            />
            Refresh data
          </button>
        </header>

        {/* Artist profile error */}
        {pageError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6"
            style={statusErrorStyle}
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p>{pageError}</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="rounded-xl px-3 py-2 text-xs font-bold"
                  style={raisedSmallStyle}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={fetchArtist}
                  disabled={loadingArtist}
                  className="rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50"
                  style={raisedSmallStyle}
                >
                  Retry profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Artist information */}
        {artist && (
          <section
            className={`${panelClass} mb-7`}
            style={raisedStyle}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={iconBoxStyle}
              >
                <Music2 size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={mutedTextStyle}
                >
                  Uploading as
                </p>

                <h2 className="mt-1 truncate text-base font-bold">
                  {artist.name ||
                    artist.stageName ||
                    "Artist"}
                </h2>

                <p
                  className="mt-1 text-xs"
                  style={mutedTextStyle}
                >
                  Your artist account
                </p>
              </div>

              {artist.verified && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: "var(--theme-secondary)",
                    backgroundColor: "var(--theme-background)",
                    border: "1px solid var(--theme-border)",
                  }}
                >
                  <CheckCircle2 size={13} />
                  Verified artist
                </span>
              )}
            </div>
          </section>
        )}

        {/* Form messages */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6"
            style={statusErrorStyle}
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span className="min-w-0 flex-1 break-words">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 transition hover:opacity-70"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm leading-6"
            style={statusSuccessStyle}
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{success}</span>
          </div>
        )}

        {/* Song upload form */}
        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left column */}
            <section
              className={panelClass}
              style={raisedStyle}
            >
              <div className="mb-7 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={iconBoxStyle}
                >
                  <Disc3 size={21} />
                </div>

                <div>
                  <h2 className="font-bold">
                    Song information
                  </h2>

                  <p
                    className="mt-1 text-xs"
                    style={mutedTextStyle}
                  >
                    Tell listeners about your track.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Song title */}
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-xs font-bold"
                    style={labelStyle}
                  >
                    Song title{" "}
                    <span style={statusErrorStyle}>*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your song title"
                    maxLength={150}
                    autoComplete="off"
                    required
                    disabled={uploading}
                    className={inputClass}
                    style={{
                      ...insetStyle,
                      color: "var(--theme-text)",
                    }}
                  />

                  <p
                    className="mt-2 text-right text-[10px]"
                    style={mutedTextStyle}
                  >
                    {formData.title.length}/150 characters
                  </p>
                </div>

                {/* Album */}
                <div>
                  <label
                    htmlFor="album"
                    className="mb-2 block text-xs font-bold"
                    style={labelStyle}
                  >
                    Album
                  </label>

                  <select
                    id="album"
                    name="album"
                    value={formData.album}
                    onChange={handleChange}
                    disabled={uploading}
                    className={`${inputClass} appearance-none`}
                    style={{
                      ...insetStyle,
                      color: "var(--theme-text)",
                    }}
                  >
                    <option
                      value=""
                      style={{
                        backgroundColor: "var(--theme-surface)",
                      }}
                    >
                      Single / No album
                    </option>

                    {albums.map((album) => (
                      <option
                        key={album._id}
                        value={album._id}
                        style={{
                          backgroundColor: "var(--theme-surface)",
                        }}
                      >
                        {album.title ||
                          album.name ||
                          "Untitled album"}
                      </option>
                    ))}
                  </select>

                  <p
                    className="mt-2 text-[10px] leading-5"
                    style={mutedTextStyle}
                  >
                    {loadingAlbums
                      ? "Loading your albums..."
                      : `${albums.length} album${
                          albums.length === 1 ? "" : "s"
                        } available`}
                  </p>
                </div>

                {/* Genre and duration */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="genre"
                      className="mb-2 flex items-center gap-2 text-xs font-bold"
                      style={labelStyle}
                    >
                      <Tags
                        size={14}
                        style={primaryTextStyle}
                      />
                      Genre
                    </label>

                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      disabled={uploading}
                      className={`${inputClass} appearance-none`}
                      style={{
                        ...insetStyle,
                        color: "var(--theme-text)",
                      }}
                    >
                      <option
                        value=""
                        style={{
                          backgroundColor: "var(--theme-surface)",
                        }}
                      >
                        Select genre
                      </option>

                      {GENRES.map((genre) => (
                        <option
                          key={genre}
                          value={genre.toLowerCase()}
                          style={{
                            backgroundColor: "var(--theme-surface)",
                          }}
                        >
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="duration"
                      className="mb-2 flex items-center gap-2 text-xs font-bold"
                      style={labelStyle}
                    >
                      <Clock3
                        size={14}
                        style={primaryTextStyle}
                      />
                      Duration (seconds)
                    </label>

                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      max="86400"
                      step="1"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g. 210"
                      disabled={uploading}
                      className={inputClass}
                      style={{
                        ...insetStyle,
                        color: "var(--theme-text)",
                      }}
                    />

                    <p
                      className="mt-2 text-[10px]"
                      style={mutedTextStyle}
                    >
                      Optional if your server calculates duration.
                    </p>
                  </div>
                </div>

                {/* Audio file */}
                <div>
                  <label
                    className="mb-2 block text-xs font-bold"
                    style={labelStyle}
                  >
                    Audio file{" "}
                    <span style={statusErrorStyle}>*</span>
                  </label>

                  <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.ogg,.aac,.flac,.webm,audio/*"
                    onChange={handleAudioChange}
                    className="sr-only"
                    disabled={uploading}
                  />

                  {!formData.audioFile ? (
                    <button
                      type="button"
                      onClick={() =>
                        audioInputRef.current?.click()
                      }
                      disabled={uploading}
                      className="group flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition hover:scale-[1.005] disabled:opacity-50"
                      style={{
                        ...insetStyle,
                        borderColor: "var(--theme-primary)",
                      }}
                    >
                      <div
                        className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl transition group-hover:scale-105"
                        style={iconBoxStyle}
                      >
                        <Upload
                          size={23}
                          style={primaryTextStyle}
                        />
                      </div>

                      <span className="text-sm font-bold">
                        Choose an audio file
                      </span>

                      <span
                        className="mt-2 text-xs"
                        style={mutedTextStyle}
                      >
                        MP3, WAV, M4A, OGG, AAC, FLAC or WEBM
                      </span>

                      <span
                        className="mt-1 text-[10px]"
                        style={mutedTextStyle}
                      >
                        Maximum size: 50 MB
                      </span>
                    </button>
                  ) : (
                    <div
                      className="rounded-2xl p-4"
                      style={insetStyle}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={iconBoxStyle}
                        >
                          <FileAudio size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-bold">
                            {formData.audioFile.name}
                          </p>

                          <p
                            className="mt-1 text-xs"
                            style={mutedTextStyle}
                          >
                            {formatFileSize(
                              formData.audioFile.size
                            )}
                            {" · "}
                            {formData.audioFile.type ||
                              "Audio MIME type unavailable"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeAudio}
                          disabled={uploading}
                          aria-label="Remove audio file"
                          className="rounded-xl p-2 transition hover:opacity-70 disabled:opacity-40"
                          style={mutedTextStyle}
                        >
                          <X size={17} />
                        </button>
                      </div>

                      {audioPreviewUrl && (
                        <audio
                          className="mt-4 w-full"
                          controls
                          preload="metadata"
                          src={audioPreviewUrl}
                          onLoadedMetadata={(event) => {
                            const duration =
                              event.currentTarget.duration;

                            if (
                              Number.isFinite(duration) &&
                              duration > 0
                            ) {
                              setAudioDuration(duration);
                            }
                          }}
                        >
                          Your browser does not support audio playback.
                        </audio>
                      )}

                      {audioDuration !== null && (
                        <p
                          className="mt-2 text-xs"
                          style={mutedTextStyle}
                        >
                          Detected duration:{" "}
                          {Math.floor(audioDuration)} seconds
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          audioInputRef.current?.click()
                        }
                        disabled={uploading}
                        className="mt-3 text-xs font-bold transition hover:opacity-75 disabled:opacity-40"
                        style={primaryTextStyle}
                      >
                        Choose a different file
                      </button>
                    </div>
                  )}

                  <p
                    className="mt-3 text-[10px] leading-5"
                    style={mutedTextStyle}
                  >
                    File extensions are checked in the browser.
                    Your backend must also validate actual file
                    contents and formats.
                  </p>
                </div>
              </div>
            </section>

            {/* Right column */}
            <div className="space-y-6">
              {/* Cover artwork */}
              <section
                className="rounded-3xl p-5 sm:p-6"
                style={raisedStyle}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={secondaryIconStyle}
                  >
                    <ImageIcon size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Cover artwork
                    </h2>

                    <p
                      className="mt-1 text-xs"
                      style={mutedTextStyle}
                    >
                      Optional single or album artwork.
                    </p>
                  </div>
                </div>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/*"
                  onChange={handleCoverChange}
                  className="sr-only"
                  disabled={uploading}
                />

                <button
                  type="button"
                  onClick={() =>
                    coverInputRef.current?.click()
                  }
                  disabled={uploading}
                  aria-label={
                    coverPreviewUrl
                      ? "Change cover artwork"
                      : "Add cover artwork"
                  }
                  className="group relative mx-auto flex aspect-square w-full max-w-xs flex-col items-center justify-center overflow-hidden rounded-2xl transition hover:scale-[1.01] disabled:opacity-50"
                  style={insetStyle}
                >
                  {coverPreviewUrl ? (
                    <>
                      <img
                        src={coverPreviewUrl}
                        alt="Selected song cover preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      <span className="absolute inset-x-0 bottom-0 bg-black/75 px-4 py-3 text-center text-xs font-bold text-white">
                        Change artwork
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition group-hover:scale-105"
                        style={secondaryIconStyle}
                      >
                        <ImageIcon size={28} />
                      </div>

                      <span className="text-sm font-bold">
                        Add cover artwork
                      </span>

                      <span
                        className="mt-2 text-xs"
                        style={mutedTextStyle}
                      >
                        JPG, PNG or WEBP
                      </span>
                    </>
                  )}
                </button>

                {formData.coverImage && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p
                      className="min-w-0 break-all text-xs"
                      style={mutedTextStyle}
                    >
                      {formData.coverImage.name}
                      <span className="ml-2">
                        ({formatFileSize(
                          formData.coverImage.size
                        )})
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={removeCover}
                      disabled={uploading}
                      aria-label="Remove cover image"
                      className="shrink-0 rounded-xl p-2 transition hover:opacity-70 disabled:opacity-40"
                      style={mutedTextStyle}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <p
                  className="mt-4 text-[10px] leading-5"
                  style={mutedTextStyle}
                >
                  Maximum artwork size: 8 MB.
                </p>
              </section>

              {/* Upload checklist */}
              <section
                className="rounded-3xl p-5 sm:p-6"
                style={raisedStyle}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={secondaryIconStyle}
                  >
                    <CheckCircle2 size={19} />
                  </div>

                  <h2 className="font-bold">
                    Before you upload
                  </h2>
                </div>

                <ul
                  className="space-y-3 text-xs leading-5"
                  style={mutedTextStyle}
                >
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                    />
                    Choose an audio file supported by your server.
                  </li>

                  <li className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                    />
                    Double-check the song title and metadata.
                  </li>

                  <li className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                    />
                    Upload only music and artwork you have permission to use.
                  </li>
                </ul>
              </section>

              {/* Submit button */}
              <button
                type="submit"
                disabled={
                  uploading ||
                  !artist?._id ||
                  !formData.title.trim() ||
                  !formData.audioFile
                }
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-black tracking-wide transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
                style={primaryButtonStyle}
              >
                {uploading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Uploading your song...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload song
                  </>
                )}
              </button>

              <p
                className="text-center text-[10px] leading-5"
                style={mutedTextStyle}
              >
                Keep this page open while your song uploads.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AddSongs;