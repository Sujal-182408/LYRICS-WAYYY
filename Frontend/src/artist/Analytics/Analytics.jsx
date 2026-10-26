
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  Album,
  BarChart3,
  CalendarDays,
  Disc3,
  Folder,
  Loader2,
  Music2,
  RefreshCw,
  TrendingUp,
  Users,
  Verified,
  AlertCircle,
} from "lucide-react";
import { BASE_URL } from "../../config/api";

// =====================================================
// API / THEME CONFIGURATION
// =====================================================

const API_BASE = String(BASE_URL || "").replace(/\/+$/, "");
const DEFAULT_COVER = "/image/default-cover.jpg";

const themeColor = {
  primary: "var(--theme-primary, #8c7cf7)",
  secondary: "var(--theme-secondary, #2bd4c4)",
  background: "var(--theme-background, #252933)",
  surface: "var(--theme-surface, #252933)",
  text: "var(--theme-text, #f3f4f6)",
  muted: "var(--theme-textMuted, #9ca3af)",
  border: "var(--theme-border, rgba(255,255,255,0.06))",
  shadowDark: "var(--theme-shadowDark, #0f141a)",
  shadowLight: "var(--theme-shadowLight, #2a3543)",
};

const neuShadow = {
  background: themeColor.surface,
  border: `1px solid ${themeColor.border}`,
  boxShadow: `8px 8px 16px ${themeColor.shadowDark}, -8px -8px 16px ${themeColor.shadowLight}`,
};

const neuShadowSmall = {
  background: themeColor.surface,
  border: `1px solid ${themeColor.border}`,
  boxShadow: `4px 4px 9px ${themeColor.shadowDark}, -4px -4px 9px ${themeColor.shadowLight}`,
};

const insetShadow = {
  background: themeColor.surface,
  border: `1px solid ${themeColor.border}`,
  boxShadow: `inset 4px 4px 8px ${themeColor.shadowDark}, inset -4px -4px 8px ${themeColor.shadowLight}`,
};

const primaryGradient =
  "var(--theme-gradient, linear-gradient(135deg, var(--theme-primary, #8c7cf7), var(--theme-secondary, #2bd4c4)))";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getImageUrl = (path) => {
  if (!path || typeof path !== "string") return "";

  const value = path.trim();

  if (!value) return "";

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  return `${API_BASE}/${value.replace(/^\/+/, "")}`;
};

const formatDuration = (seconds) => {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${minutes}m ${remainingSeconds}s`;
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-IN");
};

const getSongDuration = (duration) => {
  if (duration === null || duration === undefined || duration === "") {
    return "";
  }

  if (typeof duration === "number" || !Number.isNaN(Number(duration))) {
    return formatDuration(duration);
  }

  return String(duration);
};

// =====================================================
// ANALYTICS PAGE
// =====================================================

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_BASE}/api/songs/stats/analytics`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to load analytics."
        );
      }

      const data = response.data;
      const songs = Array.isArray(data.songs) ? data.songs : [];
      const summary = data.summary || {};

      // Genre distribution
      const genreCounts = songs.reduce((result, song) => {
        const genre = song.genre?.trim() || "Unknown";
        result[genre] = (result[genre] || 0) + 1;
        return result;
      }, {});

      const genreDistribution = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Upload activity, grouped by calendar month
      const monthlyCounts = songs.reduce((result, song) => {
        if (!song.createdAt) return result;

        const date = new Date(song.createdAt);

        if (Number.isNaN(date.getTime())) return result;

        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (!result[key]) {
          result[key] = {
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
            month: date.toLocaleDateString("en-IN", {
              month: "short",
            }),
            count: 0,
            timestamp: new Date(
              date.getFullYear(),
              date.getMonth(),
              1
            ).getTime(),
          };
        }

        result[key].count += 1;

        return result;
      }, {});

      const uploadActivity = Object.values(monthlyCounts)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-12);

      const sortedSongs = [...songs].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      const topGenre = genreDistribution.find(
        (genre) => genre.name !== "Unknown"
      );

      setAnalytics({
        artist: data.artist || {},
        overview: {
          totalSongs: summary.totalSongs ?? songs.length,
          totalAlbums: summary.totalAlbums ?? 0,
          totalCollections: summary.totalCollections ?? 0,
          followers:
            summary.totalFollowers ??
            data.artist?.followers ??
            0,
          totalGenres: new Set(
            songs
              .map((song) => song.genre?.trim())
              .filter(Boolean)
          ).size,
          totalUploads: summary.totalSongs ?? songs.length,
          totalDuration: formatDuration(
            summary.totalListeningDuration ?? 0
          ),
          totalListeningEvents:
            summary.totalListeningEvents ?? 0,
        },
        genreDistribution,
        uploadActivity,
        recentUploads: sortedSongs.slice(0, 6),
        mostUsedGenre: topGenre || null,
        albumAnalytics: Array.isArray(data.albums)
          ? data.albums
          : [],
        collectionAnalytics: Array.isArray(data.collections)
          ? data.collections
          : [],
      });
    } catch (err) {
      console.error("ANALYTICS ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Prevent a stale state update after unmount.
    // Axios requests may continue, but this page won't update
    // state after the component has been removed.
    return () => {};
  }, [fetchAnalytics]);

  const overview = analytics?.overview || {};
  const genres = analytics?.genreDistribution || [];
  const uploadActivity = analytics?.uploadActivity || [];
  const recentUploads = analytics?.recentUploads || [];
  const albums = analytics?.albumAnalytics || [];
  const collections = analytics?.collectionAnalytics || [];
  const artist = analytics?.artist || {};

  const maxGenreCount = useMemo(
    () =>
      Math.max(
        1,
        ...genres.map((item) => Number(item.count) || 0)
      ),
    [genres]
  );

  const maxUploadCount = useMemo(
    () =>
      Math.max(
        1,
        ...uploadActivity.map(
          (item) => Number(item.count) || 0
        )
      ),
    [uploadActivity]
  );

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div
        className="min-h-[70vh] flex items-center justify-center p-6"
        style={{
          background: themeColor.background,
          color: themeColor.text,
        }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={neuShadow}
          >
            <Loader2
              size={30}
              className="animate-spin"
              style={{ color: themeColor.primary }}
            />
          </div>

          <div className="text-center">
            <p className="font-semibold">Loading analytics</p>
            <p
              className="text-sm mt-1"
              style={{ color: themeColor.muted }}
            >
              Gathering your music performance data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error) {
    return (
      <div
        className="min-h-[70vh] flex items-center justify-center p-5"
        style={{
          background: themeColor.background,
          color: themeColor.text,
        }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-7 md:p-9 text-center"
          style={neuShadow}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={insetShadow}
          >
            <AlertCircle
              size={30}
              style={{ color: themeColor.primary }}
            />
          </div>

          <h2 className="text-xl font-bold mb-2">
            Analytics unavailable
          </h2>

          <p
            className="text-sm leading-6 mb-6 break-words"
            style={{ color: themeColor.muted }}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchAnalytics()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-transform active:scale-95"
            style={{
              background: primaryGradient,
              color: "#fff",
              boxShadow: `0 6px 18px color-mix(in srgb, ${themeColor.primary} 24%, transparent)`,
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div
      className="space-y-6 pb-10 min-w-0"
      style={{
        background: themeColor.background,
        color: themeColor.text,
      }}
    >
      {/* HEADER */}
      <section
        className="rounded-3xl p-5 md:p-6"
        style={neuShadow}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
              style={insetShadow}
            >
              {artist.image ? (
                <img
                  src={getImageUrl(artist.image)}
                  alt={artist.name || "Artist"}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <Music2
                  size={26}
                  style={{ color: themeColor.primary }}
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Analytics
                </h1>

                {artist.verified && (
                  <Verified
                    size={19}
                    fill={themeColor.primary}
                    style={{ color: themeColor.primary }}
                    aria-label="Verified artist"
                  />
                )}
              </div>

              <p
                className="text-sm mt-1"
                style={{ color: themeColor.muted }}
              >
                Performance overview for{" "}
                <span
                  className="font-semibold"
                  style={{ color: themeColor.text }}
                >
                  {artist.name || "your artist profile"}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-transform active:scale-95 disabled:opacity-50"
            style={insetShadow}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
              style={{ color: themeColor.secondary }}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {/* PRIMARY STATISTICS */}
      <section
        aria-label="Overview statistics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Music2}
          label="Songs"
          value={overview.totalSongs}
          accent={themeColor.primary}
        />

        <StatCard
          icon={Album}
          label="Albums"
          value={overview.totalAlbums}
          accent={themeColor.secondary}
        />

        <StatCard
          icon={Folder}
          label="Collections"
          value={overview.totalCollections}
          accent={themeColor.primary}
        />

        <StatCard
          icon={Users}
          label="Followers"
          value={overview.followers}
          accent={themeColor.secondary}
        />
      </section>

      {/* SECONDARY STATISTICS */}
      <section
        aria-label="Additional statistics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MiniStat
          icon={Disc3}
          label="Genres"
          value={overview.totalGenres}
        />

        <MiniStat
          icon={TrendingUp}
          label="Uploads"
          value={overview.totalUploads}
        />

        <MiniStat
          icon={Activity}
          label="Listening duration"
          value={overview.totalDuration || "0m 0s"}
        />

        <MiniStat
          icon={BarChart3}
          label="Top genre"
          value={analytics?.mostUsedGenre?.name || "—"}
        />
      </section>

      {/* UPLOAD ACTIVITY + GENRE DISTRIBUTION */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* UPLOAD ACTIVITY */}
        <Panel
          title="Upload Activity"
          subtitle="Songs uploaded by month"
          icon={TrendingUp}
          accent={themeColor.secondary}
        >
          {uploadActivity.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              text="No upload activity yet"
            />
          ) : (
            <div className="space-y-4">
              {uploadActivity.map((item) => {
                const percentage = Math.min(
                  100,
                  ((Number(item.count) || 0) /
                    maxUploadCount) *
                    100
                );

                return (
                  <div
                    key={`${item.year}-${item.monthIndex}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span
                        className="text-sm"
                        style={{ color: themeColor.text }}
                      >
                        {item.month} {item.year}
                      </span>

                      <span
                        className="text-xs font-bold"
                        style={{ color: themeColor.secondary }}
                      >
                        {item.count}
                      </span>
                    </div>

                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={insetShadow}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${themeColor.secondary}, ${themeColor.primary})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* GENRE DISTRIBUTION */}
        <Panel
          title="Genre Distribution"
          subtitle="Based on uploaded songs"
          icon={Disc3}
          accent={themeColor.primary}
        >
          {genres.length === 0 ? (
            <EmptyState
              icon={Disc3}
              text="No genres available"
            />
          ) : (
            <div className="space-y-5">
              {genres.map((genre) => {
                const percentage = Math.min(
                  100,
                  ((Number(genre.count) || 0) /
                    maxGenreCount) *
                    100
                );

                return (
                  <div key={genre.name}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span
                        className="text-sm truncate"
                        style={{ color: themeColor.text }}
                      >
                        {genre.name}
                      </span>

                      <span
                        className="text-xs shrink-0"
                        style={{ color: themeColor.muted }}
                      >
                        {genre.count}{" "}
                        {genre.count === 1 ? "song" : "songs"}
                      </span>
                    </div>

                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={insetShadow}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${themeColor.primary}, ${themeColor.secondary})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>

      {/* ALBUMS + COLLECTIONS */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ALBUMS */}
        <Panel
          title="Albums"
          subtitle="Your uploaded albums"
          icon={Album}
          accent={themeColor.secondary}
        >
          {albums.length === 0 ? (
            <EmptyState
              icon={Album}
              text="No album analytics available"
            />
          ) : (
            <div className="space-y-3">
              {albums.map((album, index) => (
                <MediaRow
                  key={album._id || album.id || index}
                  image={album.coverImage}
                  title={album.title || album.name || "Untitled album"}
                  subtitle={`${Number(album.songCount) || 0} ${
                    Number(album.songCount) === 1 ? "song" : "songs"
                  }`}
                  date={album.createdAt}
                  icon={Album}
                  accent={themeColor.secondary}
                />
              ))}
            </div>
          )}
        </Panel>

        {/* COLLECTIONS */}
        <Panel
          title="Collections"
          subtitle="Your created collections"
          icon={Folder}
          accent={themeColor.primary}
        >
          {collections.length === 0 ? (
            <EmptyState
              icon={Folder}
              text="No collection analytics available"
            />
          ) : (
            <div className="space-y-3">
              {collections.map((collection, index) => (
                <div
                  key={collection._id || collection.id || index}
                  className="flex items-center gap-3 p-3 rounded-2xl min-w-0"
                  style={insetShadow}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={neuShadowSmall}
                  >
                    <Folder
                      size={18}
                      style={{ color: themeColor.primary }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {collection.name || "Untitled collection"}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{ color: themeColor.muted }}
                    >
                      {Number(collection.songCount) || 0}{" "}
                      {Number(collection.songCount) === 1
                        ? "song"
                        : "songs"}
                      {" · "}
                      {collection.visible ? "Visible" : "Hidden"}
                    </p>
                  </div>

                  <span
                    className="text-[11px] shrink-0"
                    style={{ color: themeColor.muted }}
                  >
                    {formatDate(collection.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* RECENT UPLOADS */}
      <Panel
        title="Recent Uploads"
        subtitle="Your latest songs"
        icon={Music2}
        accent={themeColor.primary}
      >
        {recentUploads.length === 0 ? (
          <EmptyState
            icon={Music2}
            text="No songs uploaded yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {recentUploads.map((song, index) => (
              <MediaRow
                key={song._id || song.id || index}
                image={song.coverImage}
                title={song.title || "Untitled song"}
                subtitle={song.genre || "Unknown genre"}
                date={song.createdAt}
                duration={getSongDuration(song.duration)}
                icon={Music2}
                accent={themeColor.primary}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* LISTENING EVENTS */}
      <section
        className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={neuShadowSmall}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={insetShadow}
          >
            <Activity
              size={18}
              style={{ color: themeColor.secondary }}
            />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Listening events
            </p>

            <p
              className="text-xs mt-1"
              style={{ color: themeColor.muted }}
            >
              Total listening activity recorded by the API
            </p>
          </div>
        </div>

        <p
          className="text-xl font-bold sm:text-right"
          style={{ color: themeColor.secondary }}
        >
          {formatNumber(overview.totalListeningEvents)}
        </p>
      </section>
    </div>
  );
};

// =====================================================
// REUSABLE PANEL
// =====================================================

const Panel = ({ title, subtitle, icon: Icon, accent, children }) => (
  <section
    className="rounded-3xl p-5 md:p-6 min-w-0"
    style={neuShadow}
  >
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h2 className="text-lg font-bold">{title}</h2>

        <p
          className="text-xs mt-1"
          style={{ color: themeColor.muted }}
        >
          {subtitle}
        </p>
      </div>

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={insetShadow}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
    </div>

    {children}
  </section>
);

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div
    className="rounded-3xl p-4 sm:p-5 min-w-0 transition-transform duration-200 hover:-translate-y-0.5"
    style={neuShadow}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p
          className="text-xs"
          style={{ color: themeColor.muted }}
        >
          {label}
        </p>

        <p className="text-2xl md:text-3xl font-bold mt-2 break-words">
          {formatNumber(value)}
        </p>
      </div>

      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
        style={insetShadow}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
    </div>
  </div>
);

// =====================================================
// MINI STAT
// =====================================================

const MiniStat = ({ icon: Icon, label, value }) => (
  <div
    className="rounded-2xl p-4 min-w-0"
    style={neuShadowSmall}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={insetShadow}
      >
        <Icon
          size={16}
          style={{ color: themeColor.primary }}
        />
      </div>

      <div className="min-w-0">
        <p
          className="text-[11px]"
          style={{ color: themeColor.muted }}
        >
          {label}
        </p>

        <p className="text-sm font-bold truncate mt-1">
          {typeof value === "number"
            ? formatNumber(value)
            : value ?? "—"}
        </p>
      </div>
    </div>
  </div>
);

// =====================================================
// MEDIA ROW
// =====================================================

const MediaRow = ({
  image,
  title,
  subtitle,
  date,
  duration,
  icon: Icon,
  accent,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = getImageUrl(image);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl min-w-0"
      style={insetShadow}
    >
      <div
        className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={neuShadowSmall}
      >
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon
            size={19}
            style={{ color: accent }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">
          {title}
        </p>

        <p
          className="text-xs truncate mt-1"
          style={{ color: themeColor.muted }}
        >
          {subtitle}
          {duration ? ` · ${duration}` : ""}
        </p>

        <p
          className="text-[11px] mt-1"
          style={{ color: themeColor.muted }}
        >
          {formatDate(date)}
        </p>
      </div>
    </div>
  );
};

// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({ icon: Icon, text }) => (
  <div
    className="min-h-36 rounded-2xl flex flex-col items-center justify-center text-center px-4 py-6"
    style={insetShadow}
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
      style={neuShadowSmall}
    >
      <Icon
        size={23}
        style={{ color: themeColor.primary }}
      />
    </div>

    <p
      className="text-xs"
      style={{ color: themeColor.muted }}
    >
      {text}
    </p>
  </div>
);

export default Analytics;
