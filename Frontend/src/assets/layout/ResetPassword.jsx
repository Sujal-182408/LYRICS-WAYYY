import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Music2,
  AlertCircle,
} from "lucide-react";
import { BASE_URL } from "../../config/api";

const API_URL = `${String(BASE_URL || "").replace(/\/+$/, "")}/api/auth`;

export default function ResetPassword() {
  const { token = "" } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const tokenIsValid = useMemo(
    () => token.length === 64 && /^[a-f0-9]+$/i.test(token),
    [token]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!tokenIsValid) {
      setError("This password reset link is invalid. Request a new link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Your password cannot exceed 72 bytes.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/reset-password`,
        {
          token,
          newPassword,
          confirmPassword,
        },
        { timeout: 20000 }
      );

      setSuccess(
        response.data?.message ||
          "Your password has been reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 1800);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Too many attempts. Please wait and try again."
          : err.response?.data?.message ||
              "Unable to reset your password. Request a new reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordInputClass =
    "h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171b23] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#8c7cf7]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#2bd4c4]/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[2rem] border border-white/[0.04] bg-[#202630] p-7 shadow-[14px_14px_32px_#0d1118,-10px_-10px_28px_#2b3442] sm:p-9">
        <Link
          to="/signin"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-[#2bd4c4]"
        >
          <ArrowLeft size={17} />
          Back to sign in
        </Link>

        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252d39] text-[#2bd4c4] shadow-[inset_5px_5px_10px_#151a22,inset_-5px_-5px_10px_#35404e]">
          <KeyRound size={25} />
        </div>

        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-[#2bd4c4]">
            <Music2 size={15} />
            LYRICS WAYYY
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Create new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Choose a strong password you haven’t used for this account before.
          </p>
        </div>

        {!tokenIsValid && (
          <div
            role="alert"
            className="mb-5 flex gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>
              This reset link appears to be invalid. Request a new one from
              the forgot-password page.
            </span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex gap-3 rounded-xl border border-[#2bd4c4]/20 bg-[#2bd4c4]/10 p-4 text-sm leading-6 text-[#a9f4e9]"
          >
            <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              New password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#1b222c] px-4 shadow-[inset_5px_5px_10px_#121720,inset_-5px_-5px_10px_#27313e] focus-within:border-[#8c7cf7]/50">
              <LockKeyhole size={18} className="shrink-0 text-[#8c7cf7]" />

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
                className={passwordInputClass}
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 text-slate-500 transition hover:text-[#2bd4c4]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Confirm new password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#1b222c] px-4 shadow-[inset_5px_5px_10px_#121720,inset_-5px_-5px_10px_#27313e] focus-within:border-[#8c7cf7]/50">
              <LockKeyhole size={18} className="shrink-0 text-[#2bd4c4]" />

              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
                className={passwordInputClass}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="shrink-0 text-slate-500 transition hover:text-[#2bd4c4]"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Use at least 8 characters. Passwords are limited to 72 UTF-8 bytes.
          </p>

          <button
            type="submit"
            disabled={loading || !tokenIsValid || Boolean(success)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8c7cf7] to-[#2bd4c4] font-semibold text-[#10151d] shadow-[0_8px_22px_rgba(140,124,247,.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Updating password...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Need another link?{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-[#2bd4c4] transition hover:text-[#8c7cf7]"
          >
            Request reset link
          </Link>
        </p>
      </section>
    </main>
  );
}