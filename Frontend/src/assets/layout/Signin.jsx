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
// COLORS
// =====================================================

const BASE = "#252933";
const LIGHT = "#2a3543";
const DARK = "#0f141a";

const PURPLE = "#8c7cf7";
const TEAL = "#2bd4c4";

// =====================================================
// NEUMORPHISM
// =====================================================

const neuShadow =
  "shadow-[8px_8px_16px_#0f141a,-8px_-8px_16px_#2a3543]";

const insetShadow =
  "shadow-[inset_6px_6px_12px_#0f141a,inset_-6px_-6px_12px_#2a3543]";

// =====================================================
// ALLOWED ROLES
// =====================================================

const SUPPORTED_ROLES = [
  "user",
  "artist",
  "superadmin",
];

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

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  // =====================================================
  // ROLE REDIRECT
  // =====================================================

  const redirectByRole = (role) => {
    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();

    console.log(
      "REDIRECTING USER WITH ROLE:",
      normalizedRole
    );

    switch (normalizedRole) {
      // -------------------------------------------------
      // SUPER ADMIN
      // -------------------------------------------------

      case "superadmin":
        console.log(
          "REDIRECT TARGET: /superadmin/dashboard"
        );

        navigate(
          "/superadmin/dashboard",
          {
            replace: true,
          }
        );

        return;

      // -------------------------------------------------
      // ARTIST
      // -------------------------------------------------

      case "artist":
        console.log(
          "REDIRECT TARGET: /artist/dashboard"
        );

       navigate("/home", { replace: true });

        return;

      // -------------------------------------------------
      // NORMAL USER
      // -------------------------------------------------

      case "user":
        console.log(
          "REDIRECT TARGET: /home"
        );

        navigate("/home", {
          replace: true,
        });

        return;

      // -------------------------------------------------
      // UNKNOWN ROLE
      // -------------------------------------------------

      default:
        console.error(
          "UNKNOWN ROLE:",
          normalizedRole
        );

        navigate("/home", {
          replace: true,
        });

        return;
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
    const response = await axios.post(
      `${BASE_URL.replace(/\/+$/, "")}/api/auth/login`,
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

    // Save the authenticated session.
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

    // Update the application's authentication context.
    login(token, user);

    // Show the appropriate success message.
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
    setError("A server error occurred. Please try again later.");
  } else {
    setError(
      error.response?.data?.message ||
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
        min-h-screen
        w-full
        overflow-hidden
        relative
        flex
        items-center
        justify-center
        px-4
        py-8
        md:px-8
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

      <div
        className="
          absolute
          top-[12%]
          left-[8%]
          hidden
          lg:block
        "
      >
        <FloatingOrb
          icon={Music2}
          color={PURPLE}
        />
      </div>

      <div
        className="
          absolute
          bottom-[15%]
          right-[8%]
          hidden
          lg:block
        "
      >
        <FloatingOrb
          icon={Headphones}
          color={TEAL}
        />
      </div>

      {/* =================================================
          MAIN LOGIN CARD
      ================================================= */}

      <div
        className="
          relative
          w-full
          max-w-6xl
          rounded-[36px]
          overflow-hidden
        "
        style={{
          background: BASE,

          boxShadow:
            "18px 18px 40px #0f141a,-18px -18px 40px #2a3543",
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

            {/* LOGO */}

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

                    boxShadow:
                      "8px 8px 16px #0f141a,-8px -8px 16px #2a3543",
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

            {/* CENTER */}

            <div
              className="
                relative
                z-10
                max-w-xl
              "
            >
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

                  boxShadow:
                    "inset 4px 4px 8px #0f141a,inset -4px -4px 8px #2a3543",
                }}
              >
                <Sparkles
                  size={15}
                  style={{
                    color: TEAL,
                  }}
                />

                <span
                  className="
                    text-xs
                    font-semibold
                    text-gray-300
                  "
                >
                  YOUR MUSIC. YOUR SPACE.
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
                Music

                <span
                  className="block"
                  style={{
                    color: PURPLE,
                  }}
                >
                  starts here.
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
                Enter your personal music
                space and continue where
                your sound left off.
              </p>

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
                className="
                  w-2
                  h-2
                  rounded-full
                "
                style={{
                  background: TEAL,

                  boxShadow:
                    `0 0 12px ${TEAL}`,
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
              p-5
              sm:p-8
              md:p-12
              lg:p-14
              flex
              items-center
            "
          >
            <div
              className="
                w-full
                max-w-md
                mx-auto
              "
            >
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

                    boxShadow:
                      "7px 7px 14px #0f141a,-7px -7px 14px #2a3543",
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

                    boxShadow:
                      "inset 5px 5px 10px #0f141a,inset -5px -5px 10px #2a3543",
                  }}
                >
                  <LockKeyhole
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
                  Welcome back
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    mt-2
                  "
                >
                  Sign in to continue to
                  your account.
                </p>
              </div>

              {/* ERROR */}

              {error && (
                <div
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

                    boxShadow:
                      "inset 4px 4px 8px #0f141a,inset -4px -4px 8px #2a3543",
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
                      background:
                        "rgba(239,68,68,0.08)",
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

              {/* SUCCESS */}

              {success && (
                <div
                  className="
                    mb-5
                    rounded-2xl
                    p-4
                    flex
                    items-center
                    gap-3
                  "
                  style={{
                    background: BASE,

                    boxShadow:
                      "inset 4px 4px 8px #0f141a,inset -4px -4px 8px #2a3543",
                  }}
                >
                  <CheckCircle2
                    size={18}
                    style={{
                      color: TEAL,
                    }}
                  />

                  <p
                    className="
                      text-xs
                      font-medium
                    "
                    style={{
                      color: TEAL,
                    }}
                  >
                    {success}
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
                    className={`
                      relative
                      rounded-2xl
                      transition-all
                      duration-200
                      ${insetShadow}
                    `}
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
                        color:
                          formData.email
                            ? PURPLE
                            : "#68707d",
                      }}
                    />

                    <input
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loading}
                      className="
                        w-full
                        h-14
                        rounded-2xl
                        bg-transparent
                        pl-12
                        pr-4
                        text-sm
                        text-[#bab9b9]
                        placeholder:text-gray-600
                        outline-none
                        disabled:opacity-50
                        
                      "
                      style={{
                    background: BASE,

                    boxShadow:
                      "inset 5px 5px 10px #0f141a,inset -5px -5px 10px #2a3543",
                  }}
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    className="
                      block
                      text-xs
                      font-semibold
                      text-gray-400
                      mb-2
                      ml-1
                    "
                  >
                    Password
                  </label>

                  <div
                    className={`
                      relative
                      rounded-2xl
                      transition-all
                      duration-200
                      
                    `}
                    
                  >
                    <LockKeyhole
                      size={18}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        pointer-events-none
                      "
                      style={{
                        color:
                          formData.password
                            ? PURPLE
                            : "#68707d",
                      }}
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="
                        w-full
                        h-14
                        rounded-2xl
                        bg-transparent
                        pl-12
                        pr-12
                        text-sm
                        text-white
                        placeholder:text-gray-600
                        outline-none
                        disabled:opacity-50
                      "
                      style={{
                    background: BASE,

                    boxShadow:
                      "inset 5px 5px 10px #0f141a,inset -5px -5px 10px #2a3543",
                  }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) =>
                            !prev
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        w-9
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-gray-500
                        hover:text-gray-200
                        transition-colors
                      "
                    >
                      {showPassword ? (
                        <EyeOff
                          size={18}
                        />
                      ) : (
                        <Eye
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* LOGIN BUTTON */}

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
  "
  style={{
    background: "#8c7cf7",
    boxShadow: "7px 7px 14px #0f141a, -7px -7px 14px #2a3543",
  }}
>
  {/* Hover effect — must not intercept clicks */}
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

  {/* Centered button content */}
  <span className="relative z-10 flex items-center justify-center gap-2">
    {loading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Signing in...
      </>
    ) : (
      <>
        Sign in
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                <div
                  className="
                    h-px
                    flex-1
                    bg-[#303641]
                  "
                />

                <span
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                    text-gray-600
                  "
                >
                  New here?
                </span>

                <div
                  className="
                    h-px
                    flex-1
                    bg-[#303641]
                  "
                />
              </div>

              {/* SIGN UP */}

              <Link
                to="/signup"
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

                  boxShadow:
                    "7px 7px 14px #0f141a,-7px -7px 14px #2a3543",
                }}
              >
                <UserRound
                  size={17}
                />

                Create an account
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
                  Protected account access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}

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
    </div>
  );
};

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
      className="
        rounded-2xl
        p-4
      "
      style={{
        background: BASE,

        boxShadow:
          "inset 4px 4px 8px #0f141a,inset -4px -4px 8px #2a3543",
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

          boxShadow:
            "5px 5px 10px #0f141a,-5px -5px 10px #2a3543",
        }}
      >
        <Icon
          size={16}
          style={{
            color,
          }}
        />
      </div>

      <p
        className="
          text-xs
          font-bold
          text-gray-200
        "
      >
        {title}
      </p>

      <p
        className="
          text-[10px]
          text-gray-600
          mt-1
        "
      >
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
          "10px 10px 20px #0f141a,-10px -10px 20px #2a3543",
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

export default Signin;