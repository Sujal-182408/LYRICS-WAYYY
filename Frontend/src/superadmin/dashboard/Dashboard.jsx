
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Album,
  CheckCircle2,
  Clock3,
  Database,
  Disc3,
  Headphones,
  Loader2,
  Music2,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
  Mic2,
  Search,
} from "lucide-react";

import {
  getDashboardStats,
  getRecentSongs,
  getRecentArtistApplications,
  reviewArtistApplication,
} from "../services/dashboardService";

// =====================================================
// THEME
// =====================================================

const BASE = "#15181d";
const LIGHT = "#242a32";
const PURPLE = "#8c7cf7";
const TEAL = "#2bd4c4";

const raised =
  "shadow-[8px_8px_18px_#0b0e12,-8px_-8px_18px_#252c35]";


// =====================================================
// API / MEDIA URL
// =====================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

function getMediaUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  const image = imagePath.trim().replace(/\\/g, "/");

  if (!image) {
    return "";
  }

  // Already a complete URL
  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  // Remove leading slashes
  let cleanPath = image.replace(/^\/+/, "");

  // Prevent duplicate uploads/uploads/ in the URL
  cleanPath = cleanPath.replace(/^uploads\/+uploads\//i, "uploads/");

  return `${API_BASE_URL}/${cleanPath}`;
}

// =====================================================
// GET ARTIST IMAGE
// =====================================================

function getArtistImage(application) {
  return (
    application?.artist?.image ||
    application?.artistProfile?.image ||
    application?.artist_profile?.image ||
    application?.artistImage?.image ||
    application?.image ||
    application?.artistImage ||
    application?.artist_image ||
    application?.image_url ||
    application?.profileImage ||
    application?.profile_image ||
    application?.user?.profileImage ||
    application?.user?.profile_image ||
    application?.user_id?.profileImage ||
    application?.user_id?.profile_image ||
    ""
  );
}




function getSongCover(song) {
  return (
    song?.coverImage ||
    song?.cover_image ||
    song?.coverUrl ||
    song?.cover_url ||
    song?.image_url ||
    ""
  );
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApplicationStatus(application) {
  return (
    application?.status ||
    application?.approvalStatus ||
    "pending"
  ).toLowerCase();
}

// =====================================================
// REUSABLE STAT CARD
// =====================================================

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent = "purple",
  subtitle,
}) {
  const accentColor = accent === "teal" ? TEAL : PURPLE;

  return (
    <div
      className={`rounded-[26px] border border-white/[0.035] p-5 ${raised}`}
      style={{ background: BASE }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            color: accentColor,
            background: LIGHT,
            boxShadow:
              "inset 3px 3px 7px #0d1014, inset -3px -3px 7px #303741",
          }}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {label}
          </p>

          {loading ? (
            <Loader2
              className="ml-auto mt-2 animate-spin text-white/50"
              size={21}
            />
          ) : (
            <p className="mt-1 text-3xl font-black tracking-tight text-white">
              {value ?? 0}
            </p>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="mt-4 text-xs text-white/35">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({ status }) {
  const normalized = (
    status || "pending"
  ).toLowerCase();

  const config = {
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      className:
        "border-teal-400/20 bg-teal-400/10 text-teal-300",
    },

    rejected: {
      label: "Rejected",
      icon: XCircle,
      className:
        "border-red-400/20 bg-red-400/10 text-red-300",
    },

    pending: {
      label: "Pending",
      icon: Clock3,
      className:
        "border-amber-400/20 bg-amber-400/10 text-amber-300",
    },
  };

  const current = config[normalized] || config.pending;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${current.className}`}
    >
      <Icon size={13} />
      {current.label}
    </span>
  );
}

// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: LIGHT,
            color: PURPLE,
            boxShadow:
              "inset 3px 3px 7px #0d1014, inset -3px -3px 7px #303741",
          }}
        >
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-base font-bold text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-0.5 text-xs text-white/35">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

// =====================================================
// IMAGE FALLBACK
// =====================================================

function ArtistAvatar({
  application,
  artistName,
}) {
  const imagePath = getArtistImage(application);
  const imageUrl = getMediaUrl(imagePath);
console.log("Artist image path:", getArtistImage(application));
console.log("Artist image URL:", getMediaUrl(getArtistImage(application)));
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.04]"
      style={{
        background: LIGHT,
        boxShadow:
          "inset 3px 3px 7px #0d1014, inset -3px -3px 7px #303741",
      }}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={`${artistName} artist profile`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => {
            console.error(
              "Artist image failed to load:",
              imageUrl
            );

            setImageFailed(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Mic2
            size={20}
            className="text-purple-300/70"
          />
        </div>
      )}
    </div>
  );
}

// =====================================================
// SONG COVER
// =====================================================

function SongCover({ song, title }) {
  const imagePath = getSongCover(song);
  const imageUrl = getMediaUrl(imagePath);

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{
        background: BASE,
        boxShadow:
          "inset 4px 4px 8px #0b0e12, inset -4px -4px 8px #252c35",
      }}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={`${title} cover`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Music2
          size={21}
          className="text-purple-300/50"
        />
      )}
    </div>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [songs, setSongs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionId, setActionId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          statsResponse,
          songsResponse,
          applicationsResponse,
        ] = await Promise.all([
          getDashboardStats(),

          getRecentSongs({
            page: 1,
            limit: 8,
          }),

          getRecentArtistApplications({
            page: 1,
            limit: 8,
            status: "",
          }),
        ]);

        setStats(
          statsResponse?.stats ||
            statsResponse?.data?.stats ||
            statsResponse?.data ||
            statsResponse ||
            {}
        );

        const songList =
          songsResponse?.songs ||
          songsResponse?.data?.songs ||
          songsResponse?.data?.data?.songs ||
          songsResponse?.data ||
          [];

        const applicationList =
          applicationsResponse?.applications ||
          applicationsResponse?.data?.applications ||
          applicationsResponse?.data?.data?.applications ||
          applicationsResponse?.data ||
          [];

        setSongs(
          Array.isArray(songList) ? songList : []
        );

        setApplications(
          Array.isArray(applicationList)
            ? applicationList
            : []
        );
      } catch (err) {
        console.error(
          "SUPERADMIN DASHBOARD ERROR:",
          err
        );

        console.error(
          "SERVER RESPONSE:",
          err?.response?.data
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ===================================================
  // NORMALIZED STATISTICS
  // ===================================================

  const normalizedStats = useMemo(() => {
    return {
      users:
        stats?.totalUsers ??
        stats?.users ??
        stats?.userCount ??
        0,

      artists:
        stats?.totalArtists ??
        stats?.artists ??
        stats?.artistCount ??
        0,

      songs:
        stats?.totalSongs ??
        stats?.songs ??
        stats?.songCount ??
        songs.length,

      albums:
        stats?.totalAlbums ??
        stats?.albums ??
        stats?.albumCount ??
        0,

      admins:
        stats?.totalAdmins ??
        stats?.admins ??
        stats?.adminCount ??
        0,

      pending:
        stats?.pendingApplications ??
        stats?.pendingArtistApplications ??
        applications.filter(
          (item) =>
            getApplicationStatus(item) === "pending"
        ).length,
    };
  }, [stats, songs, applications]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return applications;

    return applications.filter((application) => {
      const artistName =
        application?.artist_name ||
        application?.artistName ||
        "";

      const applicantName =
        application?.user_id?.name ||
        application?.user?.name ||
        "";

      const email =
        application?.user_id?.email ||
        application?.user?.email ||
        "";

      const genre = application?.genre || "";

      return [
        artistName,
        applicantName,
        email,
        genre,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [applications, search]);

  const pendingApplications = useMemo(() => {
    return filteredApplications.filter(
      (application) =>
        getApplicationStatus(application) === "pending"
    );
  }, [filteredApplications]);

  // ===================================================
  // APPROVE / REJECT
  // ===================================================

  const handleReview = async (
    application,
    action
  ) => {
    const id = application?._id;

    if (!id) {
      setError("Application ID is missing.");
      return;
    }

    const artistName =
      application?.artist_name ||
      application?.artistName ||
      "this artist";

    const message =
      action === "approve"
        ? `Approve ${artistName} as an artist?`
        : `Reject ${artistName}'s artist application?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setActionId(id);
      setError("");

      await reviewArtistApplication({
        id,
        action,
        admin_note:
          action === "approve"
            ? "Application approved by Super Admin."
            : "Application rejected by Super Admin.",
      });

      await loadDashboard({
        silent: true,
      });
    } catch (err) {
      console.error(
        "ARTIST REVIEW ERROR:",
        err
      );

      console.error(
        "SERVER RESPONSE:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Unable to ${action} artist application.`
      );
    } finally {
      setActionId(null);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="min-h-screen"
      style={{
        background: BASE,
        color: "#fff",
      }}
    >
      <div className="mx-auto max-w-[1600px]">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/10 bg-purple-400/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
              <Sparkles size={13} />
              Super Admin Control Center
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
              Monitor JOY MUSIC users, artists, songs,
              albums and artist applications from one
              live control center.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard({ silent: true })
            }
            disabled={refreshing}
            className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/[0.04] px-5 text-sm font-semibold text-white/75 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${raised}`}
            style={{ background: BASE }}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/5 p-4 text-sm text-red-200">
            <XCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Dashboard error
              </p>

              <p className="mt-1 text-xs text-red-200/60">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-200/50 hover:text-red-200"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={normalizedStats.users}
            loading={loading}
            subtitle="Registered accounts"
          />

          <StatCard
            icon={Mic2}
            label="Artists"
            value={normalizedStats.artists}
            loading={loading}
            accent="teal"
            subtitle="Approved artists"
          />

          <StatCard
            icon={Music2}
            label="Songs"
            value={normalizedStats.songs}
            loading={loading}
            subtitle="Available music"
          />

          <StatCard
            icon={Album}
            label="Albums"
            value={normalizedStats.albums}
            loading={loading}
            accent="teal"
            subtitle="Published albums"
          />

          <StatCard
            icon={ShieldCheck}
            label="Admins"
            value={normalizedStats.admins}
            loading={loading}
            subtitle="Administrative accounts"
          />

          <StatCard
            icon={Clock3}
            label="Pending"
            value={normalizedStats.pending}
            loading={loading}
            accent="teal"
            subtitle="Need review"
          />
        </section>

        {/* SYSTEM STATUS */}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: Server,
              title: "API Server",
              subtitle: "Connected",
              color: TEAL,
            },
            {
              icon: Database,
              title: "Database",
              subtitle: "MongoDB Active",
              color: PURPLE,
            },
            {
              icon: Activity,
              title: "Live Data",
              subtitle: "Refresh available",
              color: PURPLE,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`rounded-[24px] border border-white/[0.035] p-5 ${raised}`}
                style={{ background: BASE }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      background: LIGHT,
                      color: item.color,
                      boxShadow:
                        "inset 3px 3px 7px #0d1014,inset -3px -3px 7px #303741",
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-xs text-white/35">
                      {item.title}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_#2bd4c4]" />

                      <span
                        className="text-sm font-bold"
                        style={{ color: item.color }}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ARTIST APPLICATIONS */}

        <section
          className={`mb-8 rounded-[28px] border border-white/[0.035] p-5 sm:p-6 ${raised}`}
          style={{ background: BASE }}
        >
          <SectionHeader
            icon={UserCheck}
            title="Artist Applications"
            subtitle="Review artists waiting for approval"
            action={
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: LIGHT,
                  boxShadow:
                    "inset 3px 3px 7px #0d1014,inset -3px -3px 7px #303741",
                }}
              >
                <Search
                  size={15}
                  className="text-white/30"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search applications..."
                  aria-label="Search artist applications"
                  className="w-[180px] bg-transparent text-xs text-white outline-none placeholder:text-white/25"
                />
              </div>
            }
          />

          {loading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin text-purple-300"
              />
            </div>
          ) : pendingApplications.length === 0 ? (
            <div
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl"
              style={{
                background: LIGHT,
                boxShadow:
                  "inset 5px 5px 12px #0d1014,inset -5px -5px 12px #303741",
              }}
            >
              <CheckCircle2
                size={32}
                className="text-teal-300/60"
              />

              <p className="mt-3 text-sm font-semibold text-white/60">
                No pending artist applications
              </p>

              <p className="mt-1 text-xs text-white/25">
                Everything is up to date.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[850px]">
                <div className="grid grid-cols-[1.4fr_1.1fr_1fr_.8fr_.8fr_1.3fr] gap-4 border-b border-white/[0.05] px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
                  <span>Artist</span>
                  <span>Applicant</span>
                  <span>Genre</span>
                  <span>Submitted</span>
                  <span>Status</span>
                  <span className="text-right">
                    Actions
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {pendingApplications.map(
                    (application) => {
                      const id = application?._id;

                      const artistName =
                        application?.artist_name ||
                        application?.artistName ||
                        "Unknown Artist";

                      const applicantName =
                        application?.user_id?.name ||
                        application?.user?.name ||
                        "Unknown User";

                      const genre =
                        application?.genre ||
                        "Not specified";

                      return (
                        <div
                          key={id}
                          className="grid grid-cols-[1.4fr_1.1fr_1fr_.8fr_.8fr_1.3fr] items-center gap-4 px-4 py-4 transition hover:bg-white/[0.015]"
                        >
                          {/* ARTIST + IMAGE */}

                          <div className="flex min-w-0 items-center gap-3">
                            <ArtistAvatar
                              application={application}
                              artistName={artistName}
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-white/85">
                                {artistName}
                              </p>

                              <p className="truncate text-[11px] text-white/25">
                                Application #
                                {String(id || "").slice(-6)}
                              </p>
                            </div>
                          </div>

                          {/* APPLICANT */}

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white/60">
                              {applicantName}
                            </p>

                            <p className="truncate text-[10px] text-white/25">
                              {application?.user_id?.email ||
                                application?.user?.email ||
                                ""}
                            </p>
                          </div>

                          {/* GENRE */}

                          <p className="truncate text-xs text-white/45">
                            {genre}
                          </p>

                          {/* DATE */}

                          <div>
                            <p className="text-xs text-white/55">
                              {formatDate(
                                application?.created_at ||
                                  application?.createdAt
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-white/20">
                              {formatTime(
                                application?.created_at ||
                                  application?.createdAt
                              )}
                            </p>
                          </div>

                          {/* STATUS */}

                          <StatusBadge
                            status={getApplicationStatus(
                              application
                            )}
                          />

                          {/* ACTIONS */}

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={actionId === id}
                              onClick={() =>
                                handleReview(
                                  application,
                                  "approve"
                                )
                              }
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-teal-400/10 bg-teal-400/5 px-3 text-xs font-bold text-teal-300 transition hover:bg-teal-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {actionId === id ? (
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}

                              Approve
                            </button>

                            <button
                              type="button"
                              disabled={actionId === id}
                              onClick={() =>
                                handleReview(
                                  application,
                                  "reject"
                                )
                              }
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-red-400/10 bg-red-400/5 px-3 text-xs font-bold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RECENT SONGS */}

        <section
          className={`rounded-[28px] border border-white/[0.035] p-5 sm:p-6 ${raised}`}
          style={{ background: BASE }}
        >
          <SectionHeader
            icon={Headphones}
            title="Recently Added Songs"
            subtitle="Live music library"
            action={
              <div className="flex items-center gap-2 text-xs text-white/25">
                <Music2 size={14} />
                {songs.length} loaded
              </div>
            }
          />

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin text-purple-300"
              />
            </div>
          ) : songs.length === 0 ? (
            <div
              className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl"
              style={{
                background: LIGHT,
                boxShadow:
                  "inset 5px 5px 12px #0d1014,inset -5px -5px 12px #303741",
              }}
            >
              <Disc3
                size={32}
                className="text-white/20"
              />

              <p className="mt-3 text-sm text-white/45">
                No songs found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {songs.map((song, index) => {
                const title =
                  song?.title || "Untitled Song";

                const artist =
                  typeof song?.artist === "string"
                    ? song.artist
                    : song?.artist?.name ||
                      "Unknown Artist";

                const album =
                  typeof song?.album === "string"
                    ? song.album
                    : song?.album?.name ||
                      "No Album";

                const genre =
                  song?.genre || "Unknown";

                const duration =
                  song?.duration || "—";

                return (
                  <div
                    key={
                      song?._id ||
                      song?.id ||
                      `${title}-${index}`
                    }
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.035] p-3 transition hover:border-white/[0.07]"
                    style={{
                      background: LIGHT,
                      boxShadow:
                        "inset 3px 3px 8px #0d1014,inset -3px -3px 8px #303741",
                    }}
                  >
                    <SongCover
                      song={song}
                      title={title}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white/85">
                        {title}
                      </p>

                      <p className="mt-1 truncate text-xs text-white/40">
                        {artist}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-white/[0.035] px-2 py-1 text-[10px] text-white/30">
                          {album}
                        </span>

                        <span className="rounded-md bg-purple-400/5 px-2 py-1 text-[10px] text-purple-300/60">
                          {genre}
                        </span>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-xs font-semibold text-white/45">
                        {duration}
                      </p>

                      <p className="mt-1 text-[10px] text-white/20">
                        #{String(index + 1).padStart(2, "0")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
