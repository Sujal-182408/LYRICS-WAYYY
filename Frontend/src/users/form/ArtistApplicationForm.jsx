import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  ExternalLink,
  ShieldCheck,
  Music2,
  Image as ImageIcon,
  Loader2,
  Send,
  X,
  CheckCircle2,
} from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_SONG_SIZE = 50 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SONG_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  "audio/mp4",
  "audio/x-m4a",
];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const SONG_EXTENSIONS = [".mp3", ".wav", ".m4a"];

const formatDuration = (seconds) => {
  const value = Number(seconds);

  if (!Number.isFinite(value) || value < 0) {
    return "--:--";
  }

  const minutes = Math.floor(value / 60);
  const remaining = Math.floor(value % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
};

const getFileExtension = (filename = "") => {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
};

const getSongTitleFromFile = (filename = "") => {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const createChangeEvent = (name, value) => ({
  target: { name, value },
});

export default function ArtistApplicationForm({
  form,
  handleFormChange,
  handleArtistSubmit,
  closeArtistModal,
  submitting,
  neuInset = "",
  neuSmall = "",
}) {
  const imageInputRef = useRef(null);
  const songInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState("");

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================
  useEffect(() => {
    const imageFile = form?.artistImage;

    if (
      typeof File === "undefined" ||
      !(imageFile instanceof File)
    ) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form?.artistImage]);

  // =====================================================
  // SONG METADATA
  // Duration is stored as seconds, not "MM:SS".
  // =====================================================
  useEffect(() => {
    const songFile = form?.verificationSong;

    if (
      typeof File === "undefined" ||
      !(songFile instanceof File)
    ) {
      return;
    }

    const objectUrl = URL.createObjectURL(songFile);
    const audio = new Audio();

    let isActive = true;

    audio.preload = "metadata";
    audio.src = objectUrl;

    const handleMetadata = () => {
      if (!isActive) return;

      const durationSeconds = Number(audio.duration);

      // Store a valid non-negative number of seconds.
      const safeDuration =
        Number.isFinite(durationSeconds) && durationSeconds >= 0
          ? Math.floor(durationSeconds)
          : 0;

      handleFormChange(
        createChangeEvent("verificationSongMetadata", {
          title: getSongTitleFromFile(songFile.name),
          duration: safeDuration,
          durationFormatted: formatDuration(safeDuration),
        })
      );
    };

    const handleError = () => {
      if (!isActive) return;

      handleFormChange(
        createChangeEvent(
          "fileValidationError",
          "The audio metadata could not be read. You can still submit the selected audio file."
        )
      );
    };

    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("error", handleError);

    return () => {
      isActive = false;

      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("error", handleError);

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      URL.revokeObjectURL(objectUrl);
    };
  }, [form?.verificationSong, handleFormChange]);

  // =====================================================
  // IMAGE SELECT
  // =====================================================
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = getFileExtension(file.name);
    const mimeTypeValid =
      !file.type || IMAGE_TYPES.includes(file.type);

    if (
      !IMAGE_EXTENSIONS.includes(extension) ||
      !mimeTypeValid
    ) {
      handleFormChange(
        createChangeEvent(
          "fileValidationError",
          "Only JPG, JPEG, PNG, or WEBP artist images are allowed."
        )
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      handleFormChange(
        createChangeEvent(
          "fileValidationError",
          "Artist image must be 5 MB or smaller."
        )
      );

      event.target.value = "";
      return;
    }

    handleFormChange(
      createChangeEvent("artistImage", file)
    );

    handleFormChange(
      createChangeEvent("fileValidationError", "")
    );
  };

  // =====================================================
  // SONG SELECT
  // =====================================================
  const handleSongChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = getFileExtension(file.name);
    const mimeTypeValid =
      !file.type || SONG_TYPES.includes(file.type);

    if (
      !SONG_EXTENSIONS.includes(extension) ||
      !mimeTypeValid
    ) {
      handleFormChange(
        createChangeEvent(
          "fileValidationError",
          "Only MP3, WAV, or M4A verification songs are allowed."
        )
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_SONG_SIZE) {
      handleFormChange(
        createChangeEvent(
          "fileValidationError",
          "Verification song must be 50 MB or smaller."
        )
      );

      event.target.value = "";
      return;
    }

    handleFormChange(
      createChangeEvent("verificationSong", file)
    );

    handleFormChange(
      createChangeEvent("verificationSongTitle", "")
    );

    handleFormChange(
      createChangeEvent("verificationSongDuration", 0)
    );

    handleFormChange(
      createChangeEvent("fileValidationError", "")
    );
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================
  const removeImage = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    handleFormChange(
      createChangeEvent("artistImage", null)
    );

    handleFormChange(
      createChangeEvent("fileValidationError", "")
    );
  };

  // =====================================================
  // REMOVE SONG
  // =====================================================
  const removeSong = () => {
    if (songInputRef.current) {
      songInputRef.current.value = "";
    }

    handleFormChange(
      createChangeEvent("verificationSong", null)
    );

    handleFormChange(
      createChangeEvent("verificationSongTitle", "")
    );

    handleFormChange(
      createChangeEvent("verificationSongDuration", 0)
    );

    handleFormChange(
      createChangeEvent("fileValidationError", "")
    );
  };

  // =====================================================
  // FORM VALIDATION
  // =====================================================
  const isValid =
    Boolean(form?.artistName?.trim()) &&
    Boolean(form?.genre?.trim()) &&
    Boolean(form?.bio?.trim()) &&
    Boolean(form?.artistImage) &&
    Boolean(form?.portfolioUrl?.trim()) &&
    Boolean(form?.verificationSong);

  const inputClass = `${neuInset} w-full rounded-2xl border-0 px-4 py-3.5 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)] disabled:cursor-not-allowed disabled:opacity-50`;

  const labelClass =
    "mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--theme-muted)]";

  const fileButtonClass =
    "mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-400 transition hover:text-red-300 disabled:opacity-50";

  const displayedDuration = Number(
    form?.verificationSongDuration
  );

  return (
    <form
      onSubmit={handleArtistSubmit}
      className="mt-6 space-y-6"
      noValidate
    >
      {/* ARTIST INFORMATION */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>
            Artist Name <span className="text-red-400">*</span>
          </span>

          <input
            type="text"
            name="artistName"
            value={form?.artistName || ""}
            onChange={handleFormChange}
            placeholder="Your artist name"
            maxLength={100}
            disabled={submitting}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>
            Genre <span className="text-red-400">*</span>
          </span>

          <input
            type="text"
            name="genre"
            value={form?.genre || ""}
            onChange={handleFormChange}
            placeholder="Pop, Hip-Hop, EDM..."
            maxLength={80}
            disabled={submitting}
            required
            className={inputClass}
          />
        </label>
      </div>

      {/* DESCRIPTION */}
      <label className="block">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className={labelClass}>
            Description <span className="text-red-400">*</span>
          </span>

          <span className="text-[10px] text-[var(--theme-muted)]">
            {(form?.bio || "").length}/2000
          </span>
        </div>

        <textarea
          name="bio"
          value={form?.bio || ""}
          onChange={handleFormChange}
          rows={5}
          maxLength={2000}
          required
          disabled={submitting}
          placeholder="Tell SuperAdmin about yourself, your music, experience and artistic identity..."
          className={`${inputClass} resize-none leading-6`}
        />
      </label>

      {/* ARTIST IMAGE */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>
            Artist Image <span className="text-red-400">*</span>
          </span>

          <span className="text-[10px] text-[var(--theme-muted)]">
            JPG / PNG / WEBP · Max 5 MB
          </span>
        </div>

        <label
          className={`${neuInset} group block cursor-pointer overflow-hidden rounded-2xl p-4 transition-all duration-200 hover:scale-[1.005]`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#15181d]">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Artist preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon
                  size={22}
                  className="text-[#8c7cf7]"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {form?.artistImage ? (
                <>
                  <p
                    className="truncate text-sm font-bold text-[var(--theme-text)]"
                    title={form.artistImage.name}
                  >
                    Selected: {form.artistImage.name}
                  </p>

                  <p className="mt-1 text-xs text-emerald-400">
                    ✓ Artist image ready
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-[var(--theme-text)]">
                    Upload your artist image
                  </p>

                  <p className="mt-1 text-xs text-[var(--theme-muted)]">
                    Use a clear profile or artist photo.
                  </p>
                </>
              )}
            </div>

            <Upload
              size={18}
              className="shrink-0 text-[#8c7cf7] transition-transform group-hover:scale-110"
            />
          </div>

          <input
            ref={imageInputRef}
            type="file"
            name="artistImage"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={submitting}
            className="hidden"
          />
        </label>

        {form?.artistImage && (
          <button
            type="button"
            onClick={removeImage}
            disabled={submitting}
            className={fileButtonClass}
          >
            <X size={14} />
            Remove selected image
          </button>
        )}
      </div>

      {/* SOCIAL / PORTFOLIO */}
      <label className="block">
        <span className={labelClass}>
          Social / Portfolio URL{" "}
          <span className="text-red-400">*</span>
        </span>

        <div className="relative">
          <ExternalLink
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]"
          />

          <input
            type="url"
            name="portfolioUrl"
            value={form?.portfolioUrl || ""}
            onChange={handleFormChange}
            placeholder="https://instagram.com/yourname"
            maxLength={500}
            disabled={submitting}
            required
            className={`${inputClass} pl-11`}
          />
        </div>

        <p className="mt-1.5 px-1 text-[10px] text-[var(--theme-muted)]">
          Instagram, YouTube, SoundCloud, personal website, portfolio, etc.
        </p>
      </label>

      {/* VERIFICATION SONG */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>
            Verification Song{" "}
            <span className="text-red-400">*</span>
          </span>

          <span className="text-[10px] text-[var(--theme-muted)]">
            MP3 / WAV / M4A · Max 50 MB
          </span>
        </div>

        <label
          className={`${neuInset} group block cursor-pointer rounded-2xl p-4 transition-all duration-200 hover:scale-[1.005]`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#15181d]">
              <Music2
                size={23}
                className="text-[#2bd4c4]"
              />
            </div>

            <div className="min-w-0 flex-1">
              {form?.verificationSong ? (
                <>
                  <p
                    className="truncate text-sm font-bold text-[var(--theme-text)]"
                    title={form.verificationSong.name}
                  >
                    Selected: {form.verificationSong.name}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-[var(--theme-text)]">
                      Song:{" "}
                      <strong>
                        {form?.verificationSongTitle ||
                          getSongTitleFromFile(
                            form.verificationSong.name
                          )}
                      </strong>
                    </span>

                    <span className="text-[var(--theme-muted)]">
                      Duration:{" "}
                      <strong>
                        {Number.isFinite(displayedDuration) &&
                        displayedDuration >= 0
                          ? formatDuration(displayedDuration)
                          : "--:--"}
                      </strong>
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] font-semibold text-emerald-400">
                    ✓ Ready for SuperAdmin verification
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-[var(--theme-text)]">
                    Upload your own song
                  </p>

                  <p className="mt-1 text-xs text-[var(--theme-muted)]">
                    This song will be reviewed by SuperAdmin.
                  </p>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2bd4c4]">
                    Click to choose an audio file
                  </p>
                </>
              )}
            </div>

            <Upload
              size={18}
              className="shrink-0 text-[#2bd4c4] transition-transform group-hover:scale-110"
            />
          </div>

          <input
            ref={songInputRef}
            type="file"
            name="verificationSong"
            accept=".mp3,.wav,.m4a,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave,audio/vnd.wave,audio/mp4,audio/x-m4a"
            onChange={handleSongChange}
            disabled={submitting}
            className="hidden"
          />
        </label>

        {form?.verificationSong && (
          <button
            type="button"
            onClick={removeSong}
            disabled={submitting}
            className={fileButtonClass}
          >
            <X size={14} />
            Remove selected song
          </button>
        )}
      </div>

      {/* SECURITY NOTICE */}
      <div className={`${neuInset} rounded-2xl p-4`}>
        <div className="flex gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#8c7cf7]"
          />

          <div>
            <p className="text-xs font-bold text-[var(--theme-text)]">
              Verification & security
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[var(--theme-muted)]">
              Your artist image and verification song are uploaded for
              review. The verification song remains private while your
              application is pending and is accessible only to authorized
              reviewers.
            </p>
          </div>
        </div>
      </div>

      {/* FILE VALIDATION ERROR */}
      {form?.fileValidationError && (
        <div
          role="alert"
          className={`${neuInset} rounded-2xl p-4`}
        >
          <p className="text-xs font-semibold leading-5 text-red-400">
            {form.fileValidationError}
          </p>
        </div>
      )}

      {/* SUBMIT STATUS */}
      {isValid && (
        <div className={`${neuInset} rounded-2xl p-4`}>
          <div className="flex items-center gap-3">
            <CheckCircle2
              size={18}
              className="text-emerald-400"
            />

            <div>
              <p className="text-xs font-bold text-emerald-400">
                Application ready
              </p>

              <p className="mt-1 text-[10px] text-[var(--theme-muted)]">
                Required information and verification files are selected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={closeArtistModal}
          disabled={submitting}
          className={`${neuSmall} rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--theme-muted)] transition hover:text-[var(--theme-text)] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || !isValid}
          className={`relative flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
            isValid && !submitting
              ? "bg-[#8c7cf7] text-white shadow-[0_8px_20px_rgba(140,124,247,.22)] hover:bg-[#9b8cff] active:scale-[.98]"
              : `${neuSmall} cursor-not-allowed text-[var(--theme-muted)] opacity-60`
          }`}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit for Verification
            </>
          )}
        </button>
      </div>
    </form>
  );
}
