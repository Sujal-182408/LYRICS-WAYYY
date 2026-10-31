
import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Music2,
  Headphones,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";

import { BASE_URL } from "../../config/api";

// =====================================================
// COLORS — SAME AS SIGN IN
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
// SHADOWS
// =====================================================

const neuShadow =
  "8px 8px 16px #0f141a, -8px -8px 16px #2a3543";

const insetShadow =
  "inset 5px 5px 10px #0f141a, inset -5px -5px 10px #2a3543";

// =====================================================
// FORGOT PASSWORD
// =====================================================

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ===================================================
  // INPUT CHANGE
  // ===================================================

  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    if (error) setError("");
    if (success) setSuccess("");
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/forgot-password`,
        {
          email: cleanEmail,
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
          "If an account exists for that email, a password reset link has been sent."
      );

    } catch (err) {
      console.error("FORGOT PASSWORD REQUEST FAILED:", err);
      console.error("REQUEST URL:", err.config?.url);
      console.error("HTTP STATUS:", err.response?.status);
      console.error("SERVER RESPONSE:", err.response?.data);

      if (err.response?.status === 429) {
        setError(
          err.response?.data?.message ||
            "Too many requests. Please try again later."
        );
      } else if (err.response?.status >= 500) {
        setError(
          err.response?.data?.message ||
            "A server error occurred. Please try again later."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to send the reset link. Please try again later."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <main
      className="
        min-h-screen
        w-full
        relative
        flex
        items-center
        justify-center
        px-4
        py-10
        md:px-8
        text-white
      "
      style={{
        background: BASE,
      }}
    >
      {/* =================================================
          BACKGROUND GLOW
      ================================================= */}

      <div
        className="
          absolute
          -top-40
          -left-40
          w-105
          h-105
          rounded-full
          blur-[120px]
          opacity-20
          pointer-events-none
        "
        style={{
          background: PURPLE,
        }}
      />

      <div
        className="
          absolute
          -bottom-40
          -right-40
          w-115
          h-115
          rounded-full
          blur-[130px]
          opacity-15
          pointer-events-none
        "
        style={{
          background: TEAL,
        }}
      />

      <div
        className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-175
          h-175
          rounded-full
          blur-[160px]
          opacity-[0.04]
          pointer-events-none
        "
        style={{
          background: PURPLE,
        }}
      />

      {/* =================================================
          FLOATING MUSIC ORBS
      ================================================= */}

      <div className="absolute top-[12%] left-[8%] hidden lg:block">
        <FloatingOrb icon={Music2} color={PURPLE} />
      </div>

      <div className="absolute bottom-[15%] right-[8%] hidden lg:block">
        <FloatingOrb icon={Headphones} color={TEAL} />
      </div>

      {/* =================================================
          MAIN CARD
      ================================================= */}

      <section
        className="
          relative
          z-10
          w-full
          max-w-6xl
          rounded-[36px]
          overflow-hidden
        "
        style={{
          background: BASE,
          boxShadow:
            "18px 18px 40px #0f141a, -18px -18px 40px #2a3543",
        }}
      >
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[1.05fr_0.95fr]
          "
        >
          {/* =================================================
              LEFT BRAND SECTION
          ================================================= */}

          <div
            className="
              relative
              hidden
              lg:flex
              flex-col
              justify-between
              min-h-170
              p-12
              overflow-hidden
            "
          >
            {/* Decorative shapes */}

            <div
              className="
                absolute
                w-80
                h-80
                rounded-full
                -top-32
                -left-32
                opacity-10
              "
              style={{
                background: PURPLE,
              }}
            />

            <div
              className="
                absolute
                w-96
                h-96
                rounded-full
                -bottom-52
                -right-44
                opacity-[0.07]
              "
              style={{
                background: TEAL,
              }}
            />

            {/* Logo */}

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                  "
                  style={{
                    background: BASE,
                    boxShadow: neuShadow,
                  }}
                >
                  <Music2
                    size={27}
                    style={{
                      color: PURPLE,
                    }}
                  />
                </div>

                <div>
                  <h1
                    className="
                      text-xl
                      font-black
                      tracking-[0.15em]
                      text-white
                    "
                  >
                    LYRICS
                  </h1>

                  <p
                    className="
                      text-[10px]
                      text-gray-500
                      tracking-[0.3em]
                    "
                  >
                    WAYYY
                  </p>
                </div>
              </div>
            </div>

            {/* Center content */}

            <div className="relative z-10 max-w-xl">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-full
                  mb-7
                "
                style={{
                  background: BASE,
                  boxShadow: insetShadow,
                }}
              >
                <ShieldCheck
                  size={15}
                  style={{
                    color: TEAL,
                  }}
                />

                <span className="text-xs font-semibold text-gray-300">
                  YOUR ACCOUNT. YOUR SECURITY.
                </span>
              </div>

              <h2
                className="
                  text-5xl
                  xl:text-6xl
                  font-black
                  leading-[1.05]
                  text-white
                "
              >
                Lost your

                <span
                  className="block"
                  style={{
                    color: PURPLE,
                  }}
                >
                  password?
                </span>
              </h2>

              <p
                className="
                  mt-7
                  max-w-md
                  text-gray-400
                  leading-7
                "
              >
                Don't worry. Your music space is still
                waiting for you. Reset your password
                securely and get back to your favorite
                sounds.
              </p>

              {/* Feature cards */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-4
                  mt-9
                  max-w-md
                "
              >
                <FeatureCard
                  icon={LockKeyhole}
                  title="Secure Reset"
                  text="Protected access"
                  color={PURPLE}
                />

                <FeatureCard
                  icon={Mail}
                  title="Email Link"
                  text="Quick recovery"
                  color={TEAL}
                />
              </div>
            </div>

            {/* Security */}

            <div
              className="
                relative
                z-10
                flex
                items-center
                gap-3
                text-gray-500
                text-xs
              "
            >
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

          {/* =================================================
              RIGHT FORGOT PASSWORD SECTION
          ================================================= */}

          <div
            className="
              p-5
              sm:p-8
              md:p-12
              lg:p-14
              flex
              items-center
            "
          >
            <div className="w-full max-w-md mx-auto">

              {/* MOBILE LOGO */}

              <div
                className="
                  lg:hidden
                  flex
                  items-center
                  justify-center
                  gap-3
                  mb-8
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                  "
                  style={{
                    background: BASE,
                    boxShadow: neuShadow,
                  }}
                >
                  <Music2
                    size={23}
                    style={{
                      color: PURPLE,
                    }}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-lg
                      font-black
                      tracking-[0.15em]
                      text-white
                    "
                  >
                    JOY MUSIC
                  </p>

                  <p
                    className="
                      text-[10px]
                      tracking-[0.2em]
                      text-gray-500
                    "
                  >
                    YOUR MUSIC SPACE
                  </p>
                </div>
              </div>

              {/* BACK TO SIGN IN */}

              <Link
                to="/signin"
                className="
                  inline-flex
                  items-center
                  gap-2
                  mb-8
                  text-sm
                  font-medium
                  text-gray-400
                  transition-colors
                  hover:text-[#2bd4c4]
                "
              >
                <ArrowLeft size={17} />
                Back to sign in
              </Link>

              {/* HEADER */}

              <div className="mb-8">
                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    mb-5
                  "
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <Mail
                    size={21}
                    style={{
                      color: PURPLE,
                    }}
                  />
                </div>

                <h2
                  className="
                    text-3xl
                    md:text-4xl
                    font-black
                    text-white
                  "
                >
                  Forgot password?
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    mt-3
                    leading-6
                  "
                >
                  Enter the email address linked to your
                  account. We'll send you a secure password
                  reset link if an account exists.
                </p>
              </div>

              {/* SUCCESS MESSAGE */}

              {success && (
                <div
                  role="status"
                  className="
                    mb-5
                    rounded-2xl
                    p-4
                    flex
                    items-start
                    gap-3
                  "
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                    style={{
                      background: "rgba(43,212,196,0.08)",
                    }}
                  >
                    <CheckCircle2
                      size={18}
                      style={{
                        color: TEAL,
                      }}
                    />
                  </div>

                  <p
                    className="
                      text-xs
                      leading-5
                      pt-1
                    "
                    style={{
                      color: TEAL,
                    }}
                  >
                    {success}
                  </p>
                </div>
              )}

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  role="alert"
                  className="
                    mb-5
                    rounded-2xl
                    p-4
                    flex
                    items-start
                    gap-3
                  "
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                  }}
                >
                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                    style={{
                      background: "rgba(239,68,68,0.08)",
                    }}
                  >
                    <AlertCircle
                      size={17}
                      className="text-red-400"
                    />
                  </div>

                  <p
                    className="
                      text-xs
                      leading-5
                      text-red-300
                      pt-1
                    "
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="reset-email"
                    className="
                      block
                      text-xs
                      font-semibold
                      text-gray-400
                      mb-2
                      ml-1
                    "
                  >
                    Email address
                  </label>

                  <div
                    className="
                      relative
                      rounded-2xl
                    "
                  >
                    <Mail
                      size={18}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        pointer-events-none
                      "
                      style={{
                        color: email ? PURPLE : "#68707d",
                      }}
                    />

                    <input
                      id="reset-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={254}
                      required
                      disabled={loading}
                      className="
                        w-full
                        h-14
                        rounded-2xl
                        bg-transparent
                        pl-12
                        pr-4
                        text-sm
                        text-white
                        placeholder:text-gray-600
                        outline-none
                        transition-all
                        duration-200
                        disabled:opacity-50
                      "
                      style={{
                        background: BASE,
                        boxShadow: insetShadow,
                      }}
                    />
                  </div>
                </div>

                {/* SEND RESET LINK BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    relative
                    group
                    overflow-hidden
                    w-full
                    h-13
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    gap-2
                    text-sm
                    font-semibold
                    text-white
                    transition-all
                    duration-200
                    hover:brightness-110
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  style={{
                    background: PURPLE,
                    boxShadow: neuShadow,
                  }}
                >
                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                    "
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.10), transparent, rgba(255,255,255,0.10))",
                    }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      <>
                        Send reset link
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

              <div
                className="
                  flex
                  items-center
                  gap-4
                  my-7
                "
              >
                <div className="h-px flex-1 bg-[#303641]" />

                <span
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                    text-gray-600
                  "
                >
                  Remembered?
                </span>

                <div className="h-px flex-1 bg-[#303641]" />
              </div>

              {/* SIGN IN LINK */}

              <Link
                to="/signin"
                className="
                  w-full
                  h-13
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-semibold
                  text-gray-300
                  transition-all
                  duration-200
                  hover:text-white
                  active:scale-[0.98]
                "
                style={{
                  background: BASE,
                  boxShadow: neuShadow,
                }}
              >
                <LockKeyhole size={17} />
                Back to sign in
              </Link>

              {/* SECURITY */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-7
                "
              >
                <ShieldCheck
                  size={14}
                  style={{
                    color: TEAL,
                  }}
                />

                <span
                  className="
                    text-[10px]
                    text-gray-600
                  "
                >
                  Protected password recovery
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        className="
          absolute
          bottom-3
          left-0
          right-0
          text-center
          pointer-events-none
        "
      >
        <p
          className="
            text-[10px]
            text-gray-700
            tracking-wider
          "
        >
          © {new Date().getFullYear()} JOY MUSIC
        </p>
      </div>
    </main>
  );
}

// =====================================================
// FEATURE CARD
// =====================================================

const FeatureCard = ({
  icon: Icon,
  title,
  text,
  color,
}) => {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: BASE,
        boxShadow: insetShadow,
      }}
    >
      <div
        className="
          w-9
          h-9
          rounded-xl
          flex
          items-center
          justify-center
          mb-3
        "
        style={{
          background: BASE,
          boxShadow: neuShadow,
        }}
      >
        <Icon
          size={16}
          style={{
            color,
          }}
        />
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

const FloatingOrb = ({
  icon: Icon,
  color,
}) => {
  return (
    <div
      className="
        w-16
        h-16
        rounded-full
        flex
        items-center
        justify-center
        animate-pulse
      "
      style={{
        background: BASE,
        boxShadow:
          "10px 10px 20px #0f141a, -10px -10px 20px #2a3543",
      }}
    >
      <Icon
        size={22}
        style={{
          color,
        }}
      />
    </div>
  );
};
