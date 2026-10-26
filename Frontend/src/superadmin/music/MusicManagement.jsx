
import React, { useCallback, useEffect, useState } from "react";
import {
  Disc3,
  Loader2,
  Music2,
  RefreshCw,
  Search,
} from "lucide-react";

import { getSongs } from "../services/musicService";

export default function MusicManagement() {
  const [songs, setSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadSongs = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getSongs({
          page: 1,
          limit: 100,
          search,
        });

        if (!data?.success) {
          throw new Error(
            data?.message || "Failed to load songs."
          );
        }

        setSongs(data.songs || []);
      } catch (err) {
        console.error("SONGS LOAD ERROR:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load songs."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[#2bd4c4]">
            Super Admin
          </p>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Music Management
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Live songs from your music database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSongs({ refresh: true })}
          disabled={refreshing}
          className="
            flex min-h-[44px]
            items-center justify-center gap-2
            rounded-xl
            bg-[#1d2229]
            px-4
            text-sm font-medium text-white/70
            shadow-[-4px_-4px_9px_rgba(255,255,255,0.02),6px_6px_12px_rgba(0,0,0,0.45)]
            hover:text-white
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* SEARCH */}
      <div
        className="
          rounded-2xl
          border border-white/[0.03]
          bg-[#1a1e24]
          p-4
          shadow-[-6px_-6px_14px_rgba(255,255,255,0.02),8px_8px_18px_rgba(0,0,0,0.45)]
        "
      >
        <div className="relative">
          <Search
            size={17}
            className="
              absolute left-4 top-1/2
              -translate-y-1/2
              text-white/25
            "
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search songs..."
            className="
              h-11 w-full
              rounded-xl
              border border-white/[0.035]
              bg-[#15181d]
              pl-11 pr-4
              text-sm text-white
              outline-none
              shadow-inner
              placeholder:text-white/20
              focus:border-[#2bd4c4]/30
            "
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="
            rounded-2xl
            border border-red-400/10
            bg-red-500/[0.05]
            px-4 py-3
            text-sm text-red-300
          "
        >
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div
          className="
            flex min-h-[300px]
            items-center justify-center
            rounded-2xl
            bg-[#1a1e24]
          "
        >
          <div className="flex items-center gap-3 text-white/40">
            <Loader2 size={22} className="animate-spin" />
            Loading songs...
          </div>
        </div>
      ) : songs.length === 0 ? (
        <div
          className="
            flex min-h-[300px]
            flex-col items-center justify-center
            rounded-2xl
            bg-[#1a1e24]
          "
        >
          <Music2
            size={40}
            className="text-white/15"
          />

          <p className="mt-4 text-sm text-white/35">
            No songs found.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {songs.map((song) => (
            <div
              key={song._id}
              className="
                rounded-2xl
                border border-white/[0.03]
                bg-[#1a1e24]
                p-4
                shadow-[-6px_-6px_14px_rgba(255,255,255,0.02),8px_8px_18px_rgba(0,0,0,0.45)]
              "
            >
              <div className="flex items-center gap-4">

                <div
                  className="
                    flex h-14 w-14 shrink-0
                    items-center justify-center
                    rounded-2xl
                    bg-[#15181d]
                    text-[#8c7cf7]
                    shadow-inner
                  "
                >
                  <Disc3 size={23} />
                </div>

                <div className="min-w-0 flex-1">

                  <h3 className="truncate text-sm font-semibold text-white">
                    {song.title || "Untitled"}
                  </h3>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {typeof song.artist === "object"
                      ? song.artist?.name
                      : song.artist || "Unknown Artist"}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-white/25">
                    {song.genre || "Unknown genre"}
                  </p>

                </div>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <div className="rounded-xl bg-[#15181d] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-white/20">
                    Album
                  </p>

                  <p className="mt-1 truncate text-xs text-white/45">
                    {song.album || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-[#15181d] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-white/20">
                    Duration
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    {song.duration || "—"}
                  </p>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
