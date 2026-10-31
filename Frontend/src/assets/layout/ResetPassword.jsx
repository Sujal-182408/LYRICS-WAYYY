import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  Music2,
  Headphones,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
  KeyRound,
} from "lucide-react";

import { BASE_URL } from "../../config/api";

// =====================================================
// COLORS — SAME AS FORGOT PASSWORD
// =====================================================

const BASE = "#252933";
const LIGHT = "#2a3543";
const DARK = "#0f141a";
const PURPLE = "#8c7cf7";
const TEAL = "#2bd4c4";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL = `${String(BASE_URL || "").replace(/\/+$/, "")}/api/auth`;

// =====================================================
// NEUMORPHIC SHADOWS
// =====================================================

const neuShadow =
  "8px 8px 16px #0f141a, -8px -8px 16px #2a3543";

const cardShadow =
  "18px 18px 40px #0f141a, -18px -18px 40px #2a3543";

const insetShadow =
  "inset 5px 5px 10px #0f141a, inset -5px -5px 10px #2a3543";

// =====================================================
// RESET PASSWORD
// =====================================================

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ===================================================
  // TOKEN VALIDATION
  // ===================================================

  const validToken = useMemo(
    () => /^[a-fA-F0-9]{64}$/.test(token || ""),
    [token]
  );

  // ===================================================
  // PASSWORD REQUIREMENTS
  // ===================================================

  const passwordBytes = new TextEncoder().encode(password).length;

  const requirements = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "At least one number",
      valid: /\d/.test(password),
    },
    {
      label: "At least one special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const passwordValid = password.length >= 8 && passwordBytes <= 72;

  // ===================================================
  // INPUT HANDLERS
  // ===================================================

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
    setSuccess("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
    setSuccess("");
  };

  // ===================================================
  // SUBMIT RESET REQUEST
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    if (!validToken) {
      setError("This password reset link is invalid or incomplete.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (passwordBytes > 72) {
      setError("Your password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/reset-password`,
        {
          token,
          newPassword: password,
          confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      setSuccess(
        response.data?.message ||
          "Your password has been reset successfully."
      );
    } catch (err) {
      console.error("RESET PASSWORD FAILED:", err);
      console.error("REQUEST URL:", err.config?.url);
      console.error("HTTP STATUS:", err.response?.status);
      console.error("SERVER RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.message ||
          "Unable to reset your password. Your link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // REDIRECT AFTER SUCCESS
  // ===================================================

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      navigate("/signin", { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [success, navigate]);

  // ===================================================
  // INVALID TOKEN SCREEN
  // ===================================================

  if (!validToken) {
    return (
      <main
        className="min-h-screen w-full flex items-center justify-center px-4 py-10 text-white relative overflow-hidden"
        style={{ background: BASE }}
      >
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] opacity-20 pointer-events-none"
          style={{ background: PURPLE }}
        />

        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[130px] opacity-15 pointer-events-none"
          style={{ background: TEAL }}
        />

        <section
          className="relative z-10 w-full max-w-md rounded-[32px] p-8 sm:p-10 text-center"
          style={{
            background: BASE,
            boxShadow: cardShadow,
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: BASE,
              boxShadow: insetShadow,
            }}
          >
            <AlertCircle size={30} className="text-red-400" />
          </div>

          <h1 className="text-2xl font-black text-white">
            Invalid reset link
          </h1>

          <p className="mt-4 text-sm leading-6 text-gray-400">
            This password reset link is invalid or incomplete.
            Please request a new password reset link.
          </p>

          <Link
            to="/forgot-password"
            className="mt-8 w-full h-13 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{
              background: PURPLE,
              boxShadow: neuShadow,
            }}
          >
            Request new reset link
            <ArrowRight size={17} />
          </Link>

          <Link
            to="/signin"
            className="inline-flex items-center gap-2 mt-6 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </section>
      </main>
    );
  }

  // ===================================================
  // MAIN RENDER
  // ===================================================

  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center px-4 py-10 md:px-8 text-white overflow-hidden"
      style={{
        background: BASE,
      }}
    >
      {/* BACKGROUND GLOW */}

      <div
        className="absolute -top-40 -left-40 w-105 h-105 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: PURPLE }}
      />

      <div
        className="absolute -bottom-40 -right-40 w-115 h-115 rounded-full blur-[130px] opacity-15 pointer-events-none"
        style={{ background: TEAL }}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-175 rounded-full blur-[160px] opacity-[0.04] pointer-events-none"
        style={{ background: PURPLE }}
      />

      {/* FLOATING MUSIC ORBS */}

      <div className="absolute top-[12%] left-[8%] hidden lg:block">
        <FloatingOrb icon={Music2} color={PURPLE} />
      </div>

      <div className="absolute bottom-[15%] right-[8%] hidden lg:block">
        <FloatingOrb icon={Headphones} color={TEAL} />
      </div>

      {/* MAIN CARD */}

      <section
        className="relative z-10 w-full max-w-6xl rounded-[36px] overflow-hidden"
        style={{
          background: BASE,
          boxShadow: cardShadow,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">

          {/* LEFT BRAND SECTION */}

          <div className="relative hidden lg:flex flex-col justify-between min-h-170 p-12 overflow-hidden">

            <div
              className="absolute w-80 h-80 rounded-full -top-32 -left-32 opacity-10"
              style={{ background: PURPLE }}
            />

            <div
              className="absolute w-96 h-96 rounded-full -bottom-52 -right-44 opacity-[0.07]"
              style={{ background: TEAL }}
            />

            {/* LOGO */}

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: BASE,
                    boxShadow: neuShadow,
                  }}
                >
                  <Music2 size={27} style={{ color: PURPLE }} />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-[0.15em] text-white">
                    LYRICS
                  </h1>

                  <p className="text-[10px] text-gray-500 tracking-[0.3em]">
                    WAYYY
                  </p>
                </div>
              </div>
            </div>

            {/* CENTER CONTENT */}

            <div className="relative z-10 max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
                style={{
                  background: BASE,
                  boxShadow: insetShadow,
                }}
              >
                <ShieldCheck size={15} style={{ color: TEAL }} />

                <span className="text-xs font-semibold text-gray-300">
                  YOUR ACCOUNT. YOUR SECURITY.
                </span>
              </div>

              <h2 className="text-5xl xl:text-6xl font-black leading-[1.05] text-white">
                Create a

                <span
                  className="block"
                  style={{ color: PURPLE }}
                >
                  new password.
                </span>
              </h2>

              <p className="mt-7 max-w-md text-gray-400 leading-7">
                A fresh start for your music experience.
                Choose a strong password to protect your
                account and get back to enjoying your
                favorite sounds.
              </p>

              {/* FEATURE CARDS */}

              <div className="grid grid-cols-2 gap-4 mt-9 max-w-md">
                <FeatureCard
                  icon={KeyRound}
                  title="Strong Password"
                  text="Better protection"
                  color={PURPLE}
                />

                <FeatureCard
                  icon={ShieldCheck}
                  title="Secure Account"
                  text="Protected access"
                  color={TEAL}
                />
              </div>
            </div>

            {/* SECURITY */}

            <div className="relative z-10 flex items-center gap-3 text-gray-500 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: TEAL,
                  boxShadow: `0 0 12px ${TEAL}`,
                }}
              />

              Secure password recovery
            </div>
          </div>

          {/* RIGHT RESET PASSWORD SECTION */}

          <div className="p-5 sm:p-8 md:p-12 lg:p-14 flex items-center">
            <div className="w-full max-w-md mx-auto">

              {/* MOBILE LOGO */}

              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: BASE,
                    boxShadow: neuShadow,
                  }}
                >
                  <Music2 size={23} style={{ color: PURPLE }} />
                </div>

                <div>
                  <p className="text-lg font-black tracking-[0.15em] text-white">
                    JOY MUSIC
                  </p>

                  <p className="text-[10px] tracking-[0.2em] text-gray-500">
                    YOUR MUSIC SPACE
                  </p>
                </div>
              </div>

              {/* BACK LINK */}

              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 mb-8 text-sm font-medium text-gray-400 transition-colors hover:text-[#2bd4c4]"
              >
                <ArrowLeft size={17} />
                Back to forgot password
              </Link>

              {/* HEADER */}

              <div className="mb-7">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <LockKeyhole size={21} style={{ color: PURPLE }} />
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-white">
                  Reset password
                </h2>

                <p className="text-sm text-gray-500 mt-3 leading-6">
                  Create a new password for your account.
                  Make sure it is strong and easy for you
                  to remember.
                </p>
              </div>

              {/* SUCCESS MESSAGE */}

              {success && (
                <div
                  role="status"
                  className="mb-5 rounded-2xl p-4 flex items-start gap-3"
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(43,212,196,0.08)",
                    }}
                  >
                    <CheckCircle2 size={18} style={{ color: TEAL }} />
                  </div>

                  <div className="pt-1">
                    <p className="text-xs leading-5" style={{ color: TEAL }}>
                      {success}
                    </p>

                    <p className="text-[10px] text-gray-500 mt-1">
                      Redirecting you to sign in...
                    </p>
                  </div>
                </div>
              )}

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-2xl p-4 flex items-start gap-3"
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                    }}
                  >
                    <AlertCircle size={17} className="text-red-400" />
                  </div>

                  <p className="text-xs leading-5 text-red-300 pt-1">
                    {error}
                  </p>
                </div>
              )}

              {/* FORM */}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* NEW PASSWORD */}

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
                  >
                    New password
                  </label>

                  <PasswordInput
                    id="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    visible={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                    placeholder="Enter your new password"
                    disabled={loading || Boolean(success)}
                  />
                </div>

                {/* CONFIRM PASSWORD */}

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold text-gray-400 mb-2 ml-1"
                  >
                    Confirm new password
                  </label>

                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    visible={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    placeholder="Re-enter your new password"
                    disabled={loading || Boolean(success)}
                  />

                  {confirmPassword && (
                    <p
                      className="text-[11px] mt-2 ml-1 flex items-center gap-1"
                      style={{
                        color:
                          password === confirmPassword ? TEAL : "#f87171",
                      }}
                    >
                      {password === confirmPassword ? (
                        <Check size={13} />
                      ) : (
                        <X size={13} />
                      )}

                      {password === confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </p>
                  )}
                </div>

                {/* PASSWORD REQUIREMENTS */}

                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-300">
                      Password requirements
                    </p>

                    <ShieldCheck size={15} style={{ color: TEAL }} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-3">
                    {requirements.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: item.valid
                              ? "rgba(43,212,196,0.12)"
                              : "rgba(255,255,255,0.04)",
                          }}
                        >
                          {item.valid ? (
                            <Check size={10} style={{ color: TEAL }} />
                          ) : (
                            <div className="w-1 h-1 rounded-full bg-gray-600" />
                          )}
                        </div>

                        <span
                          className="text-[10px]"
                          style={{
                            color: item.valid ? TEAL : "#737b88",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {passwordBytes > 72 && (
                    <p className="text-[10px] text-red-400 mt-3">
                      Password exceeds the 72-byte limit.
                    </p>
                  )}
                </div>

                {/* RESET BUTTON */}

                <button
                  type="submit"
                  disabled={loading || Boolean(success)}
                  className="relative group overflow-hidden w-full h-13 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: PURPLE,
                    boxShadow: neuShadow,
                  }}
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.10), transparent, rgba(255,255,255,0.10))",
                    }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 size={17} />
                        Password updated
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight
                          size={17}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* DIVIDER */}

              <div className="flex items-center gap-4 my-7">
                <div className="h-px flex-1 bg-[#303641]" />

                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                  All set?
                </span>

                <div className="h-px flex-1 bg-[#303641]" />
              </div>

              {/* SIGN IN LINK */}

              <Link
                to="/signin"
                className="w-full h-13 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-300 transition-all duration-200 hover:text-white active:scale-[0.98]"
                style={{
                  background: BASE,
                  boxShadow: neuShadow,
                }}
              >
                <LockKeyhole size={17} />
                Back to sign in
              </Link>

              {/* SECURITY */}

              <div className="flex items-center justify-center gap-2 mt-7">
                <ShieldCheck size={14} style={{ color: TEAL }} />

                <span className="text-[10px] text-gray-600">
                  Protected password recovery
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-gray-700 tracking-wider">
          © {new Date().getFullYear()} JOY MUSIC
        </p>
      </div>
    </main>
  );
}

// =====================================================
// PASSWORD INPUT
// =====================================================

function PasswordInput({
  id,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  disabled,
}) {
  return (
    <div className="relative rounded-2xl">
      <LockKeyhole
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          color: value ? PURPLE : "#68707d",
        }}
      />

      <input
        id={id}
        type={visible ? "text" : "password"}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        minLength={8}
        maxLength={72}
        required
        disabled={disabled}
        className="w-full h-14 rounded-2xl bg-transparent pl-12 pr-12 text-sm text-white placeholder:text-gray-600 outline-none transition-all duration-200 disabled:opacity-50"
        style={{
          background: BASE,
          boxShadow: insetShadow,
        }}
      />

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors disabled:opacity-50"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

// =====================================================
// FEATURE CARD
// =====================================================

const FeatureCard = ({ icon: Icon, title, text, color }) => {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: BASE,
        boxShadow: insetShadow,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: BASE,
          boxShadow: neuShadow,
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      <p className="text-xs font-bold text-gray-200">
        {title}
      </p>

      <p className="text-[10px] text-gray-600 mt-1">
        {text}
      </p>
    </div>
  );
};

// =====================================================
// FLOATING ORB
// =====================================================

const FloatingOrb = ({ icon: Icon, color }) => {
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
      style={{
        background: BASE,
        boxShadow:
          "10px 10px 20px #0f141a, -10px -10px 20px #2a3543",
      }}
    >
      <Icon size={22} style={{ color }} />
    </div>
  );
};