
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  Users,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../config/api";

const API_BASE = BASE_URL.replace(/\/+$/, "");
const DEFAULT_IMAGE = "/image/default-cover.jpg";

const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") {
    return DEFAULT_IMAGE;
  }

  const path = imagePath.trim();

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE}/${path.replace(/^\/+/, "")}`;
};

const cardStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "10px 10px 22px var(--theme-shadowDark), -10px -10px 22px var(--theme-shadowLight)",
};

const raisedStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "5px 5px 11px var(--theme-shadowDark), -5px -5px 11px var(--theme-shadowLight)",
};

const insetStyle = {
  backgroundColor: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
};

const primaryButtonStyle = {
  background:
    "var(--theme-gradient, linear-gradient(135deg, var(--theme-primary), var(--theme-secondary)))",
  color: "var(--theme-text)",
  border: "1px solid var(--theme-border)",
  boxShadow:
    "5px 5px 12px var(--theme-shadowDark), -5px -5px 12px var(--theme-shadowLight)",
};

const textStyle = { color: "var(--theme-text)" };
const mutedStyle = { color: "var(--theme-textMuted)" };
const primaryTextStyle = { color: "var(--theme-primary)" };
const secondaryTextStyle = { color: "var(--theme-secondary)" };

const EditProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const previewUrlRef = useRef("");
  const mountedRef = useRef(true);

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [form, setForm] = useState({
    name: "",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const setFeedback = useCallback((type, text) => {
    setMessage({ type, text });
  }, []);

  const clearObjectPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearObjectPreview();
    };
  }, [clearObjectPreview]);

  // -----------------------------------------------------
  // FETCH ARTIST PROFILE
  // -----------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    const fetchArtistProfile = async () => {
      if (!token) {
        navigate("/signin", { replace: true });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get(
          `${API_BASE}/api/artists/me`,
          {
            ...authConfig,
            signal: controller.signal,
          }
        );

        const data = response.data?.artist || response.data;

        if (!data || typeof data !== "object") {
          throw new Error("Artist profile data is missing.");
        }

        setArtist(data);

        setForm({
          name: data.name || "",
          bio: data.bio || "",
        });

        clearObjectPreview();
        setImage(null);
        setImageLoadFailed(false);
        setPreview(getImageUrl(data.image));
      } catch (error) {
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("FETCH ARTIST PROFILE ERROR:", error);
        console.error("SERVER RESPONSE:", error.response?.data);

        setFeedback(
          "error",
          error.response?.data?.message ||
            error.message ||
            "Unable to load artist profile."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchArtistProfile();

    return () => controller.abort();
    // The token is captured for this mounted page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token, setFeedback, clearObjectPreview]);

  // -----------------------------------------------------
  // PROFILE FORM
  // -----------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -----------------------------------------------------
  // PROFILE IMAGE
  // -----------------------------------------------------

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setFeedback("error", "Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFeedback("error", "Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    clearObjectPreview();

    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;

    setImage(selectedFile);
    setPreview(objectUrl);
    setImageLoadFailed(false);
    setFeedback("", "");
  };

  const handleImageError = () => {
    if (previewUrlRef.current && !imageLoadFailed) {
      setImageLoadFailed(true);
      setPreview(DEFAULT_IMAGE);
    }
  };

  // -----------------------------------------------------
  // SAVE PROFILE
  // -----------------------------------------------------

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setFeedback("error", "Artist name is required.");
      return;
    }

    if (form.name.trim().length > 100) {
      setFeedback("error", "Artist name cannot exceed 100 characters.");
      return;
    }

    if (form.bio.length > 500) {
      setFeedback("error", "Bio cannot exceed 500 characters.");
      return;
    }

    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    try {
      setSavingProfile(true);
      setFeedback("", "");

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("bio", form.bio.trim());

      if (image) {
        formData.append("image", image);
      }

      const response = await axios.put(
        `${API_BASE}/api/artists/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedArtist =
        response.data?.artist || response.data;

      if (!updatedArtist || typeof updatedArtist !== "object") {
        throw new Error("The server returned an invalid profile response.");
      }

      setArtist((previous) => ({
        ...previous,
        ...updatedArtist,
      }));

      setForm({
        name: updatedArtist.name ?? form.name.trim(),
        bio: updatedArtist.bio ?? form.bio.trim(),
      });

      clearObjectPreview();
      setImage(null);
      setImageLoadFailed(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setPreview(
        updatedArtist.image
          ? `${getImageUrl(updatedArtist.image)}${
              getImageUrl(updatedArtist.image).includes("?") ? "&" : "?"
            }t=${Date.now()}`
          : preview
      );

      setFeedback("success", "Profile updated successfully.");
    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);
      console.error("SERVER STATUS:", error.response?.status);
      console.error("SERVER RESPONSE:", error.response?.data);
      console.error("REQUEST URL:", error.config?.url);

      setFeedback(
        "error",
        error.response?.data?.message ||
          error.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // -----------------------------------------------------
  // PASSWORD FORM
  // -----------------------------------------------------

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const togglePassword = (field) => {
    setShowPassword((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  // -----------------------------------------------------
  // CHANGE PASSWORD
  // -----------------------------------------------------

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback("error", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setFeedback(
        "error",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword === currentPassword) {
      setFeedback(
        "error",
        "Your new password must differ from your current password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback("error", "The new passwords do not match.");
      return;
    }

    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }

    try {
      setSavingPassword(true);
      setFeedback("", "");

      await axios.put(
        `${API_BASE}/api/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        authConfig
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPassword({
        current: false,
        new: false,
        confirm: false,
      });

      setFeedback("success", "Password changed successfully.");
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      setFeedback(
        "error",
        error.response?.data?.message ||
          "Failed to change password. Check your current password and try again."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // -----------------------------------------------------
  // LOADING
  // -----------------------------------------------------

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
        }}
      >
        <div
          className="flex flex-col items-center gap-4 rounded-3xl p-8"
          style={cardStyle}
        >
          <Loader2
            size={38}
            className="animate-spin"
            style={primaryTextStyle}
          />
          <p className="text-sm" style={mutedStyle}>
            Loading artist profile...
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // MAIN UI
  // -----------------------------------------------------

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={primaryTextStyle}
            >
              <ShieldCheck size={15} />
              Artist Account
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Edit Profile
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6" style={mutedStyle}>
              Manage your public artist identity, profile details, and account
              security.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl px-4 py-3 text-sm transition hover:-translate-y-0.5"
            style={raisedStyle}
          >
            <ArrowLeft size={17} />
            Back
          </button>
        </header>

        {/* GLOBAL FEEDBACK */}
        {message.text && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-4"
            style={{
              backgroundColor: "var(--theme-surface)",
              border: "1px solid var(--theme-border)",
              boxShadow:
                "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)",
              color:
                message.type === "success"
                  ? "var(--theme-secondary)"
                  : "var(--theme-danger, #f87171)",
            }}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
            )}

            <p className="text-sm leading-6">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.8fr)]">
          {/* LEFT: ARTIST INFORMATION */}
          <form
            onSubmit={handleSaveProfile}
            className="min-w-0 rounded-3xl p-5 sm:p-7 md:p-8"
            style={cardStyle}
          >
            <SectionHeading
              icon={<UserRound size={21} />}
              title="Artist Information"
              subtitle="Your public artist profile"
              accent="primary"
            />

            {/* PROFILE IMAGE */}
            <div className="mb-9 flex flex-col items-center">
              <div className="relative">
                <div
                  className="h-36 w-36 overflow-hidden rounded-full p-1.5 sm:h-40 sm:w-40"
                  style={raisedStyle}
                >
                  <img
                    src={preview || DEFAULT_IMAGE}
                    alt="Artist profile"
                    onError={handleImageError}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Choose profile image"
                  className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105"
                  style={{
                    ...raisedStyle,
                    color: "var(--theme-primary)",
                  }}
                >
                  <Camera size={19} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm transition"
                style={primaryTextStyle}
              >
                <ImagePlus size={16} />
                Change profile image
              </button>

              <p className="mt-1 text-center text-xs" style={mutedStyle}>
                JPG, PNG, WEBP or GIF · Maximum 5 MB
              </p>

              {image && (
                <p
                  className="mt-2 max-w-full break-all text-center text-xs"
                  style={secondaryTextStyle}
                >
                  Selected: {image.name}
                </p>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* ARTIST NAME */}
            <FormField label="Artist Name" htmlFor="artist-name">
              <div
                className="flex items-center gap-3 rounded-2xl px-4"
                style={insetStyle}
              >
                <UserRound
                  size={18}
                  className="shrink-0"
                  style={mutedStyle}
                />
                <input
                  id="artist-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Enter your artist name"
                  required
                  className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none"
                  style={textStyle}
                />
              </div>
            </FormField>

            {/* EMAIL */}
            <FormField label="Email Address" htmlFor="artist-email">
              <div
                className="flex items-center gap-3 rounded-2xl px-4 opacity-80"
                style={insetStyle}
              >
                <Mail
                  size={18}
                  className="shrink-0"
                  style={mutedStyle}
                />
                <input
                  id="artist-email"
                  type="email"
                  value={artist?.user?.email || artist?.email || ""}
                  disabled
                  autoComplete="email"
                  className="min-w-0 flex-1 cursor-not-allowed bg-transparent py-4 text-sm outline-none"
                  style={mutedStyle}
                />
                <ShieldCheck size={16} style={secondaryTextStyle} />
              </div>
              <p className="mt-2 text-xs" style={mutedStyle}>
                Email address cannot be changed here.
              </p>
            </FormField>

            {/* BIO */}
            <FormField label="Artist Bio" htmlFor="artist-bio">
              <textarea
                id="artist-bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={6}
                maxLength={500}
                placeholder="Tell listeners about your music, journey, and inspiration..."
                className="w-full resize-y rounded-2xl p-4 text-sm leading-6 outline-none transition"
                style={{
                  ...insetStyle,
                  ...textStyle,
                  minHeight: "140px",
                }}
              />
              <div
                className="mt-2 flex items-center justify-between gap-3 text-xs"
                style={mutedStyle}
              >
                <span>Make your artist story memorable.</span>
                <span>{form.bio.length}/500</span>
              </div>
            </FormField>

            {/* ARTIST STATS */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                icon={<Users size={17} />}
                label="Followers"
                value={Number(artist?.followers || 0).toLocaleString()}
                accent="primary"
              />

              <StatCard
                icon={<ShieldCheck size={17} />}
                label="Artist Status"
                value={artist?.verified ? "Verified" : "Artist"}
                accent="secondary"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={primaryButtonStyle}
            >
              {savingProfile ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving profile...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Profile Changes
                </>
              )}
            </button>
          </form>

          {/* RIGHT COLUMN */}
          <div className="min-w-0 space-y-6">
            {/* ACCOUNT STATUS */}
            <section className="rounded-3xl p-5 sm:p-6" style={cardStyle}>
              <SectionHeading
                icon={<ShieldCheck size={21} />}
                title="Account Status"
                subtitle="Your artist account overview"
                accent="secondary"
              />

              <div
                className="mb-5 rounded-2xl p-4"
                style={insetStyle}
              >
                <p className="mb-2 text-xs uppercase tracking-wider" style={mutedStyle}>
                  Account role
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold" style={textStyle}>
                    Artist Account
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      color: "var(--theme-primary)",
                      backgroundColor: "var(--theme-background)",
                      border: "1px solid var(--theme-border)",
                    }}
                  >
                    Artist
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <StatusRow
                  label="Verification"
                  value={artist?.verified ? "Verified" : "Not verified"}
                  accent={artist?.verified ? "secondary" : "muted"}
                />
                <StatusRow
                  label="Followers"
                  value={Number(artist?.followers || 0).toLocaleString()}
                />
                <StatusRow
                  label="Profile name"
                  value={artist?.name || "Not set"}
                />
              </div>

              <div
                className="mt-6 flex items-start gap-3 rounded-2xl p-4"
                style={insetStyle}
              >
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0"
                  style={secondaryTextStyle}
                />
                <p className="text-xs leading-5" style={mutedStyle}>
                  Keep your artist details accurate so listeners can recognize
                  your profile.
                </p>
              </div>
            </section>

            {/* CHANGE PASSWORD */}
            <form
              onSubmit={handleChangePassword}
              className="rounded-3xl p-5 sm:p-6"
              style={cardStyle}
            >
              <SectionHeading
                icon={<KeyRound size={21} />}
                title="Change Password"
                subtitle="Keep your account secure"
                accent="primary"
              />

              <PasswordInput
                label="Current Password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                show={showPassword.current}
                onToggle={() => togglePassword("current")}
                autoComplete="current-password"
              />

              <PasswordInput
                label="New Password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                show={showPassword.new}
                onToggle={() => togglePassword("new")}
                autoComplete="new-password"
                minLength={8}
              />

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                show={showPassword.confirm}
                onToggle={() => togglePassword("confirm")}
                autoComplete="new-password"
                minLength={8}
              />

              <div
                className="mb-5 rounded-xl px-3 py-3 text-xs leading-5"
                style={{
                  backgroundColor: "var(--theme-background)",
                  color: "var(--theme-textMuted)",
                  border: "1px solid var(--theme-border)",
                }}
              >
                Use at least 8 characters. A unique password is safer than
                reusing one from another account.
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={raisedStyle}
              >
                {savingPassword ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    <KeyRound size={17} style={primaryTextStyle} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SECTION HEADING
// =====================================================

const SectionHeading = ({ icon, title, subtitle, accent = "primary" }) => {
  const accentColor =
    accent === "secondary"
      ? "var(--theme-secondary)"
      : "var(--theme-primary)";

  return (
    <div className="mb-7 flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{
          ...insetStyle,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="font-semibold tracking-tight" style={textStyle}>
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5" style={mutedStyle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

// =====================================================
// FORM FIELD
// =====================================================

const FormField = ({ label, htmlFor, children }) => (
  <div className="mb-5">
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-semibold uppercase tracking-wider"
      style={mutedStyle}
    >
      {label}
    </label>
    {children}
  </div>
);

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({ icon, label, value, accent = "primary" }) => {
  const accentColor =
    accent === "secondary"
      ? "var(--theme-secondary)"
      : "var(--theme-primary)";

  return (
    <div className="rounded-2xl p-4" style={insetStyle}>
      <div
        className="mb-3 flex items-center gap-2 text-xs"
        style={mutedStyle}
      >
        <span style={{ color: accentColor }}>{icon}</span>
        {label}
      </div>
      <p className="break-words text-lg font-semibold" style={textStyle}>
        {value}
      </p>
    </div>
  );
};

// =====================================================
// PASSWORD INPUT
// =====================================================

const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  minLength,
}) => (
  <div className="mb-4">
    <label
      htmlFor={name}
      className="mb-2 block text-xs font-semibold uppercase tracking-wider"
      style={mutedStyle}
    >
      {label}
    </label>

    <div
      className="flex items-center gap-3 rounded-2xl px-4"
      style={insetStyle}
    >
      <KeyRound
        size={17}
        className="shrink-0"
        style={mutedStyle}
      />

      <input
        id={name}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none"
        style={textStyle}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={show}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition"
        style={mutedStyle}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  </div>
);

// =====================================================
// STATUS ROW
// =====================================================

const StatusRow = ({ label, value, accent = "default" }) => {
  const valueColor =
    accent === "secondary"
      ? "var(--theme-secondary)"
      : accent === "primary"
        ? "var(--theme-primary)"
        : accent === "muted"
          ? "var(--theme-textMuted)"
          : "var(--theme-text)";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm" style={mutedStyle}>
        {label}
      </span>
      <span
        className="break-words text-right text-sm font-medium"
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
};

export default EditProfile;
