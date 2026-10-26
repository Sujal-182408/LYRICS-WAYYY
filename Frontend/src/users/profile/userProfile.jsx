import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Disc3,
  ExternalLink,
  Heart,
  Headphones,
  ImagePlus,
  ListMusic,
  Loader2,
  Mail,
  Mic2,
  Music2,
  Pencil,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  AlertCircle,
} from "lucide-react";

import { BASE_URL } from "../../config/api";
import ThemeSwitcher from "../../assets/utility/ThemeSwitcher";
import {
  getListeningHistory,
  getMyFavorites,
} from "../../services/profileService";
import { getMyPlaylists } from "../../services/playlistService";
import {
  getMyArtistApplication,
  submitArtistApplication,
} from "../../services/artistApplicationService";

/*
 * LYRICS WAYYY — responsive user profile
 * Uses existing theme CSS variables and existing profile/playlist/artist services.
 * Listening history is paginated at five rows per page.
 */

const raised =
  "border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[8px_8px_18px_var(--theme-shadowDark),-8px_-8px_18px_var(--theme-shadowLight)]";
const raisedSmall =
  "border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[5px_5px_11px_var(--theme-shadowDark),-5px_-5px_11px_var(--theme-shadowLight)]";
const inset =
  "border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[inset_5px_5px_11px_var(--theme-shadowDark),inset_-5px_-5px_11px_var(--theme-shadowLight)]";

const getToken = () => localStorage.getItem("token") || "";



const getArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
    if (Array.isArray(value?.data?.[key])) return value.data[key];
  }
  if (Array.isArray(value?.data)) return value.data;
  return [];
};
const unwrap = (value) => value?.data ?? value;
const getTitle = (entry) => {
  const song = entry?.song?.title
    ? entry.song
    : entry?.songId?.title
      ? entry.songId
      : entry;
  return song?.title || song?.name || song?.songTitle || "Untitled track";
};
const getArtistName = (entry) => {
  const song = entry?.song?.title
    ? entry.song
    : entry?.songId?.title
      ? entry.songId
      : entry;
  const artist = song?.artist ?? song?.artistName ?? entry?.artist;
  if (typeof artist === "string") return artist;
  return artist?.name || artist?.artistName || "Unknown artist";
};
const getCover = (entry) => {
  const song = entry?.song?.title
    ? entry.song
    : entry?.songId?.title
      ? entry.songId
      : entry;
  const album = typeof song?.album === "object" ? song.album : null;
  const path =
    song?.coverImage ||
    song?.image ||
    song?.thumbnail ||
    album?.coverImage ||
    album?.image;
  if (!path) return "";
  return /^https?:\/\//i.test(path)
    ? path
    : `${BASE_URL}/${String(path).replace(/^\/+/, "")}`;
};
const getDuration = (value) => {
  if (value === null || value === undefined || value === "") return "--:--";
  if (typeof value === "string" && value.includes(":")) return value;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};
const formatDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const formatTime = (seconds) => {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${totalMinutes}m`;
};
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "LW";

function Panel({ children, className = "", ...props }) {
  return (
    <section
      className={`${raised} min-w-0 rounded-[1.6rem] sm:rounded-4xl ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.24em] text-(--theme-surface)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--theme-surface)" />
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-black tracking-tight text-[var(--theme-text)] sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[var(--theme-muted)] sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function Cover({ src, title, size = "h-12 w-12" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      src={src}
      alt={title || "Cover art"}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-xl object-cover`}
    />
  ) : (
    <div
      className={`${inset} ${size} flex shrink-0 items-center justify-center rounded-xl text-[var(--theme-primary)]`}
    >
      <Music2 size={20} />
    </div>
  );
}

function EmptyState({ icon: Icon = Music2, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-9 text-center sm:py-12">
      <div
        className={`${inset} flex h-14 w-14 items-center justify-center rounded-2xl text-[var(--theme-primary)]`}
      >
        <Icon size={23} />
      </div>
      <h3 className="mt-4 text-sm font-bold text-[var(--theme-text)]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-[var(--theme-muted)]">
        {text}
      </p>
      {action}
    </div>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const [profile, setProfile] = useState({});
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyListeningSeconds, setHistoryListeningSeconds] = useState(0);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [latestReleases, setLatestReleases] = useState([]);
  const [application, setApplication] = useState(null);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [followingError, setFollowingError] = useState("");

  const [showArtistModal, setShowArtistModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState("");
  const [artistForm, setArtistForm] = useState({
    artistName: "",
    genre: "",
    bio: "",
    portfolioUrl: "",
    artistImage: null,
    verificationSong: null,
    verificationSongTitle: "",
    verificationSongDuration: "",
  });

  const requestHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getToken()}` }),
    [user?._id],
  );

  const loadUserAndProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/signin", { replace: true });
      return;
    }
    const [userResult, profileResult] = await Promise.allSettled([
      axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (userResult.status === "fulfilled") {
      const payload = unwrap(userResult.value);
      const freshUser =
        payload?.user || payload?.data?.user || payload?.data || payload;
      if (freshUser && typeof freshUser === "object") {
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        if (freshUser.role) localStorage.setItem("role", freshUser.role);
      }
    } else if (userResult.reason?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      navigate("/signin", { replace: true });
      return;
    } else {
      throw new Error(
        userResult.reason?.response?.data?.message ||
          "Unable to load your account.",
      );
    }

    if (profileResult.status === "fulfilled") {
      const payload = unwrap(profileResult.value);
      setProfile(
        payload?.profile ||
          payload?.data?.profile ||
          payload?.data ||
          payload ||
          {},
      );
    } else {
      console.warn(
        "Profile stats endpoint unavailable:",
        profileResult.reason?.message,
      );
      setProfile({});
    }
  }, [navigate]);

  const loadHistory = useCallback(
    async (page = historyPage) => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const response = await getListeningHistory({ page, limit: 5 });
        const payload = unwrap(response);
        const rows = getArray(payload, [
          "history",
          "listeningHistory",
          "items",
        ]);
        setHistory(rows);
        setHistoryTotal(
          Number(payload?.total ?? payload?.count ?? rows.length),
        );
        setHistoryPages(
          Math.max(
            1,
            Number(
              payload?.pages ??
                Math.ceil(Number(payload?.total ?? rows.length) / 5) ??
                1,
            ),
          ),
        );
      } catch (error) {
        setHistory([]);
        setHistoryTotal(0);
        setHistoryPages(1);
        setHistoryError(
          error?.response?.data?.message ||
            error?.message ||
            "Listening history is unavailable.",
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyPage],
  );

  // Load a larger history batch once for the Overview lifetime-time fallback.
  // The visible history table remains server-paginated at five rows per page.
  const loadListeningSummary = useCallback(async () => {
    try {
      const response = await getListeningHistory({ page: 1, limit: 100 });
      const payload = unwrap(response);
      const rows = getArray(payload, ["history", "listeningHistory", "items"]);
      const apiTotal = [
        payload?.totalListeningSeconds,
        payload?.listeningSeconds,
        payload?.stats?.totalListeningSeconds,
        payload?.stats?.listeningSeconds,
      ].find((value) => value !== undefined && value !== null && value !== "");

      const total =
        apiTotal !== undefined
          ? Number(apiTotal)
          : rows.reduce((sum, item) => {
              const value = Number(item?.listenedSeconds);
              return sum + (Number.isFinite(value) && value > 0 ? value : 0);
            }, 0);

      if (Number.isFinite(total) && total >= 0) {
        setHistoryListeningSeconds(total);
      }
    } catch (error) {
      // Overview still uses any lifetime statistic returned by /api/profile/me.
      console.warn("Listening-time summary unavailable:", error?.message);
    }
  }, []);

  const loadOtherSections = useCallback(async () => {
 const tasks = await Promise.allSettled([
  getMyFavorites(),
  getMyPlaylists(),
  getMyArtistApplication(),
  axios.get(`${BASE_URL}/api/profile/followed-artists`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  }),
  axios.get(`${BASE_URL}/api/songs`, {
    headers: requestHeaders,
  }),
]);

    const favoritePayload =
      tasks[0].status === "fulfilled" ? unwrap(tasks[0].value) : null;
    const favoriteRows = getArray(favoritePayload, [
      "favorites",
      "songs",
      "items",
    ]);
    setFavorites(favoriteRows);

    const playlistPayload =
      tasks[1].status === "fulfilled" ? unwrap(tasks[1].value) : null;
    setPlaylists(getArray(playlistPayload, ["playlists", "items"]));

    const applicationPayload =
      tasks[2].status === "fulfilled" ? unwrap(tasks[2].value) : null;
    setApplication(
      applicationPayload?.application ||
        applicationPayload?.data?.application ||
        null,
    );

    let followedList = [];

if (tasks[3].status === "fulfilled") {
  const payload = unwrap(tasks[3].value);

  console.log("Followed artists API response:", payload);

  followedList = getArray(payload, [
    "artists",
    "followedArtists",
    "follows",
    "data",
  ])
    .map((row) => row?.artist || row?.artistId || row)
    .filter(
      (artist) =>
        artist &&
        typeof artist === "object" &&
        (artist._id || artist.id || artist.name)
    );

  setFollowedArtists(followedList);
  setFollowingError("");
} else {
  console.error(
    "Failed to fetch followed artists:",
    tasks[3].reason
  );

  setFollowingError(
    "Unable to load followed artists. Please try again."
  );
}

    if (tasks[4].status === "fulfilled") {
      const payload = unwrap(tasks[4].value);
      const allSongs = getArray(payload, ["songs", "items", "results"]);
      const artistIds = new Set(
        followedList.map((artist) => String(artist?._id || artist?.id || "")),
      );
      const artistNames = new Set(
        followedList.map((artist) => String(artist?.name || "").toLowerCase()),
      );
      const filtered = allSongs.filter((song) => {
        const artist = song?.artist;
        const artistId =
          typeof artist === "object" ? artist?._id || artist?.id : artist;
        const artistName =
          typeof artist === "object"
            ? artist?.name
            : song?.artistName || artist;
        return (
          artistIds.has(String(artistId || "")) ||
          artistNames.has(String(artistName || "").toLowerCase())
        );
      });
      setLatestReleases(filtered.slice(0, 6));
    } else {
      setLatestReleases([]);
    }
  }, [requestHeaders]);

  const loadEverything = useCallback(async () => {
    setLoadError("");
    try {
      await loadUserAndProfile();
      await loadOtherSections();
    } catch (error) {
      setLoadError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadUserAndProfile, loadHistory, loadOtherSections, historyPage]);

  useEffect(() => {
    loadEverything();
    loadListeningSummary();
  }, []); // initial authenticated load; keep history summary separate from the paginated table

  useEffect(() => {
    loadHistory(historyPage);
  }, [historyPage]); // server-side pagination

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        loadEverything(),
        loadHistory(historyPage),
        loadListeningSummary(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const profileImage = useMemo(() => {
    const image = user?.profileImage || user?.avatar || user?.image || "";
    if (!image) return "";
    return /^https?:\/\//i.test(image)
      ? image
      : `${BASE_URL}/${String(image).replace(/^\/+/, "")}`;
  }, [user]);

  const stats = profile?.stats || profile || {};
  const totalFavorites = Number(
    stats?.favorites ?? stats?.totalFavorites ?? favorites.length ?? 0,
  );
  const totalPlayed = Number(
    stats?.songsPlayed ??
      stats?.totalPlays ??
      stats?.recentPlay ??
      historyTotal ??
      0,
  );

  // Prefer a lifetime total returned by the profile API. The history page is
  // paginated, so it must not be treated as the lifetime total when the API
  // provides a real listening-time value.
  const listeningSeconds = useMemo(() => {
    const candidates = [
      stats?.listeningSeconds,
      stats?.totalListeningSeconds,
      stats?.totalListeningTimeSeconds,
      stats?.listeningTimeSeconds,
      stats?.totalListeningTime,
      stats?.listeningTime,
      profile?.listeningSeconds,
      profile?.totalListeningSeconds,
      profile?.totalListeningTimeSeconds,
      profile?.listeningTimeSeconds,
      profile?.totalListeningTime,
      profile?.listeningTime,
      user?.listeningSeconds,
      user?.totalListeningSeconds,
      user?.totalListeningTimeSeconds,
      // History-based fallback makes Overview agree with Listening History.
      historyListeningSeconds,
    ];
    // A stale zero from an older profile schema must not hide real history time.
    const value =
      candidates.find(
        (candidate) =>
          candidate !== null &&
          candidate !== undefined &&
          candidate !== "" &&
          Number.isFinite(Number(candidate)) &&
          Number(candidate) > 0,
      ) ??
      candidates.find(
        (candidate) =>
          candidate !== null &&
          candidate !== undefined &&
          candidate !== "" &&
          Number.isFinite(Number(candidate)) &&
          Number(candidate) >= 0,
      );
    const seconds = Number(value ?? 0);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  }, [stats, profile, user, historyListeningSeconds]);

  const listeningHours = useMemo(
    () => (listeningSeconds / 3600).toFixed(listeningSeconds >= 36000 ? 0 : 1),
    [listeningSeconds],
  );

const followedCount = followedArtists.length;

  const status = String(
    application?.status || user?.artistApplication?.status || "none",
  ).toLowerCase();
  const canApply =
    !["pending", "approved"].includes(status) &&
    user?.role !== "artist" &&
    user?.role !== "admin";

  const openArtistModal = () => {
    setApplicationError("");
    setApplicationSuccess("");
    setArtistForm({
      artistName: application?.artistName || user?.name || "",
      genre: application?.genre || "",
      bio: application?.bio || application?.description || "",
      portfolioUrl:
        application?.portfolioUrl || application?.social_profile_url || "",
      artistImage: null,
      verificationSong: null,
      verificationSongTitle: "",
      verificationSongDuration: "",
    });
    setShowArtistModal(true);
  };

  const submitArtist = async (event) => {
    event.preventDefault();
    setApplicationError("");
    setApplicationSuccess("");
    if (
      !artistForm.artistName.trim() ||
      !artistForm.genre.trim() ||
      artistForm.bio.trim().length < 20
    ) {
      setApplicationError(
        "Enter an artist name and genre, and provide a bio of at least 20 characters.",
      );
      return;
    }
    if (
      !(artistForm.artistImage instanceof File) ||
      !(artistForm.verificationSong instanceof File)
    ) {
      setApplicationError(
        "Upload an artist image and a verification audio file.",
      );
      return;
    }
    const formData = new FormData();
    formData.append("artistName", artistForm.artistName.trim());
    formData.append("genre", artistForm.genre.trim());
    formData.append("bio", artistForm.bio.trim());
    formData.append("portfolioUrl", artistForm.portfolioUrl.trim());
    formData.append("image", artistForm.artistImage);
    formData.append("verificationSong", artistForm.verificationSong);
    if (artistForm.verificationSongTitle.trim())
      formData.append(
        "verificationSongTitle",
        artistForm.verificationSongTitle.trim(),
      );
    if (artistForm.verificationSongDuration)
      formData.append(
        "verificationSongDuration",
        artistForm.verificationSongDuration,
      );
    setSubmitting(true);
    try {
      const response = await submitArtistApplication(formData);
      const payload = unwrap(response);
      setApplication(
        payload?.application ||
          payload?.data?.application ||
          payload?.data ||
          null,
      );
      setApplicationSuccess(
        payload?.message || "Your artist application has been submitted.",
      );
      setTimeout(() => setShowArtistModal(false), 1000);
    } catch (error) {
      setApplicationError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to submit your application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openEditProfile = () => navigate("/profile/edit");

  if (loading) {
    return (
      <main className="user-profile-page mt-25 min-h-screen bg-[var(--theme-background)] px-3 pb-10 text-[var(--theme-text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`${raised} h-32 animate-pulse rounded-3xl`}
            />
          ))}
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="user-profile-page mt-25 flex min-h-[60vh] items-center justify-center bg-[var(--theme-background)] px-4 text-[var(--theme-text)]">
        <div
          className={`${raised} w-full max-w-md rounded-3xl p-7 text-center`}
        >
          <AlertCircle className="mx-auto text-red-400" size={30} />
          <h1 className="mt-4 text-xl font-black">Could not load profile</h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">{loadError}</p>
          <button
            onClick={refresh}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--theme-surface)] px-4 font-bold text-white"
          >
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="user-profile-page mt-25 min-h-screen overflow-x-clip bg-[var(--theme-background)] px-3 pb-12 text-[var(--theme-text)] sm:px-5 md:px-7 lg:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[9px] font-black uppercase tracking-[.28em] text-[var(--theme-secondary)] sm:text-[10px]">
              LYRICS WAYYY / YOUR SPACE
            </p>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">
              My Profile
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className={`${raisedSmall} inline-flex h-11 w-11 items-center justify-center rounded-2xl transition hover:text-(--theme-primary) disabled:opacity-60`}
              aria-label="Refresh profile"
            >
              <RefreshCw
                className={refreshing ? "animate-spin" : ""}
                size={17}
              />
            </button>
            {/* <ThemeSwitcher /> */}
          </div>
        </header>

        {/* 1. Profile identity */}
        <Panel className="relative  overflow-hidden p-4 sm:p-6 lg:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-(--theme-surface) blur-3xl"
          />
          <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className={`${inset} flex h-24 w-24 shrink-0 items-center justify-center self-center overflow-hidden rounded-4xl text-2xl font-black text-(--theme-primary) sm:h-28 sm:w-28 sm:self-auto`}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user?.name || "Profile"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                initials(user?.name || user?.username)
              )}
              {!profileImage && (
                <span>{initials(user?.name || user?.username)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="max-w-full break-words text-2xl font-black tracking-tight sm:text-3xl">
                  {user?.name || user?.username || "Music Lover"}
                </h2>
                {user?.role === "artist" && (
                  <BadgeCheck
                    size={20}
                    className="text-[var(--theme-secondary)]"
                  />
                )}
              </div>
              <p className="mt-2 flex min-w-0 items-center justify-center gap-2 break-all text-xs text-[var(--theme-muted)] sm:justify-start sm:text-sm">
                <Mail size={15} className="shrink-0" />
                {user?.email || "No email available"}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className={`${inset} rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-secondary)]`}
                >
                  {user?.role || "user"}
                </span>
                {user?.createdAt && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--theme-muted)]">
                    <CalendarDays size={13} /> Member since{" "}
                    {formatDate(user.createdAt)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={openEditProfile}
              className={`${raisedSmall} inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition hover:text-(--theme-primary) sm:self-center`}
            >
              <Pencil size={16} /> Edit profile
            </button>
          </div>
        </Panel>

        {/* 2. Overview: exactly three equal cards */}
        <section>
          <SectionTitle
            eyebrow="Your overview"
            title="Your listening, at a glance"
            description="A live snapshot of the music you enjoy."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Panel className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`${inset} flex h-11 w-11 items-center justify-center rounded-2xl text-(--theme-primary)`}
                >
                  <Play size={19} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-(--theme-muted)">
                  Activity
                </span>
              </div>
              <p className="mt-4 text-3xl font-black">
                {totalPlayed.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--theme-muted)]">
                Recent / total plays
              </p>
            </Panel>
            <Panel className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`${inset} flex h-11 w-11 items-center justify-center rounded-2xl text-rose-400`}
                >
                  <Heart size={19} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--theme-muted)]">
                  Saved
                </span>
              </div>
              <p className="mt-4 text-3xl font-black">
                {totalFavorites.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--theme-muted)]">
                Total favorites
              </p>
            </Panel>
            <Panel className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`${inset} flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--theme-secondary)]`}
                >
                  <Headphones size={19} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--theme-muted)]">
                  Listening
                </span>
              </div>
              <p className="mt-4 text-3xl font-black">
                {listeningHours}
                <span className="ml-1 text-base font-bold text-[var(--theme-muted)]">
                  h
                </span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--theme-muted)]">
                Total listening time
              </p>
            </Panel>
          </div>
        </section>

        {/* 3. Listening history, five per page */}
        <section>
          <SectionTitle
            eyebrow="Your timeline"
            title="Listening history"
            description="Your latest listening sessions, five tracks at a time."
            action={
              <button
                onClick={() => navigate("/history")}
                className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl px-3 text-xs font-bold text-(--theme-primary) transition hover:bg-(--theme-surface) sm:self-auto"
              >
                View all <ArrowRight size={15} />
              </button>
            }
          />
          <Panel className="overflow-hidden">
            {historyLoading ? (
              <div className="space-y-3 p-4 sm:p-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-[62px] animate-pulse rounded-2xl bg-[var(--theme-surface)]"
                  />
                ))}
              </div>
            ) : historyError ? (
              <EmptyState
                icon={AlertCircle}
                title="History unavailable"
                text={historyError}
                action={
                  <button
                    onClick={() => loadHistory(historyPage)}
                    className="mt-4 text-xs font-bold text-[var(--theme-primary)]"
                  >
                    Retry
                  </button>
                }
              />
            ) : history.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="Your listening journey starts here"
                text="Play a track and your listening history will appear here."
                action={
                  <button
                    onClick={() => navigate("/collections")}
                    className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-(--theme-primary) px-4 text-xs font-bold text-white"
                  >
                    <Play size={14} /> Explore music
                  </button>
                }
              />
            ) : (
              <>
                <div className="divide-y divide-[var(--theme-border)]">
                  {history.slice(0, 5).map((item, index) => {
                    const song = item?.song?.title ? item.song : item;
                    return (
                      <motion.div
                        key={item?._id || `${getTitle(item)}-${index}`}
                        initial={false}
                        className="flex min-w-0 items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5"
                      >
                        <span className="hidden w-5 shrink-0 text-center text-[10px] font-bold text-[var(--theme-muted)] sm:block">
                          {String((historyPage - 1) * 5 + index + 1).padStart(
                            2,
                            "0",
                          )}
                        </span>
                        <Cover
                          src={getCover(song)}
                          title={getTitle(song)}
                          size="h-12 w-12 sm:h-14 sm:w-14"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {getTitle(song)}
                          </p>
                          <p className="mt-1 truncate text-xs text-[var(--theme-muted)]">
                            {getArtistName(song)}
                          </p>
                          <p className="mt-1 text-[10px] text-[var(--theme-muted)] sm:hidden">
                            {formatDate(item?.startedAt || item?.createdAt)}
                          </p>
                        </div>
                        <div className="hidden min-w-[90px] text-right sm:block">
                          <p className="text-[10px] text-[var(--theme-muted)]">
                            {formatDate(item?.startedAt || item?.createdAt)}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-[var(--theme-secondary)]">
                            {formatTime(item?.listenedSeconds ?? 0)} listened
                          </p>
                        </div>
                        <span
                          className={`${inset} hidden rounded-lg px-2 py-1 text-[10px] font-bold text-[var(--theme-muted)] md:block`}
                        >
                          {getDuration(song?.duration)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Play ${getTitle(song)}`}
                          onClick={() => navigate("/home")}
                          className={`${raisedSmall} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--theme-primary)]`}
                        >
                          <Play size={15} fill="currentColor" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-3 border-t border-[var(--theme-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] text-[var(--theme-muted)]">
                    Page {historyPage} of {historyPages} · {historyTotal}{" "}
                    listening sessions
                  </p>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      disabled={historyPage <= 1 || historyLoading}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className={`${raisedSmall} inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <span className="min-w-12 text-center text-xs font-bold">
                      {historyPage} / {historyPages}
                    </span>
                    <button
                      disabled={historyPage >= historyPages || historyLoading}
                      onClick={() =>
                        setHistoryPage((p) => Math.min(historyPages, p + 1))
                      }
                      className={`${raisedSmall} inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </Panel>
        </section>

        {/* 4. Three equally divided library actions */}
        <section>
          <SectionTitle
            eyebrow="Your library"
            title="Your music collection"
            description="Jump straight to the music and artists you keep close."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                title: "Playlists",
                count: playlists.length,
                label: "curated collections",
                icon: ListMusic,
                tone: "text-[var(--theme-primary)]",
                action: () => navigate("/playlists"),
              },
              {
                title: "Favorites",
                count: totalFavorites,
                label: "saved tracks",
                icon: Heart,
                tone: "text-rose-400",
                action: () => navigate("/favorites"),
              },
              {
                title: "Followed artists",
                count: followedCount,
                label: "artists you follow",
                icon: Mic2,
                tone: "text-[var(--theme-secondary)]",
                action: () => navigate("/following-artists"),
              },
            ].map(({ title, count, label, icon: Icon, tone, action }) => (
              <button
                key={title}
                onClick={action}
                className={`${inset} group flex min-h-34.5 min-w-0 items-center gap-4 rounded-[1.6rem] p-4 text-left transition duration-300 hover:-translate-y-1 sm:min-h-40 sm:flex-col sm:items-start sm:justify-between sm:p-5`}
              >
                <div
                  className={`${inset} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}
                >
                  <Icon size={21} />
                </div>
                <div className="min-w-0 flex-1 sm:w-full">
                  <p className="text-lg font-black sm:text-xl">
                    {count.toLocaleString()}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs text-(--theme-muted)">{label}</p>
                </div>
                <ArrowRight
                  size={17}
                  className="shrink-0 text-(--theme-muted) transition group-hover:translate-x-1 group-hover:text-(--theme-primary)"
                />
              </button>
            ))}
          </div>
        </section>

        {/* 5. Latest releases + artist application */}
        <section id="latest-from-followed" className="scroll-mt-28">
          <SectionTitle
            eyebrow="Discover more"
            title="Music from your world"
            description="Latest releases and your next step as an artist."
          />
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[1.05fr_.95fr]">
            <Panel className="min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-(--theme-border) px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`${inset} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-(--theme-secondary)`}
                  >
                    <Disc3 size={19} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black sm:text-base">
                      Latest from followed artists
                    </h3>
                    <p className="mt-1 text-[10px] text-(--theme-muted)">
                      New tracks from the artists you follow
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/collections")}
                  className="shrink-0 text-xs font-bold text-(--theme-primary)"
                >
                  Explore
                </button>
              </div>
              {latestReleases.length ? (
                <div className="space-y-1 p-2 sm:p-3">
                  {latestReleases.slice(0, 5).map((song, index) => (
                    <div
                      key={song?._id || `${getTitle(song)}-${index}`}
                      className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition hover:bg-(--theme-background) sm:p-3"
                    >
                      <Cover
                        src={getCover(song)}
                        title={getTitle(song)}
                        size="h-12 w-12 sm:h-14 sm:w-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {getTitle(song)}
                        </p>
                        <p className="mt-1 truncate text-xs text-(--theme-muted)">
                          {getArtistName(song)}
                        </p>
                        <p className="mt-1 text-[10px] text-(--theme-muted)">
                          {song?.genre || "Latest release"}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/home")}
                        className={`${raisedSmall} flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-(--theme-primary)`}
                        aria-label={`Open ${getTitle(song)}`}
                      >
                        <Play size={15} fill="currentColor" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Music2}
                  title="Your next discovery is waiting"
                  text={
                    followingError ||
                    (followedArtists.length
                      ? "No releases were found for your followed artists yet."
                      : "Follow artists to see their newest music collected here.")
                  }
                  action={
                    <button
                      onClick={() => navigate("/home")}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-bold text-black/40"
                    >
                      Discover artists <ArrowRight size={14} />
                    </button>
                  }
                />
              )}
            </Panel>

            <Panel className="relative flex min-w-0 flex-col overflow-hidden p-5 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--theme-surface)]/10 blur-3xl"
              />
              <div className="relative flex flex-1 flex-col">
                <div
                  className={`${inset} flex h-14 w-14 items-center justify-center rounded-2xl text-[var(--theme-secondary)]`}
                >
                  <Mic2 size={25} />
                </div>
                {user?.role === "artist" || status === "approved" ? (
                  <>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-[var(--theme-secondary)]">
                      Artist space
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      Your artist journey is live.
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[var(--theme-muted)]">
                      Manage your artist presence, upload releases, and keep
                      building your audience.
                    </p>
                    <button
                      onClick={() => navigate("/artist/dashboard")}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-5 text-sm font-black text-white transition hover:brightness-110 sm:w-auto"
                    >
                      <Mic2 size={17} /> Open artist dashboard{" "}
                      <ArrowRight size={16} />
                    </button>
                  </>
                ) : status === "pending" ? (
                  <>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-amber-400">
                      Application status
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      Your application is under review.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">
                      The team will review your artist details and verification
                      track. You can return here for status updates.
                    </p>
                    <span
                      className={`${inset} mt-5 inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-400`}
                    >
                      <Clock3 size={15} /> Pending review
                    </span>
                  </>
                ) : status === "rejected" ? (
                  <>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-rose-400">
                      Application update
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      Let's get your next application ready.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">
                      {application?.rejectionReason ||
                        "Review your artist information and submit an updated application."}
                    </p>
                    <button
                      onClick={openArtistModal}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-5 text-sm font-black text-white sm:w-auto"
                    >
                      <Send size={16} /> Apply again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-[var(--theme-secondary)]">
                      For independent creators
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      Your music deserves a stage.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--theme-muted)]">
                      Apply to become an artist on LYRICS WAYYY. Prepare a clear
                      artist name, genre, artist bio, profile image, and an
                      original verification track.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        "Artist name & genre",
                        "Bio (20–2,000 characters)",
                        "Artist image",
                        "Verification audio track",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-2 text-xs text-[var(--theme-muted)]"
                        >
                          <Check
                            size={14}
                            className="mt-0.5 shrink-0 text-[var(--theme-secondary)]"
                          />
                          {item}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={openArtistModal}
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-5 text-sm font-black text-black/40 transition hover:brightness-110 sm:w-auto"
                    >
                      <Mic2 size={17} /> Become an artist{" "}
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </Panel>
          </div>
        </section>
      </div>

      {/* Artist application modal */}
      <AnimatePresence>
        {showArtistModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submitting)
                setShowArtistModal(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="artist-application-title"
              className={`${raised} max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] p-4 sm:rounded-[2rem] sm:p-7`}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-[var(--theme-secondary)]">
                    Artist application
                  </p>
                  <h2
                    id="artist-application-title"
                    className="mt-2 text-xl font-black sm:text-2xl"
                  >
                    Bring your sound to LYRICS WAYYY
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-[var(--theme-muted)]">
                    Complete the details and upload the required verification
                    files.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowArtistModal(false)}
                  className={`${raisedSmall} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-50`}
                  aria-label="Close application"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitArtist} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold">
                    Artist name <span className="text-rose-400">*</span>
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={artistForm.artistName}
                      onChange={(e) =>
                        setArtistForm((f) => ({
                          ...f,
                          artistName: e.target.value,
                        }))
                      }
                      className={`${inset} mt-2 min-h-12 w-full rounded-xl px-4 text-sm outline-none focus:border-[var(--theme-primary)]`}
                      placeholder="Your stage name"
                    />
                  </label>
                  <label className="block text-xs font-bold">
                    Genre <span className="text-rose-400">*</span>
                    <input
                      required
                      maxLength={80}
                      value={artistForm.genre}
                      onChange={(e) =>
                        setArtistForm((f) => ({ ...f, genre: e.target.value }))
                      }
                      className={`${inset} mt-2 min-h-12 w-full rounded-xl px-4 text-sm outline-none focus:border-[var(--theme-primary)]`}
                      placeholder="Pop, hip-hop, indie…"
                    />
                  </label>
                </div>
                <label className="block text-xs font-bold">
                  Artist bio <span className="text-rose-400">*</span>
                  <textarea
                    required
                    minLength={20}
                    maxLength={2000}
                    rows={4}
                    value={artistForm.bio}
                    onChange={(e) =>
                      setArtistForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    className={`${inset} mt-2 w-full resize-y rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--theme-primary)]`}
                    placeholder="Tell us about your sound and journey…"
                  />
                  <span className="mt-1 block text-right text-[10px] font-medium text-[var(--theme-muted)]">
                    {artistForm.bio.length}/2000
                  </span>
                </label>
                <label className="block text-xs font-bold">
                  Portfolio / social profile URL
                  <input
                    type="url"
                    value={artistForm.portfolioUrl}
                    onChange={(e) =>
                      setArtistForm((f) => ({
                        ...f,
                        portfolioUrl: e.target.value,
                      }))
                    }
                    className={`${inset} mt-2 min-h-12 w-full rounded-xl px-4 text-sm outline-none focus:border-[var(--theme-primary)]`}
                    placeholder="https://…"
                  />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label
                    className={`${inset} block rounded-2xl p-4 text-xs font-bold`}
                  >
                    Artist image <span className="text-rose-400">*</span>
                    <span className="mt-2 flex items-center gap-2 text-[var(--theme-muted)]">
                      <ImagePlus size={17} /> JPG, PNG, or WebP
                    </span>
                    <input
                      required
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setArtistForm((f) => ({
                          ...f,
                          artistImage: e.target.files?.[0] || null,
                        }))
                      }
                      className="mt-3 block w-full text-xs text-[var(--theme-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--theme-surface)] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[var(--theme-text)]"
                    />
                    {artistForm.artistImage && (
                      <span className="mt-2 block truncate text-[var(--theme-secondary)]">
                        {artistForm.artistImage.name}
                      </span>
                    )}
                  </label>
                  <label
                    className={`${inset} block rounded-2xl p-4 text-xs font-bold`}
                  >
                    Verification audio <span className="text-rose-400">*</span>
                    <span className="mt-2 flex items-center gap-2 text-[var(--theme-muted)]">
                      <Music2 size={17} /> Your original track
                    </span>
                    <input
                      required
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.ogg"
                      onChange={(e) =>
                        setArtistForm((f) => ({
                          ...f,
                          verificationSong: e.target.files?.[0] || null,
                        }))
                      }
                      className="mt-3 block w-full text-xs text-[var(--theme-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--theme-surface)] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[var(--theme-text)]"
                    />
                    {artistForm.verificationSong && (
                      <span className="mt-2 block truncate text-[var(--theme-secondary)]">
                        {artistForm.verificationSong.name}
                      </span>
                    )}
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold">
                    Track title (optional)
                    <input
                      value={artistForm.verificationSongTitle}
                      onChange={(e) =>
                        setArtistForm((f) => ({
                          ...f,
                          verificationSongTitle: e.target.value,
                        }))
                      }
                      className={`${inset} mt-2 min-h-11 w-full rounded-xl px-4 text-sm outline-none`}
                      placeholder="Verification track title"
                    />
                  </label>
                  <label className="block text-xs font-bold">
                    Track duration in seconds (optional)
                    <input
                      type="number"
                      min="0"
                      value={artistForm.verificationSongDuration}
                      onChange={(e) =>
                        setArtistForm((f) => ({
                          ...f,
                          verificationSongDuration: e.target.value,
                        }))
                      }
                      className={`${inset} mt-2 min-h-11 w-full rounded-xl px-4 text-sm outline-none`}
                      placeholder="e.g. 184"
                    />
                  </label>
                </div>
                {applicationError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300"
                  >
                    {applicationError}
                  </p>
                )}
                {applicationSuccess && (
                  <p
                    role="status"
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300"
                  >
                    {applicationSuccess}
                  </p>
                )}
                <div className="flex flex-col-reverse gap-3 border-t border-[var(--theme-border)] pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowArtistModal(false)}
                    className={`${raisedSmall} min-h-12 rounded-xl px-5 text-sm font-bold disabled:opacity-50`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-(--theme-surface) px-6 text-sm font-black text-white disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />{" "}
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
