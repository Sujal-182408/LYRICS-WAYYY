import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  Music2,
  UserRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Check,
  X,
} from "lucide-react";

import axios from "axios";

import { BASE_URL } from "../../config/api";
import { useAuth } from "../../AuthContext";

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
// SIGNUP
// =====================================================

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ===================================================
  // FORM STATE
  // ===================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ===================================================
  // UI STATE
  // ===================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ===================================================
  // PASSWORD RULES
  // ===================================================

  const passwordRules = useMemo(() => {
    const password = formData.password;

    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  }, [formData.password]);

  // ===================================================
  // PASSWORD STRENGTH
  // ===================================================

  const passwordStrength = useMemo(() => {
    const password = formData.password;

    if (!password) {
      return {
        label: "",
        width: "0%",
      };
    }

    let score = 0;

    if (password.length >= 8) {
      score++;
    }

    if (password.length >= 10) {
      score++;
    }

    if (/[A-Z]/.test(password)) {
      score++;
    }

    if (/[a-z]/.test(password)) {
      score++;
    }

    if (/[0-9]/.test(password)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    }

    if (score <= 2) {
      return {
        label: "Weak",
        width: "33%",
      };
    }

    if (score <= 4) {
      return {
        label: "Good",
        width: "66%",
      };
    }

    return {
      label: "Strong",
      width: "100%",
    };
  }, [formData.password]);

  // ===================================================
  // PASSWORD MATCH
  // ===================================================

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password ===
      formData.confirmPassword;

  // ===================================================
  // INPUT CHANGE
  // ===================================================

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

  // ===================================================
  // VALIDATION
  // ===================================================

  const validateForm = () => {
    const name =
      formData.name.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const password =
      formData.password;

    const confirmPassword =
      formData.confirmPassword;

    // -------------------------------------------------
    // NAME
    // -------------------------------------------------

    if (!name) {
      return "Please enter your name.";
    }

    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (name.length > 100) {
      return "Name cannot exceed 100 characters.";
    }

    // -------------------------------------------------
    // EMAIL
    // -------------------------------------------------

    if (!email) {
      return "Please enter your email address.";
    }

    if (email.length > 254) {
      return "Email address is too long.";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    // -------------------------------------------------
    // PASSWORD
    // -------------------------------------------------

    if (!password) {
      return "Please create a password.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    // bcrypt maximum safe input
    // is 72 bytes.

    if (
      new TextEncoder().encode(password).length >
      72
    ) {
      return "Password cannot exceed 72 bytes.";
    }

    // -------------------------------------------------
    // CONFIRM PASSWORD
    // -------------------------------------------------

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  // ===================================================
  // SIGNUP
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------
    // FRONTEND VALIDATION
    // -------------------------------------------------

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // ------------------------------------------------
      // CLEAN DATA
      // ------------------------------------------------

      const name =
        formData.name.trim();

      const email =
        formData.email
          .trim()
          .toLowerCase();

      const password =
        formData.password;

      const confirmPassword =
        formData.confirmPassword;

      // ------------------------------------------------
      // DEBUG
      // ------------------------------------------------

      console.log(
        "SIGNUP REQUEST:",
        {
          name,
          email,
          password,
          confirmPassword,
          passwordsMatch:
            password ===
            confirmPassword,
        }
      );

      // ------------------------------------------------
      // PUBLIC SIGNUP
      // ------------------------------------------------
      //
      // IMPORTANT:
      //
      // Do NOT send role from frontend.
      //
      // Backend ALWAYS creates public signup
      // accounts with role: "user".
      //
      // ------------------------------------------------

      const response =
        await axios.post(
          `${BASE_URL}/api/auth/signup`,
          {
            name,
            email,
            password,
            confirmPassword,
          },
          {
            timeout: 15000,
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      console.log(
        "SIGNUP RESPONSE:",
        response.data
      );

      const data =
        response.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to create your account."
        );
      }

      // =================================================
      // CASE 1
      // BACKEND RETURNS TOKEN + USER
      // =================================================

      if (
        data.token &&
        data.user
      ) {
        const user =
          data.user;

        const role =
          String(
            user.role ||
              "user"
          )
            .trim()
            .toLowerCase();

        // ------------------------------------------------
        // SECURITY CHECK
        // ------------------------------------------------
        //
        // Public signup MUST NEVER create:
        //
        // artist
        // admin
        // superadmin
        //
        // ------------------------------------------------

        if (role !== "user") {
          throw new Error(
            "Invalid account role returned by the server."
          );
        }

        // ------------------------------------------------
        // STORE TOKEN
        // ------------------------------------------------

        localStorage.setItem(
          "token",
          data.token
        );

        // ------------------------------------------------
        // STORE USER
        // ------------------------------------------------

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        // ------------------------------------------------
        // STORE ROLE
        // ------------------------------------------------

        localStorage.setItem(
          "role",
          role
        );

        // ------------------------------------------------
        // APPROVAL STATUS
        // ------------------------------------------------

        if (
          user.approvalStatus
        ) {
          localStorage.setItem(
            "approvalStatus",
            user.approvalStatus
          );
        } else {
          localStorage.removeItem(
            "approvalStatus"
          );
        }

        // ------------------------------------------------
        // AUTH CONTEXT
        // ------------------------------------------------

        login(data.token);

        // ------------------------------------------------
        // SUCCESS
        // ------------------------------------------------

        setSuccess(
          "Account created successfully. Welcome to JOY MUSIC!"
        );

        // ------------------------------------------------
        // REDIRECT
        // ------------------------------------------------

        setTimeout(() => {
          navigate("/home", {
            replace: true,
          });
        }, 700);

        return;
      }

      // =================================================
      // CASE 2
      // BACKEND CREATES ACCOUNT WITHOUT LOGIN
      // =================================================

      setSuccess(
        "Account created successfully. Redirecting to sign in..."
      );

      setTimeout(() => {
        navigate("/signin", {
          replace: true,
          state: {
            email,
          },
        });
      }, 900);
    } catch (error) {
      // ------------------------------------------------
      // LOG
      // ------------------------------------------------

      console.error(
        "SIGNUP ERROR:",
        error
      );

      console.error(
        "SIGNUP SERVER RESPONSE:",
        error?.response?.data
      );

      // ------------------------------------------------
      // DEFAULT MESSAGE
      // ------------------------------------------------

      let message =
        "Unable to create your account. Please try again.";

      // ------------------------------------------------
      // SERVER MESSAGE
      // ------------------------------------------------

      if (
        error?.response?.data
          ?.message
      ) {
        message =
          error.response.data.message;
      }

      // ------------------------------------------------
      // NETWORK ERROR
      // ------------------------------------------------

      else if (
        error?.code ===
        "ECONNABORTED"
      ) {
        message =
          "The server took too long to respond. Please try again.";
      }

      // ------------------------------------------------
      // CONNECTION ERROR
      // ------------------------------------------------

      else if (
        !error?.response
      ) {
        message =
          "Unable to connect to the server. Please check your connection.";
      }

      // ------------------------------------------------
      // JAVASCRIPT ERROR
      // ------------------------------------------------

      else if (
        error?.message
      ) {
        message =
          error.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

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
          -right-40
          w-[430px]
          h-[430px]
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
          -left-40
          w-[460px]
          h-[460px]
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
          w-[700px]
          h-[700px]
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
          FLOATING MUSIC ICONS
      ================================================= */}

      <div
        className="
          absolute
          top-[12%]
          right-[8%]
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
          bottom-[14%]
          left-[8%]
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
          MAIN CARD
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
            lg:grid-cols-[0.95fr_1.05fr]
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
              min-h-[720px]
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
                -right-32
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
                -left-44
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
                    JOY
                  </h1>

                  <p
                    className="
                      text-[10px]
                      text-gray-500
                      tracking-[0.3em]
                    "
                  >
                    MUSIC
                  </p>
                </div>
              </div>
            </div>

            {/* CENTER */}

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
                  JOIN THE SOUND
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
                Create your

                <span
                  className="
                    block
                  "
                  style={{
                    color: PURPLE,
                  }}
                >
                  music space.
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
                Build your personal music
                experience, discover songs,
                create collections and enjoy
                your sound your way.
              </p>

              {/* FEATURES */}

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
                  icon={UserRound}
                  title="Personal"
                  text="Your own space"
                  color={PURPLE}
                />

                <FeatureCard
                  icon={Headphones}
                  title="Unlimited"
                  text="Made for music"
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

              Secure account creation
            </div>
          </div>

          {/* =================================================
              RIGHT SIGNUP FORM
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
              {/* =================================================
                  MOBILE LOGO
              ================================================= */}

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

              {/* =================================================
                  HEADER
              ================================================= */}

              <div className="mb-7">
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
                  <UserRound
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
                  Create account
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    mt-2
                  "
                >
                  Start your JOY MUSIC
                  journey today.
                </p>
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

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

              {/* =================================================
                  SUCCESS
              ================================================= */}

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

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* NAME */}

                <InputField
                  label="Full name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  icon={UserRound}
                  disabled={loading}
                  autoComplete="name"
                />

                {/* EMAIL */}

                <InputField
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  icon={Mail}
                  disabled={loading}
                  autoComplete="email"
                />

                {/* =================================================
                    PASSWORD
                ================================================= */}

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
                      ${insetShadow}
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
  type={showPassword ? "text" : "password"}
  name="password"
  value={formData.password}
  onChange={handleChange}
  placeholder="Create a password"
  autoComplete="new-password"
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
      "inset 5px 5px 10px #0f141a, inset -5px -5px 10px #2a3543",
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
                        text-gray-500
                        hover:text-gray-200
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

                  {/* PASSWORD STRENGTH */}

                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-600">
                          Password strength
                        </span>

                        <span
                          className="text-[10px] font-semibold"
                          style={{
                            color:
                              passwordStrength.label ===
                              "Strong"
                                ? TEAL
                                : passwordStrength.label ===
                                  "Good"
                                ? PURPLE
                                : "#f87171",
                          }}
                        >
                          {
                            passwordStrength.label
                          }
                        </span>
                      </div>

                      <div
                        className="
                          h-1.5
                          rounded-full
                          overflow-hidden
                        "
                        style={{
                          background: DARK,
                        }}
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            transition-all
                            duration-300
                          "
                          style={{
                            width:
                              passwordStrength.width,
                            background:
                              passwordStrength.label ===
                              "Strong"
                                ? TEAL
                                : passwordStrength.label ===
                                  "Good"
                                ? PURPLE
                                : "#f87171",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <PasswordRule
                          valid={
                            passwordRules.length
                          }
                          text="8+ characters"
                        />

                        <PasswordRule
                          valid={
                            passwordRules.uppercase
                          }
                          text="Uppercase"
                        />

                        <PasswordRule
                          valid={
                            passwordRules.lowercase
                          }
                          text="Lowercase"
                        />

                        <PasswordRule
                          valid={
                            passwordRules.number
                          }
                          text="Number"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* =================================================
                    CONFIRM PASSWORD
                ================================================= */}

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
                    Confirm password
                  </label>

                  <div
                    className={`
                      relative
                      rounded-2xl
                      ${insetShadow}
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
                          passwordsMatch
                            ? TEAL
                            : formData.confirmPassword
                            ? PURPLE
                            : "#68707d",
                      }}
                    />

                  <input
  type={showConfirmPassword ? "text" : "password"}
  name="confirmPassword"
  value={formData.confirmPassword}
  onChange={handleChange}
  placeholder="Confirm your password"
  autoComplete="new-password"
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
      "inset 5px 5px 10px #0f141a, inset -5px -5px 10px #2a3543",
  }}
/>

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) =>
                            !prev
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-gray-500
                        hover:text-gray-200
                      "
                    >
                      {showConfirmPassword ? (
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

                  {/* PASSWORD MATCH */}

                  {formData.confirmPassword && (
                    <div className="flex items-center gap-2 mt-2 ml-1">
                      {passwordsMatch ? (
                        <>
                          <Check
                            size={13}
                            style={{
                              color: TEAL,
                            }}
                          />

                          <span
                            className="text-[10px]"
                            style={{
                              color: TEAL,
                            }}
                          >
                            Passwords match
                          </span>
                        </>
                      ) : (
                        <>
                          <X
                            size={13}
                            className="text-red-400"
                          />

                          <span className="text-[10px] text-red-400">
                            Passwords do not match
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* =================================================
                    CREATE ACCOUNT
                ================================================= */}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    group
                    relative
                    w-full
                    h-14
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    gap-3
                    text-sm
                    font-bold
                    text-white
                    overflow-hidden
                    transition-all
                    duration-200
                    active:scale-[0.98]
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    mt-2
                  "
                  style={{
                    background: PURPLE,
                    boxShadow:
                      "0 12px 28px rgba(140,124,247,0.24)",
                  }}
                >
                  <span
                    className="
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

                  {loading ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />

                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account

                      <ArrowRight
                        size={18}
                        className="
                          transition-transform
                          duration-200
                          group-hover:translate-x-1
                        "
                      />
                    </>
                  )}
                </button>
              </form>

              {/* =================================================
                  LOGIN LINK
              ================================================= */}

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
                  Already registered?
                </span>

                <div
                  className="
                    h-px
                    flex-1
                    bg-[#303641]
                  "
                />
              </div>

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
                  boxShadow:
                    "7px 7px 14px #0f141a,-7px -7px 14px #2a3543",
                }}
              >
                <LockKeyhole
                  size={17}
                />

                Sign in instead
              </Link>

              {/* =================================================
                  SECURITY
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-6
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
                  Your account is protected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

// =====================================================
// INPUT FIELD
// =====================================================

const InputField = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  autoComplete,
}) => {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="
          block
          text-xs
          font-semibold
          text-gray-400
          mb-2
          ml-1
        "
      >
        {label}
      </label>

      <div className="relative w-full rounded-2xl">
        {Icon && (
          <Icon
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              pointer-events-none
            "
            style={{
              color: value ? PURPLE : "#68707d",
            }}
          />
        )}

        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
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
            border
            border-transparent
            focus:border-[#8c7cf7]/50
            transition-all
            duration-200
            disabled:opacity-50
          "
          style={{
            background: BASE,
            boxShadow:
              "inset 5px 5px 10px #0f141a, inset -5px -5px 10px #2a3543",
          }}
        />
      </div>
    </div>
  );
};
// =====================================================
// PASSWORD RULE
// =====================================================

const PasswordRule = ({ valid, text }) => {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        rounded-xl
        px-3
        py-2
        transition-all
        duration-200
      "
      style={{
        background: BASE,
        boxShadow:
          "inset 5px 5px 10px #0f141a, inset -5px -5px 10px #2a3543",
      }}
    >
      {valid ? (
        <Check
          size={12}
          strokeWidth={2.5}
          style={{ color: TEAL }}
        />
      ) : (
        <X
          size={12}
          strokeWidth={2}
          style={{ color: "#68707d" }}
        />
      )}

      <span
        className="text-[10px] transition-colors duration-200"
        style={{
          color: valid ? TEAL : "#68707d",
        }}
      >
        {text}
      </span>
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

export default Signup;