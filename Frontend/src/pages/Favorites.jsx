
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Music2,
  Play,
  Search,
  Trash2,
  RefreshCw,
  Mic2,
} from "lucide-react";

import {
  getMyFavorites,
  removeFavorite,
} from "../services/profileService";

import { usePlayer } from "../context/PlayerContext";
import { useTheme } from "../context/ThemeContext";
import { BASE_URL } from "../config/api";

// =====================================================
// MEDIA URL
// =====================================================

const getMediaUrl = (path) => {
  if (!path || typeof path !== "string") return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  return `${BASE_URL.replace(/\/+$/, "")}/${cleanPath}`;
};

// =====================================================
// COMPONENT
// =====================================================

export default function Favorites() {
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { theme } = useTheme();

  // Your existing ThemeContext applies these colors as CSS variables.
  // Using the variables directly keeps this page synchronized with
  // theme changes without introducing another theme system.
  const colors = theme.colors;

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // ===================================================
  // LOAD FAVORITES
  // ===================================================

  const loadFavorites = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getMyFavorites();

      if (response?.success && Array.isArray(response.favorites)) {
        setFavorites(response.favorites);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error("FAVORITES ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load favorites."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredFavorites = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return favorites;

    return favorites.filter((item) => {
      const song = item?.song;

      const title = song?.title?.toLowerCase() || "";
      const artist = song?.artist?.name?.toLowerCase() || "";
      const album =
        typeof song?.album === "string"
          ? song.album.toLowerCase()
          : song?.album?.name?.toLowerCase() || "";

      return (
        title.includes(query) ||
        artist.includes(query) ||
        album.includes(query)
      );
    });
  }, [favorites, search]);

  // ===================================================
  // PLAY SONG
  // ===================================================

  const handlePlay = useCallback(
    (song) => {
      if (!song) return;

      try {
        if (typeof playSong === "function") {
          playSong(song);
        }
      } catch (err) {
        console.error("PLAY FAVORITE ERROR:", err);
        setError("Unable to play this song.");
      }
    },
    [playSong]
  );

  // ===================================================
  // REMOVE FAVORITE
  // ===================================================

  const handleRemove = async (songId, favoriteId) => {
    if (!songId) {
      setError("Unable to identify this song.");
      return;
    }

    const operationId = favoriteId || songId;

    try {
      setRemovingId(operationId);
      setError("");

      await removeFavorite(songId);

      setFavorites((current) =>
        current.filter(
          (item) =>
            item?.song?._id !== songId &&
            item?.favoriteId !== favoriteId &&
            item?._id !== favoriteId
        )
      );
    } catch (err) {
      console.error("REMOVE FAVORITE ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove favorite."
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ===================================================
  // REUSABLE NEUMORPHIC SURFACE STYLES
  // ===================================================

  const raisedStyle = {
    background: "var(--theme-surface)",
    border: "1px solid var(--theme-border)",
    boxShadow: `
      7px 7px 16px var(--theme-shadow-dark),
      -7px -7px 16px var(--theme-shadow-light)
    `,
    transition:
      "background-color 250ms ease, color 250ms ease, border-color 250ms ease, box-shadow 250ms ease",
  };

  const pressedStyle = {
    background: "var(--theme-surface)",
    border: "1px solid var(--theme-border)",
    boxShadow: `
      inset 4px 4px 9px var(--theme-shadow-dark),
      inset -4px -4px 9px var(--theme-shadow-light)
    `,
    transition:
      "background-color 250ms ease, color 250ms ease, border-color 250ms ease, box-shadow 250ms ease",
  };

  const iconButtonStyle = {
    ...raisedStyle,
    color: "var(--theme-text)",
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: "var(--theme-background)",
          color: "var(--theme-text)",
          transition: "background-color 250ms ease, color 250ms ease",
        }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={raisedStyle}
          >
            <Heart
              size={27}
              fill="currentColor"
              style={{
                color: "var(--theme-primary)",
                filter: "drop-shadow(0 0 12px var(--theme-glow-primary))",
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <RefreshCw
              size={17}
              className="animate-spin"
              style={{ color: "var(--theme-secondary)" }}
            />

            <p
              className="text-sm"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Loading your favorites...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{
        background: "var(--theme-background)",
        color: "var(--theme-text)",
        transition: "background-color 250ms ease, color 250ms ease",
      }}
    >


      
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}


        <header className="mb-8 space-y-6">
        <button
  type="button"
  onClick={() => navigate("/profile")}
  aria-label="Back to profile"
  title="Back to profile"
  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
  style={{
    background: "var(--theme-surface)",
    color: "var(--theme-text)",
    border: "1px solid var(--theme-border)",
    boxShadow: `
      6px 6px 14px var(--theme-shadow-dark),
      -6px -6px 14px var(--theme-shadow-light)
    `,
  }}
>
  <ArrowLeft size={20} />
</button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
              style={iconButtonStyle}
              aria-label="Back to profile"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <span
                className="hidden text-xs font-semibold uppercase tracking-[0.2em] sm:inline"
                style={{ color: "var(--theme-text-muted)" }}
              >
                Your music library
              </span>

              <button
                type="button"
                onClick={() => loadFavorites(true)}
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={iconButtonStyle}
                title="Refresh favorites"
                aria-label="Refresh favorites"
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                  style={{
                    color: refreshing
                      ? "var(--theme-secondary)"
                      : "var(--theme-text)",
                  }}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
              style={{
                ...pressedStyle,
                color: "var(--theme-primary)",
              }}
            >
              <Heart size={27} fill="currentColor" />
            </div>

            <div className="min-w-0">
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--theme-secondary)" }}
              >
                Saved for you
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                Your Favorites
              </h1>

              <p
                className="mt-2 text-sm sm:text-base"
                style={{ color: "var(--theme-text-muted)" }}
              >
                Every song you love, collected in one place.
              </p>
            </div>
          </div>
        </header>

        {/* SUMMARY CARD */}

        <section
          className="mb-7 rounded-3xl p-5 sm:p-6"
          style={raisedStyle}
          aria-label="Favorite statistics"
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  ...pressedStyle,
                  color: "var(--theme-primary)",
                }}
              >
                <Heart size={21} fill="currentColor" />
              </div>

              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  Saved songs
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {favorites.length}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{
                ...pressedStyle,
                color: "var(--theme-text-muted)",
              }}
            >
              {favorites.length === 1
                ? "1 song in your collection"
                : `${favorites.length} songs in your collection`}
            </div>
          </div>
        </section>

        {/* SEARCH */}

        <section
          className="mb-7 rounded-3xl p-3 sm:p-4"
          style={pressedStyle}
          aria-label="Search favorites"
        >
          <div className="flex items-center gap-3 px-2 sm:px-3">
            <Search
              size={19}
              className="shrink-0"
              style={{ color: "var(--theme-text-muted)" }}
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search songs, artists, or albums..."
              aria-label="Search favorite songs"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none"
              style={{
                color: "var(--theme-text)",
                caretColor: "var(--theme-primary)",
              }}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ color: "var(--theme-primary)" }}
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm"
            style={{
              ...pressedStyle,
              color: "var(--theme-danger)",
            }}
          >
            <span className="mt-0.5 shrink-0">!</span>
            <p className="min-w-0 flex-1">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-xs font-semibold"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {filteredFavorites.length === 0 ? (
          <section
            className="rounded-[2rem] px-6 py-16 text-center sm:py-24"
            style={raisedStyle}
          >
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                ...pressedStyle,
                color: "var(--theme-primary)",
              }}
            >
              {search ? (
                <Search size={29} />
              ) : (
                <Heart size={31} />
              )}
            </div>

            <h2 className="text-xl font-bold sm:text-2xl">
              {search
                ? "No matching favorites"
                : "Your collection starts here"}
            </h2>

            <p
              className="mx-auto mt-3 max-w-md text-sm leading-6"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {search
                ? "We couldn't find a song matching your search. Try another title, artist, or album."
                : "Save songs you love from your music player and they'll be waiting for you here."}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-6 rounded-2xl px-5 py-3 text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: "var(--theme-gradient)",
                  color: "var(--theme-text-dark)",
                  boxShadow: "0 5px 18px var(--theme-glow-primary)",
                }}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="mt-6 rounded-2xl px-5 py-3 text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: "var(--theme-gradient)",
                  color: "var(--theme-text-dark)",
                  boxShadow: "0 5px 18px var(--theme-glow-primary)",
                }}
              >
                Discover music
              </button>
            )}
          </section>
        ) : (
          /* FAVORITES LIST */

          <section className="space-y-4" aria-label="Favorite songs">
            {filteredFavorites.map((item, index) => {
              const song = item?.song;
              const artist = song?.artist;

              const cover = getMediaUrl(
                song?.coverImage || artist?.image
              );

              const songId = song?._id;
              const favoriteId = item?.favoriteId || item?._id;
              const operationId = favoriteId || songId;
              const isRemoving = removingId === operationId;

              return (
                <article
                  key={operationId || `${songId || "song"}-${index}`}
                  className="group rounded-3xl p-3 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5"
                  style={raisedStyle}
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                    {/* COVER */}

                    <div
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20"
                      style={{
                        boxShadow: `
                          5px 5px 10px var(--theme-shadow-dark),
                          -5px -5px 10px var(--theme-shadow-light)
                        `,
                      }}
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={`${song?.title || "Song"} cover`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}

                      <div
                        className="absolute inset-0 -z-10 flex items-center justify-center"
                        style={{
                          background: "var(--theme-surface-light)",
                          color: "var(--theme-text-muted)",
                        }}
                      >
                        <Music2 size={25} />
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlay(song)}
                        disabled={!song}
                        aria-label={`Play ${song?.title || "song"}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed"
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            background: "var(--theme-gradient)",
                            color: "var(--theme-text-dark)",
                            boxShadow: "0 0 18px var(--theme-glow-primary)",
                          }}
                        >
                          <Play size={17} fill="currentColor" className="ml-0.5" />
                        </span>
                      </button>
                    </div>

                    {/* SONG INFORMATION */}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold sm:text-base">
                        {song?.title || "Unknown song"}
                      </h3>

                      <div
                        className="mt-1 flex min-w-0 items-center gap-1.5 text-xs sm:text-sm"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        <Mic2 size={14} className="shrink-0" />
                        <span className="truncate">
                          {artist?.name || "Unknown artist"}
                        </span>
                      </div>

                      {song?.album && (
                        <p
                          className="mt-1 truncate text-xs"
                          style={{ color: "var(--theme-text-muted)" }}
                        >
                          {typeof song.album === "string"
                            ? song.album
                            : song.album?.title || song.album?.name || ""}
                        </p>
                      )}

                      {song?.genre && (
                        <span
                          className="mt-2 inline-flex max-w-full truncate rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider sm:text-xs"
                          style={{
                            background: "var(--theme-surface-light)",
                            color: "var(--theme-secondary)",
                          }}
                        >
                          {song.genre}
                        </span>
                      )}
                    </div>

                    {/* ACTIONS */}

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlay(song)}
                        disabled={!song}
                        aria-label={`Play ${song?.title || "song"}`}
                        title="Play song"
                        className="hidden h-11 w-11 items-center justify-center rounded-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 sm:flex"
                        style={{
                          ...iconButtonStyle,
                          color: "var(--theme-primary)",
                        }}
                      >
                        <Play size={17} fill="currentColor" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(songId, favoriteId)}
                        disabled={isRemoving || !songId}
                        aria-label={`Remove ${song?.title || "song"} from favorites`}
                        title="Remove favorite"
                        className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11 sm:rounded-2xl"
                        style={{
                          ...iconButtonStyle,
                          color: "var(--theme-danger)",
                        }}
                      >
                        {isRemoving ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* FOOTER */}

        {filteredFavorites.length > 0 && (
          <footer
            className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-xs"
            style={{ color: "var(--theme-text-muted)" }}
          >
            <span>
              Showing {filteredFavorites.length} of {favorites.length}{" "}
              {favorites.length === 1 ? "favorite" : "favorites"}
            </span>

            <span className="flex items-center gap-2">
              <Heart
                size={13}
                fill="currentColor"
                style={{ color: "var(--theme-primary)" }}
              />
              Your music, your collection
            </span>
          </footer>
        )}
      </div>
    </main>
  );
}
