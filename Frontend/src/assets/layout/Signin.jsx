import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Music2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../AuthContext";
import { BASE_URL } from "../../config/api";

// =====================================================
// THEME COLORS
// =====================================================

const BASE = "#252933";
const LIGHT = "#2a3543";
const DARK = "#0f141a";
const PURPLE = "#8c7cf7";
const TEAL = "#2bd4c4";

// =====================================================
// SHADOWS
// =====================================================

const cardShadow = `18px 18px 38px ${DARK}, -12px -12px 30px ${LIGHT}`;

const insetShadow = `inset 5px 5px 10px ${DARK}, inset -5px -5px 10px ${LIGHT}`;

const softShadow = `7px 7px 14px ${DARK}, -7px -7px 14px ${LIGHT}`;

const OUTER_SHADOW =
  "12px 12px 24px #0f141a, -12px -12px 24px #2a3543";

const INNER_SHADOW =
  "inset 6px 6px 12px #0f141a, inset -6px -6px 12px #2a3543";

// =====================================================
// SUPPORTED ROLES
// =====================================================

const SUPPORTED_ROLES = ["user", "artist", "superadmin"];

// =====================================================
// SIGN IN
// =====================================================

const Signin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  // =====================================================
  // ROLE REDIRECT
  // =====================================================

  const redirectByRole = (role) => {
    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();

    console.log("REDIRECTING USER WITH ROLE:", normalizedRole);

    switch (normalizedRole) {
      case "superadmin":
        navigate("/superadmin/dashboard", {
          replace: true,
        });
        return;

      case "artist":
        navigate("/home", {
          replace: true,
        });
        return;

      case "user":
        navigate("/home", {
          replace: true,
        });
        return;

      default:
        console.error("UNKNOWN ROLE:", normalizedRole);

        navigate("/home", {
          replace: true,
        });
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = `${BASE_URL.replace(/\/+$/, "")}/api/auth/login`;

      const response = await axios.post(
        apiUrl,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Login failed.");
      }

      const token = data.token;
      const user = data.user;

      if (!token || !user) {
        throw new Error(
          "The server did not return the required authentication information."
        );
      }

      const role = String(user.role || "")
        .trim()
        .toLowerCase();

      if (!SUPPORTED_ROLES.includes(role)) {
        throw new Error("Your account has an invalid role.");
      }

      // Save authenticated session.

      localStorage.removeItem("approvalStatus");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);

      const approvalStatus =
        user.artistApplicationStatus ||
        user.approvalStatus ||
        user.artistApplication?.status ||
        "";

      if (approvalStatus) {
        localStorage.setItem(
          "approvalStatus",
          String(approvalStatus)
        );
      }

      // Update authentication context.

      login(token, user);

      // Success messages.

      if (role === "artist") {
        setSuccess(
          "Artist account verified. Opening your artist dashboard..."
        );
      } else if (role === "superadmin") {
        setSuccess(
          "Super Admin account verified. Opening dashboard..."
        );
      } else {
        setSuccess("Welcome back. Redirecting...");
      }

      console.info("LOGIN SUCCESS:", {
        userId: user._id,
        role,
      });

      redirectByRole(role);
    } catch (error) {
      console.error("LOGIN REQUEST FAILED:", error);
      console.error("REQUEST URL:", error.config?.url);
      console.error("HTTP STATUS:", error.response?.status);
      console.error(
        "SERVER RESPONSE:",
        JSON.stringify(error.response?.data, null, 2)
      );

      if (error.response?.status === 429) {
        setError(
          error.response?.data?.message ||
            "Too many login attempts. Please wait before trying again."
        );
      } else if (error.response?.status >= 500) {
        setError(
          "A server error occurred. Please try again later."
        );
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Unable to sign in. Please check your credentials and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="
        relative
        flex
        min-h-screen
        w-full
        flex-col
        items-center
        justify-center
        overflow-hidden
        px-4
        py-7
        sm:px-6
        sm:py-10
        md:px-8
      "
      style={{
        background: BASE,
      }}
    >
      {/* BACKGROUND LIGHTING */}

      <div
        className="
          pointer-events-none
          absolute
          -left-36
          -top-40
          h-80
          w-80
          rounded-full
          opacity-[0.12]
          blur-[110px]
        "
        style={{ background: PURPLE }}
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-40
          -right-36
          h-96
          w-96
          rounded-full
          opacity-[0.10]
          blur-[120px]
        "
        style={{ background: TEAL }}
      />

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[450px]
          w-[450px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          opacity-[0.035]
          blur-[150px]
        "
        style={{ background: PURPLE }}
      />

      {/* FLOATING DESKTOP ORBS */}

      <div className="absolute left-[8%] top-[12%] hidden lg:block">
        <FloatingOrb icon={Music2} color={PURPLE} />
      </div>

      <div className="absolute bottom-[15%] right-[8%] hidden lg:block">
        <FloatingOrb icon={Headphones} color={TEAL} />
      </div>

      {/* MAIN CARD */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-6xl
          overflow-hidden
          rounded-[26px]
          sm:rounded-[32px]
          lg:rounded-[36px]
        "
        style={{
          background: BASE,
          boxShadow: cardShadow,
          border: "1px solid rgba(255,255,255,0.025)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">

          {/* =================================================
              LEFT BRAND SECTION
          ================================================= */}

          <div
            className="
              relative
              hidden
              min-h-[680px]
              flex-col
              justify-between
              overflow-hidden
              p-12
              lg:flex
              xl:p-14
            "
          >
            <div
              className="
                absolute
                -left-32
                -top-32
                h-80
                w-80
                rounded-full
                opacity-[0.09]
              "
              style={{ background: PURPLE }}
            />

            <div
              className="
                absolute
                -bottom-52
                -right-44
                h-96
                w-96
                rounded-full
                opacity-[0.07]
              "
              style={{ background: TEAL }}
            />

            {/* LOGO */}

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                  "
                  style={{
                    background: BASE,
                    boxShadow: softShadow,
                    border: "1px solid rgba(255,255,255,0.035)",
                  }}
                >
                  <Music2 size={27} style={{ color: PURPLE }} />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-[0.15em] text-white">
                    LYRICS
                  </h1>

                  <p className="text-[10px] tracking-[0.3em] text-gray-500">
                    WAYYY
                  </p>
                </div>
              </div>
            </div>

            {/* BRAND CONTENT */}

            <div className="relative z-10 max-w-xl">
              <div
                className="
                  mb-7
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  px-4
                  py-2.5
                "
                style={{
                  background: BASE,
                  boxShadow: insetShadow,
                  border: "1px solid rgba(255,255,255,0.025)",
                }}
              >
                <Sparkles size={15} style={{ color: TEAL }} />

                <span className="text-xs font-semibold tracking-wide text-gray-300">
                  YOUR MUSIC. YOUR SPACE.
                </span>
              </div>

              <h2 className="text-5xl font-black leading-[1.05] text-white xl:text-6xl">
                Music
                <span
                  className="block"
                  style={{ color: PURPLE }}
                >
                  starts here.
                </span>
              </h2>

              <p className="mt-7 max-w-md text-sm leading-7 text-gray-400">
                Enter your personal music space and continue
                where your sound left off.
              </p>

              <div className="mt-9 grid max-w-md grid-cols-2 gap-4">
                <FeatureCard
                  icon={Music2}
                  title="Your Library"
                  text="All your music"
                  color={PURPLE}
                />

                <FeatureCard
                  icon={Headphones}
                  title="Pure Sound"
                  text="Made for listening"
                  color={TEAL}
                />
              </div>
            </div>

            {/* SECURITY */}

            <div className="relative z-10 flex items-center gap-3 text-xs text-gray-500">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background: TEAL,
                  boxShadow: `0 0 12px ${TEAL}`,
                }}
              />
              Secure authentication
            </div>
          </div>

          {/* =================================================
              RIGHT LOGIN SECTION
          ================================================= */}

          <div
            className="
              flex
              items-center
              px-5
              py-8
              sm:px-9
              sm:py-10
              md:px-12
              md:py-12
              lg:px-12
              lg:py-14
              xl:px-14
            "
          >
            <div className="mx-auto w-full max-w-md">

              {/* MOBILE LOGO */}

              <div
                className="
                  mb-8
                  flex
                  items-center
                  justify-center
                  gap-3
                  lg:hidden
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                  "
                  style={{
                    background: BASE,
                    boxShadow: softShadow,
                    border: "1px solid rgba(255,255,255,0.035)",
                  }}
                >
                  <Music2 size={23} style={{ color: PURPLE }} />
                </div>

                <div>
                  <p className="text-lg font-black tracking-[0.15em] text-white">
                   LYRICS WAYYY
                  </p>

                  <p className="text-[10px] tracking-[0.2em] text-gray-500">
                    YOUR MUSIC SPACE
                  </p>
                </div>
              </div>

              {/* HEADER */}

              <div className="mb-8">
                <div
                  className="
                    mb-5
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                  "
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                    border: "1px solid rgba(255,255,255,0.025)",
                  }}
                >
                  <LockKeyhole size={21} style={{ color: PURPLE }} />
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Sign in to continue to your account.
                </p>
              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="
                    mb-5
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    p-4
                  "
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                    border: "1px solid rgba(248,113,113,0.12)",
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                    <AlertCircle size={17} className="text-red-400" />
                  </div>

                  <p className="pt-1 text-xs leading-5 text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div
                  className="
                    mb-5
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    p-4
                  "
                  style={{
                    background: BASE,
                    boxShadow: insetShadow,
                    border: "1px solid rgba(43,212,196,0.15)",
                  }}
                >
                  <CheckCircle2
                    size={18}
                    className="shrink-0"
                    style={{ color: TEAL }}
                  />

                  <p
                    className="text-xs font-medium leading-5"
                    style={{ color: TEAL }}
                  >
                    {success}
                  </p>
                </div>
              )}

              {/* FORM */}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="signin-email"
                    className="mb-2 ml-1 block text-xs font-semibold tracking-wide text-gray-400"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                      style={{
                        color: formData.email ? PURPLE : "#68707d",
                      }}
                    />

                    <input
                      id="signin-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      required
                      className="
                        h-14
                        w-full
                        rounded-2xl
                        border
                        border-white/[0.025]
                        bg-transparent
                        pl-12
                        pr-4
                        text-base
                        text-white
                        outline-none
                        transition-all
                        duration-200
                        placeholder:text-gray-600
                        focus:border-[#8c7cf7]/50
                        disabled:opacity-50
                      "
                      style={{
                        background: BASE,
                        boxShadow: insetShadow,
                      }}
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <label
                      htmlFor="signin-password"
                      className="text-xs font-semibold tracking-wide text-gray-400"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="
                        text-xs
                        font-semibold
                        transition-colors
                        hover:text-[#8c7cf7]
                      "
                      style={{ color: TEAL }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                      style={{
                        color: formData.password ? PURPLE : "#68707d",
                      }}
                    />

                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      required
                      className="
                        h-14
                        w-full
                        rounded-2xl
                        border
                        border-white/[0.025]
                        bg-transparent
                        pl-12
                        pr-14
                        text-base
                        text-white
                        outline-none
                        transition-all
                        duration-200
                        placeholder:text-gray-600
                        focus:border-[#8c7cf7]/50
                        disabled:opacity-50
                      "
                      style={{
                        background: BASE,
                        boxShadow: insetShadow,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        flex
                        h-10
                        w-10
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-xl
                        text-gray-500
                        transition-colors
                        hover:text-white
                      "
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    group
                    relative
                    flex
                    h-14
                    w-full
                    items-center
                    justify-center
                    gap-2
                    overflow-hidden
                    rounded-2xl
                    text-sm
                    font-bold
                    tracking-wide
                    text-white
                    transition-all
                    duration-200
                    hover:brightness-110
                    active:scale-[0.98]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  style={{
                    background: `linear-gradient(110deg, ${PURPLE}, #7465e9 55%, #6559d5)`,
                    boxShadow: `0 8px 22px rgba(140,124,247,0.17), 5px 5px 12px ${DARK}`,
                  }}
                >
                  <span
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      opacity-0
                      transition-opacity
                      duration-300
                      group-hover:opacity-100
                    "
                    style={{
                      background:
                        "linear-gradient(110deg, rgba(255,255,255,0.16), transparent 55%)",
                    }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight
                          size={17}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* DIVIDER */}

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#343a45]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                  New here?
                </span>

                <div className="h-px flex-1 bg-[#343a45]" />
              </div>

              {/* SIGN UP */}

              <Link
                to="/signup"
                className="
                  flex
                  h-14
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border
                  border-white/[0.025]
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
                  boxShadow: softShadow,
                }}
              >
                <UserRound size={17} />
                Create an account
              </Link>

              {/* SECURITY */}

              <div className="mt-7 flex items-center justify-center gap-2">
                <ShieldCheck size={14} style={{ color: TEAL }} />

                <span className="text-[10px] tracking-wide text-gray-500">
                  Protected account access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}

      <div className="relative z-10 mt-6 text-center">
        <p className="text-[10px] tracking-[0.15em] text-gray-600">
          © {new Date().getFullYear()} LYRICS WAYYY
        </p>
      </div>
    </div>
  );
};

// =====================================================
// FEATURE CARD
// =====================================================

const FeatureCard = ({ icon: Icon, title, text, color }) => {
  return (
    <div
      className="rounded-2xl border border-white/[0.025] p-4"
      style={{
        background: BASE,
        boxShadow: insetShadow,
      }}
    >
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          background: BASE,
          boxShadow: softShadow,
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      <p className="text-xs font-bold text-gray-200">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-gray-500">
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
      className="
        flex
        h-16
        w-16
        animate-pulse
        items-center
        justify-center
        rounded-full
      "
      style={{
        background: BASE,
        boxShadow: softShadow,
        border: "1px solid rgba(255,255,255,0.035)",
      }}
    >
      <Icon size={22} style={{ color }} />
    </div>
  );
};

export default Signin;