import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import {
  Search,
  Music2,
  UserRound,
  Users,
  BadgeCheck,
  UserMinus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Disc3,
  ArrowRight,
  X,
} from "lucide-react";

import { BASE_URL } from "../config/api";

// =====================================================
// HELPERS
// =====================================================

const API_URL = String(BASE_URL || "").replace(/\/+$/, "");

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  "";

const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  const value = image.trim();

  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const cleanPath = value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  const uploadsIndex = cleanPath.toLowerCase().indexOf("uploads/");

  const normalizedPath =
    uploadsIndex >= 0
      ? cleanPath.substring(uploadsIndex)
      : cleanPath;

  return API_URL
    ? `${API_URL}/${normalizedPath}`
    : "";
};

const getArtistId = (artist) => {
  if (!artist) {
    return "";
  }

  const id =
    artist._id ||
    artist.artistId ||
    artist.artist?._id;

  return id ? String(id) : "";
};

const getArtistName = (artist) =>
  artist?.name ||
  artist?.artistName ||
  artist?.artist?.name ||
  "Unknown Artist";

const getArtistImage = (artist) =>
  artist?.image ||
  artist?.profileImage ||
  artist?.avatar ||
  artist?.artist?.image ||
  "";

const getArtistFollowers = (artist) => {
  const value = Number(
    artist?.followers ??
    artist?.followersCount ??
    artist?.totalFollowers ??
    0
  );

  return Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
};

const formatFollowers = (count) => {
  return new Intl.NumberFormat("en", {
    notation: count >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
};

const extractArtists = (response) => {
  const data = response?.data;

  const candidates = [
    data?.artists,
    data?.followedArtists,
    data?.follows,
    data?.data?.artists,
    data?.data?.followedArtists,
    data?.data?.follows,
    data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (item?.artist && typeof item.artist === "object") {
            return {
              ...item.artist,
              _id: item.artist._id || item.artistId,
            };
          }

          return item;
        })
        .filter((item) => getArtistId(item));
    }
  }

  return [];
};

// =====================================================
// IMAGE COMPONENT
// =====================================================

const ArtistAvatar = ({
  artist,
  className = "",
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const image = getImageUrl(getArtistImage(artist));

  const name = getArtistName(artist);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <div
      className={`
        
        relative flex shrink-0 items-center justify-center
        overflow-hidden rounded-full
        border border-(--theme-border)
        bg-(--theme-background)
        shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]
        ${className}
      `}
    >
      {image && !imageFailed ? (
        <img
          src={image}
          alt={`${name} profile`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound
          size={30}
          className="text-[var(--theme-primary)]"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// =====================================================
// ARTIST CARD
// =====================================================

const ArtistCard = ({
  artist,
  onOpen,
  onUnfollow,
  unfollowing,
}) => {
  const artistId = getArtistId(artist);

  const name = getArtistName(artist);

  const followers = getArtistFollowers(artist);

  const verified =
    artist?.verified === true ||
    artist?.isVerified === true;

  return (
    <article
      className="
        group relative min-w-0 overflow-hidden
        rounded-3xl
        border border-[var(--theme-border)]
        bg-[var(--theme-surface)]
        p-5 sm:p-6
        shadow-[8px_8px_16px_var(--theme-shadow-dark),-8px_-8px_16px_var(--theme-shadow-light)]
        transition-all duration-300
        hover:-translate-y-1
        hover:border-[var(--theme-primary)]
      "
    >
      {/* Decorative accent */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -right-10 -top-10
          h-32 w-32 rounded-full
          bg-[var(--theme-primary)]
          opacity-[0.07] blur-3xl
          transition-opacity duration-300
          group-hover:opacity-20
        "
      />

      <div className="relative flex flex-col items-center text-center ">
        {/* Avatar is clickable */}

        <button
          type="button"
          onClick={() => onOpen(artistId)}
          aria-label={`Open ${name}'s artist profile`}
          className="
            mb-4 rounded-full
            outline-none
            transition-transform duration-300
            hover:scale-105
            focus-visible:ring-2
            focus-visible:ring-[var(--theme-primary)]
            focus-visible:ring-offset-4
            focus-visible:ring-offset-[var(--theme-surface)]
          "
        >
          <ArtistAvatar
            artist={artist}
            className="h-24 w-24 sm:h-28 sm:w-28"
          />
        </button>

        {/* Name */}

        <button
          type="button"
          onClick={() => onOpen(artistId)}
          className="
            inline-flex max-w-full items-center justify-center gap-2
            rounded-lg text-center
            text-lg font-extrabold
            text-[var(--theme-text)]
            transition-colors
            hover:text-[var(--theme-primary)]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--theme-primary)]
          "
        >
          <span className="truncate">
            {name}
          </span>

          {verified && (
            <BadgeCheck
              size={18}
              className="shrink-0 text-[var(--theme-secondary)]"
              aria-label="Verified artist"
            />
          )}
        </button>

        {/* Biography */}

        <p className="
          mt-2 min-h-10 max-w-full
          line-clamp-2
          text-sm leading-5
          text-[var(--theme-textMuted)]
        ">
          {artist?.bio ||
            artist?.about ||
            artist?.description ||
            "Discover this artist's music and latest releases."}
        </p>

        {/* Followers */}

        <div className="
          mt-4 inline-flex items-center gap-2
          rounded-full
          border border-[var(--theme-border)]
          bg-[var(--theme-background)]
          px-4 py-2
          text-sm font-semibold
          text-[var(--theme-textMuted)]
          shadow-[inset_3px_3px_6px_var(--theme-shadow-dark),inset_-3px_-3px_6px_var(--theme-shadow-light)]
        ">
          <Users
            size={15}
            className="text-[var(--theme-secondary)]"
          />

          <span>
            {formatFollowers(followers)} followers
          </span>
        </div>

        {/* Actions */}

        <div className="
          mt-6 grid w-full
          grid-cols-1 gap-3
          sm:grid-cols-2
        ">
          <button
            type="button"
            onClick={() => onOpen(artistId)}
            className="
              inline-flex min-h-11 items-center
              justify-center gap-2
              rounded-xl
              bg-[var(--theme-primary)]
              px-4 py-3
              text-sm font-bold text-white
              transition-all duration-200
              hover:brightness-110
              active:scale-95
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--theme-primary)]
            "
          >
            <UserRound size={16} />

            View Artist

            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            disabled={unfollowing}
            onClick={() => onUnfollow(artist)}
            className="
              inline-flex min-h-11 items-center
              justify-center gap-2
              rounded-xl
              border border-[var(--theme-border)]
              bg-[var(--theme-surface)]
              px-4 py-3
              text-sm font-semibold
              text-[var(--theme-textMuted)]
              shadow-[4px_4px_8px_var(--theme-shadow-dark),-4px_-4px_8px_var(--theme-shadow-light)]
              transition-all duration-200
              hover:text-red-400
              hover:border-red-400/40
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {unfollowing ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <UserMinus size={16} />
            )}

            {unfollowing ? "Removing..." : "Unfollow"}
          </button>
        </div>
      </div>
    </article>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const FollowingArtists = () => {
  const navigate = useNavigate();

  const [artists, setArtists] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [unfollowingId, setUnfollowingId] = useState("");

  const [notice, setNotice] = useState("");

  // ===================================================
  // FETCH FOLLOWED ARTISTS
  // ===================================================

  const fetchArtists = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setArtists([]);
      setError("Please sign in to view your followed artists.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/profile/followed-artists`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.success === false) {
        throw new Error(
          response.data.message ||
          "Unable to load followed artists."
        );
      }

      setArtists(extractArtists(response));
    } catch (err) {
      console.error(
        "Fetch followed artists error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load followed artists. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchArtists();
  }, [fetchArtists]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredArtists = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return artists;
    }

    return artists.filter((artist) => {
      const name = getArtistName(artist).toLowerCase();

      const bio = String(
        artist?.bio ||
        artist?.about ||
        artist?.description ||
        ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        bio.includes(query)
      );
    });
  }, [artists, search]);

  // ===================================================
  // OPEN PUBLIC ARTIST PROFILE
  // ===================================================

  const handleOpenArtist = useCallback(
    (artistId) => {
      if (!artistId) {
        setError("This artist does not have a valid profile ID.");
        return;
      }

      navigate(
        `/artists/${encodeURIComponent(artistId)}`
      );
    },
    [navigate]
  );

  // ===================================================
  // UNFOLLOW
  // ===================================================

  const handleUnfollow = useCallback(
    async (artist) => {
      const artistId = getArtistId(artist);

      if (!artistId || unfollowingId) {
        return;
      }

      const token = getToken();

      if (!token) {
        setError("Please sign in to unfollow artists.");
        return;
      }

      setUnfollowingId(artistId);
      setError("");
      setNotice("");

      try {
        await axios.delete(
          `${API_URL}/api/profile/followed-artists/${encodeURIComponent(artistId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setArtists((previous) =>
          previous.filter(
            (item) =>
              getArtistId(item) !== artistId
          )
        );

        setNotice(
          `${getArtistName(artist)} has been removed from your followed artists.`
        );
      } catch (err) {
        console.error(
          "Unfollow artist error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to unfollow this artist. Please try again."
        );
      } finally {
        setUnfollowingId("");
      }
    },
    [unfollowingId]
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section className="
      min-h-screen
      bg-[var(--theme-background)]
      px-4 py-8
      text-[var(--theme-text)]
      sm:px-6 sm:py-12
      lg:px-8
    ">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="
          mb-8 flex flex-col
          gap-5
          sm:flex-row sm:items-center
          sm:justify-between
        ">
          <div>
            <div className="
              mb-3 inline-flex items-center gap-2
              rounded-full
              border border-[var(--theme-border)]
              bg-[var(--theme-surface)]
              px-4 py-2
              text-xs font-bold uppercase tracking-[0.18em]
              text-[var(--theme-primary)]
              shadow-[4px_4px_8px_var(--theme-shadow-dark),-4px_-4px_8px_var(--theme-shadow-light)]
            ">
              <Music2 size={15} />
              Your music community
            </div>

            <h1 className="
              text-3xl font-black tracking-tight
              sm:text-4xl lg:text-5xl
            ">
              Following{" "}
              <span className="text-[var(--theme-primary)]">
                Artists
              </span>
            </h1>

            <p className="
              mt-3 max-w-2xl
              text-sm leading-6
              text-[var(--theme-textMuted)]
              sm:text-base
            ">
              Discover your favorite artists, explore their
              profiles, and enjoy their music.
            </p>
          </div>

          <div className="
            flex h-fit shrink-0 items-center gap-3
            self-start
            rounded-2xl
            border border-[var(--theme-border)]
            bg-[var(--theme-surface)]
            px-5 py-4
            shadow-[6px_6px_12px_var(--theme-shadow-dark),-6px_-6px_12px_var(--theme-shadow-light)]
          ">
            <div className="
              flex h-11 w-11 items-center justify-center
              rounded-xl
              bg-[var(--theme-background)]
              text-[var(--theme-secondary)]
              shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]
            ">
              <Users size={21} />
            </div>

            <div>
              <p className="
                text-2xl font-black
                text-[var(--theme-text)]
              ">
                {artists.length}
              </p>

              <p className="
                text-xs font-medium
                text-[var(--theme-textMuted)]
              ">
                Following
              </p>
            </div>
          </div>
        </header>

        {/* SEARCH */}

        <div className="
          mb-8 flex flex-col gap-4
          sm:flex-row
        ">
          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="
                absolute left-4 top-1/2
                -translate-y-1/2
                text-[var(--theme-textMuted)]
              "
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search artists by name or bio..."
              aria-label="Search followed artists"
              className="
                min-h-14 w-full rounded-2xl
                border border-[var(--theme-border)]
                bg-[var(--theme-surface)]
                py-4 pl-12 pr-12
                text-base
                text-[var(--theme-text)]
                outline-none
                placeholder:text-[var(--theme-textMuted)]
                shadow-[inset_5px_5px_10px_var(--theme-shadow-dark),inset_-5px_-5px_10px_var(--theme-shadow-light)]
                transition-all
                focus:border-[var(--theme-primary)]
              "
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="
                  absolute right-4 top-1/2
                  -translate-y-1/2
                  text-[var(--theme-textMuted)]
                  hover:text-[var(--theme-primary)]
                "
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void fetchArtists()}
            disabled={loading}
            className="
              inline-flex min-h-14 items-center
              justify-center gap-2
              rounded-2xl
              border border-[var(--theme-border)]
              bg-[var(--theme-surface)]
              px-5 py-3
              text-sm font-bold
              text-[var(--theme-text)]
              shadow-[5px_5px_10px_var(--theme-shadow-dark),-5px_-5px_10px_var(--theme-shadow-light)]
              transition-all
              hover:text-[var(--theme-primary)]
              active:scale-95
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {/* NOTICES */}

        {notice && (
          <div
            role="status"
            className="
              mb-6 flex items-start gap-3
              rounded-2xl
              border border-[var(--theme-secondary)]/30
              bg-[var(--theme-surface)]
              p-4
              text-sm
              text-[var(--theme-text)]
            "
          >
            <BadgeCheck
              size={19}
              className="shrink-0 text-[var(--theme-secondary)]"
            />

            <p className="min-w-0 flex-1">
              {notice}
            </p>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notice"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="
              mb-6 flex items-start gap-3
              rounded-2xl
              border border-red-400/30
              bg-[var(--theme-surface)]
              p-4
              text-sm text-red-400
            "
          >
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p className="min-w-0 flex-1">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="
            flex min-h-72 flex-col
            items-center justify-center gap-4
            rounded-3xl
            border border-[var(--theme-border)]
            bg-[var(--theme-surface)]
            shadow-[8px_8px_16px_var(--theme-shadow-dark),-8px_-8px_16px_var(--theme-shadow-light)]
          ">
            <div className="
              flex h-16 w-16 items-center justify-center
              rounded-2xl
              bg-[var(--theme-background)]
              shadow-[inset_5px_5px_10px_var(--theme-shadow-dark),inset_-5px_-5px_10px_var(--theme-shadow-light)]
            ">
              <Loader2
                size={30}
                className="animate-spin text-[var(--theme-primary)]"
              />
            </div>

            <p className="
              font-semibold
              text-[var(--theme-textMuted)]
            ">
              Loading your favorite artists...
            </p>
          </div>
        )}

        {/* ERROR EMPTY STATE */}

        {!loading && error && artists.length === 0 && (
          <div className="
            flex min-h-64 flex-col
            items-center justify-center
            rounded-3xl
            border border-[var(--theme-border)]
            bg-[var(--theme-surface)]
            p-8 text-center
            shadow-[8px_8px_16px_var(--theme-shadow-dark),-8px_-8px_16px_var(--theme-shadow-light)]
          ">
            <AlertCircle
              size={36}
              className="mb-4 text-red-400"
            />

            <h2 className="text-xl font-bold">
              Couldn't load your artists
            </h2>

            <p className="
              mt-2 max-w-md
              text-sm leading-6
              text-[var(--theme-textMuted)]
            ">
              Check your connection and try again.
            </p>

            <button
              type="button"
              onClick={() => void fetchArtists()}
              className="
                mt-5 rounded-xl
                bg-[var(--theme-primary)]
                px-5 py-3
                font-bold text-white
                hover:brightness-110
              "
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading && !error && artists.length === 0 && (
          <div className="
            flex min-h-80 flex-col
            items-center justify-center
            rounded-3xl
            border border-[var(--theme-border)]
            bg-[var(--theme-surface)]
            p-8 text-center
            shadow-[8px_8px_16px_var(--theme-shadow-dark),-8px_-8px_16px_var(--theme-shadow-light)]
          ">
            <div className="
              mb-5 flex h-20 w-20 items-center justify-center
              rounded-3xl
              bg-[var(--theme-background)]
              text-[var(--theme-primary)]
              shadow-[inset_5px_5px_10px_var(--theme-shadow-dark),inset_-5px_-5px_10px_var(--theme-shadow-light)]
            ">
              <Disc3 size={40} />
            </div>

            <h2 className="text-2xl font-black">
              Your artist list is waiting
            </h2>

            <p className="
              mt-3 max-w-md
              text-sm leading-6
              text-[var(--theme-textMuted)]
            ">
              Follow artists to discover their profiles
              and music here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="
                mt-6 inline-flex items-center gap-2
                rounded-xl
                bg-[var(--theme-primary)]
                px-5 py-3
                font-bold text-white
                transition hover:brightness-110
              "
            >
              Explore Music
              <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* NO SEARCH RESULTS */}

        {!loading &&
          artists.length > 0 &&
          filteredArtists.length === 0 && (
            <div className="
              flex min-h-64 flex-col
              items-center justify-center
              rounded-3xl
              border border-[var(--theme-border)]
              bg-[var(--theme-surface)]
              p-8 text-center
            ">
              <Search
                size={34}
                className="mb-4 text-[var(--theme-textMuted)]"
              />

              <h2 className="text-xl font-bold">
                No artists found
              </h2>

              <p className="
                mt-2 text-sm
                text-[var(--theme-textMuted)]
              ">
                Try another search term.
              </p>

              <button
                type="button"
                onClick={() => setSearch("")}
                className="
                  mt-4 rounded-xl
                  bg-[var(--theme-primary)]
                  px-4 py-2
                  font-bold text-white
                "
              >
                Clear Search
              </button>
            </div>
          )}

        {/* ARTIST GRID */}

        {!loading && filteredArtists.length > 0 && (
          <>
            <div className="
              mb-5 flex items-center justify-between gap-3
            ">
              <h2 className="text-lg font-bold">
                Your Artists
              </h2>

              <span className="
                rounded-full
                border border-[var(--theme-border)]
                bg-[var(--theme-surface)]
                px-3 py-1
                text-xs font-semibold
                text-[var(--theme-textMuted)]
              ">
                {filteredArtists.length}{" "}
                {filteredArtists.length === 1
                  ? "artist"
                  : "artists"}
              </span>
            </div>

            <div className="
              grid grid-cols-1 gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            ">
              {filteredArtists.map((artist) => {
                const artistId = getArtistId(artist);

                return (
                  <ArtistCard
                    key={artistId}
                    artist={artist}
                    onOpen={handleOpenArtist}
                    onUnfollow={handleUnfollow}
                    unfollowing={
                      unfollowingId === artistId
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FollowingArtists;