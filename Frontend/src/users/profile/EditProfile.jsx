
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  UserRound,
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  ShieldCheck,
  Music2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { BASE_URL } from "../../config/api";

// =====================================================
// THEME-AWARE NEUMORPHISM
// Uses the variables supplied by your existing ThemeContext.
// =====================================================

const neu = {
  backgroundColor: "var(--theme-surface)",
  borderColor: "var(--theme-border)",
  boxShadow:
    "8px 8px 18px var(--theme-shadowDark), -8px -8px 18px var(--theme-shadowLight)",
};

const neuSmall = {
  backgroundColor: "var(--theme-surface)",
  borderColor: "var(--theme-border)",
  boxShadow:
    "5px 5px 12px var(--theme-shadowDark), -5px -5px 12px var(--theme-shadowLight)",
};

const neuInset = {
  backgroundColor: "var(--theme-surface)",
  borderColor: "var(--theme-border)",
  boxShadow:
    "inset 5px 5px 12px var(--theme-shadowDark), inset -5px -5px 12px var(--theme-shadowLight)",
};

const inputStyle = {
  color: "var(--theme-text)",
};

const labelStyle = {
  color: "var(--theme-textMuted)",
};

const primaryStyle = {
  color: "var(--theme-primary)",
};

const secondaryStyle = {
  color: "var(--theme-secondary)",
};

// =====================================================
// IMAGE URL HELPER
// =====================================================

const getProfileImage = (image) => {
  if (!image) return "";

  const value = String(image).trim();

  if (!value) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  const base = String(BASE_URL || "").replace(/\/+$/, "");
  const normalized = value.replace(/^\/+/, "");

  return `${base}/${normalized}`;
};

// =====================================================
// COMPONENT
// =====================================================

export default function EditProfile() {
  const navigate = useNavigate();

  const { user, setUser } = useAuth();

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    profileImage: "",
  });

  // ===================================================
  // IMAGE
  // ===================================================

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ===================================================
  // UI
  // ===================================================

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ===================================================
  // IMAGE PREVIEW CLEANUP
  // ===================================================

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  };

  useEffect(() => {
    return () => {
      clearPreviewUrl();
    };
  }, []);

  // ===================================================
  // LOAD USER
  // ===================================================

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    let parsedUser = null;

    try {
      parsedUser = storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch (parseError) {
      console.error(
        "Failed to parse stored user:",
        parseError
      );
    }

    const currentUser = user || parsedUser;

    if (!currentUser) {
      navigate("/signin", { replace: true });
      return;
    }

    setForm({
      name: currentUser.name || "",
      email: currentUser.email || "",
      profileImage: currentUser.profileImage || "",
    });
  }, [user, navigate]);

  // ===================================================
  // HANDLE INPUT
  // ===================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // ===================================================
  // HANDLE IMAGE
  // ===================================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setMessage("");

    clearPreviewUrl();

    setSelectedImage(file);

    const previewUrl = URL.createObjectURL(file);

    previewUrlRef.current = previewUrl;
    setImagePreview(previewUrl);
  };

  // ===================================================
  // REMOVE IMAGE
  // ===================================================

  const handleRemoveImage = () => {
    clearPreviewUrl();

    setSelectedImage(null);
    setImagePreview("");

    setForm((previous) => ({
      ...previous,
      profileImage: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setError("");
    setMessage("");
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    // VALIDATE NAME

    const cleanName = form.name.trim();

    if (!cleanName) {
      setError("Please enter your name.");
      return;
    }

    if (cleanName.length < 2) {
      setError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    // VALIDATE EMAIL

    const cleanEmail = form.email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // TOKEN

    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "No login token found. Please login again."
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", cleanName);
      formData.append("email", cleanEmail);

      if (selectedImage) {
        formData.append("profileImage", selectedImage);
      }

      const response = await axios.put(
        `${BASE_URL}/api/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Profile update failed."
        );
      }

      const updatedUser = response.data.user;

      if (!updatedUser) {
        throw new Error(
          "Server did not return updated user data."
        );
      }

      // SAVE USER

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      // UPDATE AUTH CONTEXT

      if (typeof setUser === "function") {
        setUser(updatedUser);
      }

      // RESET FORM

      setForm({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        profileImage: updatedUser.profileImage || "",
      });

      setSelectedImage(null);

      clearPreviewUrl();
      setImagePreview(
        getProfileImage(updatedUser.profileImage)
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage("Profile updated successfully.");

      window.setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (requestError) {
      console.error(
        "PROFILE UPDATE FAILED:",
        requestError.response?.data || requestError.message
      );

      if (requestError.response?.status === 401) {
        setError(
          "Authentication failed. Please logout and login again."
        );
        return;
      }

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // CURRENT IMAGE
  // ===================================================

  const currentImage =
    imagePreview ||
    getProfileImage(form.profileImage);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      {/* THEME-AWARE BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-32 h-80 w-80 rounded-full blur-[100px]"
          style={{
            backgroundColor: "var(--theme-glowPrimary)",
            opacity: 0.15,
          }}
        />

        <div
          className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full blur-[100px]"
          style={{
            backgroundColor: "var(--theme-glowSecondary)",
            opacity: 0.12,
          }}
        />
      </div>

      {/* MAIN */}

      <div className="relative mx-auto w-full max-w-5xl">
        {/* BACK BUTTON */}

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/profile")}
          className="mb-6 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:-translate-y-0.5"
          style={{
            ...neuSmall,
            color: "var(--theme-textMuted)",
          }}
        >
          <ArrowLeft size={17} />
          Back to Profile
        </motion.button>

        {/* HEADER */}

        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              ...neu,
              ...primaryStyle,
            }}
          >
            <UserRound size={26} />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Music2
                size={14}
                style={secondaryStyle}
              />

              <span
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={secondaryStyle}
              >
                JOY MUSIC
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Edit Profile
            </h1>

            <p
              className="mt-1 text-sm"
              style={labelStyle}
            >
              Update your personal information
            </p>
          </div>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border p-5 sm:p-7 lg:p-8"
          style={neu}
        >
          {/* PROFILE PREVIEW */}

          <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* LEFT CARD */}

            <div
              className="rounded-3xl border p-6 text-center"
              style={neuInset}
            >
              {/* PROFILE IMAGE */}

              <div className="relative mx-auto mb-5 h-36 w-36">
                <div
                  className="h-full w-full rounded-full border p-1"
                  style={neu}
                >
                  <div
                    className="h-full w-full overflow-hidden rounded-full border"
                    style={neuInset}
                  >
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={form.name || "Profile"}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={primaryStyle}
                      >
                        <UserRound
                          size={52}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CAMERA ICON */}

                <div
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    color: "#ffffff",
                    boxShadow:
                      "0 0 20px var(--theme-glowPrimary)",
                  }}
                >
                  <Camera size={17} />
                </div>
              </div>

              {/* NAME */}

              <h2
                className="truncate text-lg font-bold"
                style={{ color: "var(--theme-text)" }}
              >
                {form.name || "Your Name"}
              </h2>

              {/* EMAIL */}

              <p
                className="mt-1 truncate text-xs"
                style={labelStyle}
              >
                {form.email || "your@email.com"}
              </p>

              {/* ACCOUNT LABEL */}

              <div
                className="mt-4 flex items-center justify-center gap-2 text-xs"
                style={secondaryStyle}
              >
                <ShieldCheck size={15} />
                Account Profile
              </div>
            </div>

            {/* RIGHT FORM */}

            <div className="min-w-0">
              {/* PROFILE IMAGE */}

              <div className="mb-6">
                <label
                  className="mb-3 block text-xs font-semibold uppercase tracking-wider"
                  style={labelStyle}
                >
                  Profile Picture
                </label>

                <div
                  className="rounded-2xl border p-5"
                  style={neuInset}
                >
                  <div className="flex flex-col items-center gap-5 sm:flex-row">
                    {/* SMALL IMAGE */}

                    <div className="relative h-24 w-24 shrink-0">
                      <div
                        className="h-full w-full rounded-full border p-1"
                        style={neu}
                      >
                        <div
                          className="h-full w-full overflow-hidden rounded-full border"
                          style={neuInset}
                        >
                          {currentImage ? (
                            <img
                              src={currentImage}
                              alt="Profile preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center"
                              style={primaryStyle}
                            >
                              <UserRound size={34} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* IMAGE CONTROLS */}

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: "var(--theme-text)" }}
                      >
                        Change Profile Picture
                      </h3>

                      <p
                        className="mt-1 text-xs leading-5"
                        style={labelStyle}
                      >
                        Upload JPG, PNG or WEBP.
                        Maximum size 5 MB.
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />

                      <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                        <button
                          type="button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:-translate-y-0.5 active:scale-95"
                          style={{
                            ...neuSmall,
                            color: "var(--theme-primary)",
                          }}
                        >
                          <Camera size={16} />
                          Choose Image
                        </button>

                        {(selectedImage ||
                          form.profileImage) && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:text-red-400 active:scale-95"
                            style={{
                              ...neuSmall,
                              color: "var(--theme-textMuted)",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {selectedImage && (
                        <p
                          className="mt-3 truncate text-[11px]"
                          style={secondaryStyle}
                        >
                          Selected: {selectedImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FULL NAME */}

              <div className="mb-5">
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                  style={labelStyle}
                >
                  Full Name
                </label>

                <div
                  className="flex items-center gap-3 rounded-xl border px-4"
                  style={neuInset}
                >
                  <UserRound
                    size={17}
                    className="shrink-0"
                    style={primaryStyle}
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    className="w-full min-w-0 bg-transparent py-3.5 text-base outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider"
                  style={labelStyle}
                >
                  Email Address
                </label>

                <div
                  className="flex items-center gap-3 rounded-xl border px-4"
                  style={neuInset}
                >
                  <Mail
                    size={17}
                    className="shrink-0"
                    style={secondaryStyle}
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full min-w-0 bg-transparent py-3.5 text-base outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* SUCCESS */}

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                  style={{
                    backgroundColor:
                      "var(--theme-surface)",
                    borderColor:
                      "var(--theme-secondary)",
                    color: "var(--theme-secondary)",
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{message}</span>
                </motion.div>
              )}

              {/* ERROR */}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* ACTIONS */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  disabled={saving}
                  className="rounded-xl border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    ...neuSmall,
                    color: "var(--theme-textMuted)",
                  }}
                >
                  Cancel
                </button>

                {/* SAVE */}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor:
                      "var(--theme-primary)",
                    borderColor:
                      "var(--theme-primary)",
                    color: "#ffffff",
                    boxShadow:
                      "0 0 20px var(--theme-glowPrimary)",
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* FOOTER */}

        <div className="mt-6 text-center">
          <p
            className="text-[11px]"
            style={labelStyle}
          >
            Your profile information is securely
            stored with your JOY MUSIC account.
          </p>
        </div>
      </div>
    </div>
  );
}
