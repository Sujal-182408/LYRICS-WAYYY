import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Music2,
  AlertCircle,
} from "lucide-react";
import { BASE_URL } from "../../config/api";

const API_URL = `${String(BASE_URL || "").replace(/\/+$/, "")}/api/auth`;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/forgot-password`,
        { email: cleanEmail },
        { timeout: 20000 }
      );

      setSuccess(
        response.data?.message ||
          "If an account exists for that email, a password reset link has been sent."
      );
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Too many requests. Please try again later."
          : err.response?.data?.message ||
              "Unable to send the reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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

        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252d39] text-[#8c7cf7] shadow-[inset_5px_5px_10px_#151a22,inset_-5px_-5px_10px_#35404e]">
          <Mail size={25} />
        </div>

        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-[#2bd4c4]">
            <Music2 size={15} />
            LYRICS WAYYY
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Forgot password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Enter the email address linked to your account. If it exists,
            we’ll send you a secure password reset link.
          </p>
        </div>

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
              htmlFor="reset-email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email address
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#1b222c] px-4 shadow-[inset_5px_5px_10px_#121720,inset_-5px_-5px_10px_#27313e] focus-within:border-[#8c7cf7]/50">
              <Mail size={18} className="shrink-0 text-[#8c7cf7]" />

              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                required
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8c7cf7] to-[#2bd4c4] font-semibold text-[#10151d] shadow-[0_8px_22px_rgba(140,124,247,.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            to="/signin"
            className="font-semibold text-[#2bd4c4] transition hover:text-[#8c7cf7]"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}