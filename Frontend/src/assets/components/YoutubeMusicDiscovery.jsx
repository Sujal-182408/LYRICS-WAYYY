import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Play, Music2, LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { searchYouTubeMusic } from "../../services/youtubeMusicService";
import { usePlayer } from "../../context/PlayerContext";

const CATEGORIES = [
  { label: "Bollywood", query: "popular Bollywood Hindi songs official music video" },
  { label: "Punjabi", query: "popular Punjabi songs official music video" },
  { label: "Bhojpuri", query: "popular Bhojpuri songs official music video" },
  { label: "International", query: "popular international music official music video" },
];

export default function YoutubeMusicDiscovery() {
  const { currentSong, playing, playYouTubeSong } = usePlayer();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [query, setQuery] = useState(CATEGORIES[0].query);
  const [searchInput, setSearchInput] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchMusic = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) { setVideos([]); setError("Enter a song, artist, or music genre to search."); return; }
    setLoading(true); setError("");
    try {
      const results = await searchYouTubeMusic(searchQuery, 12);
      setVideos(Array.isArray(results) ? results : []);
      if (!results?.length) setError("No videos found. Try a different search.");
    } catch (err) { setError(err.message || "Unable to load music right now."); setVideos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void searchMusic(query); }, [query, searchMusic]);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setActiveCategory(null);
    setQuery(trimmed);
  };

  const chooseCategory = (category) => { setActiveCategory(category); setSearchInput(""); setQuery(category.query); };
  const handlePlay = (video, index) => {
    playYouTubeSong(video, videos, index);
  };

  return (
    <section className="my-10 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--theme-secondary)]">Discover something new</p>
          <h2 className="text-2xl font-bold text-[var(--theme-text)] sm:text-3xl">Popular Music</h2>
          <p className="mt-2 text-sm text-[var(--theme-textMuted)]">Explore Indian and international music and play it through your LYRICS WAYYY player.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 shadow-[inset_3px_3px_7px_var(--theme-shadowDark),inset_-3px_-3px_7px_var(--theme-shadowLight)] sm:max-w-sm">
          <Search size={18} className="ml-2 shrink-0 text-[var(--theme-textMuted)]" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search songs or artists..." aria-label="Search YouTube music" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-textMuted)]" />
          <button type="submit" disabled={loading || !searchInput.trim()} className="rounded-xl bg-[var(--theme-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((category) => {
          const active = activeCategory?.label === category.label;
          return <button key={category.label} type="button" onClick={() => chooseCategory(category)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-white" : "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-[3px_3px_7px_var(--theme-shadowDark),-3px_-3px_7px_var(--theme-shadowLight)] hover:border-[var(--theme-primary)]"}`}>{category.label}</button>;
        })}
      </div>

      {currentSong?.youtubeVideoId && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--theme-primary)] bg-[var(--theme-surface)] p-4 shadow-[inset_3px_3px_7px_var(--theme-shadowDark),inset_-3px_-3px_7px_var(--theme-shadowLight)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-primary)] text-white"><Music2 size={21} /></div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-secondary)]">{playing ? "Now playing in MusicPlayer" : "Selected YouTube track"}</p><p className="truncate font-semibold text-[var(--theme-text)]">{currentSong.title}</p><p className="truncate text-xs text-[var(--theme-textMuted)]">{currentSong.artist}</p></div>
          <CheckCircle2 size={20} className="shrink-0 text-[var(--theme-secondary)]" />
        </div>
      )}

      {loading && <div className="flex items-center justify-center gap-3 py-12 text-[var(--theme-textMuted)]"><LoaderCircle className="animate-spin" size={22} /><span>Finding music for you...</span></div>}
      {!loading && error && <div role="status" className="flex items-start gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-textMuted)]"><AlertCircle size={20} className="mt-0.5 shrink-0 text-[var(--theme-secondary)]" /><span>{error}</span></div>}

      {!loading && videos.length > 0 && <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video, index) => {
          const selected = currentSong?.youtubeVideoId === video.videoId;
          return <motion.button key={video.videoId} type="button" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.035, 0.25) }} onClick={() => handlePlay(video, index)} aria-pressed={selected} className="group overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-left shadow-[5px_5px_12px_var(--theme-shadowDark),-5px_-5px_12px_var(--theme-shadowLight)] transition hover:-translate-y-1 hover:border-[var(--theme-primary)] aria-pressed:border-[var(--theme-primary)]">
            <div className="relative aspect-video overflow-hidden bg-[var(--theme-background)]">
              {video.thumbnail ? <img src={video.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[var(--theme-primary)]"><Music2 size={34} /></div>}
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-primary)] text-white shadow-lg"><Play size={21} fill="currentColor" /></span></div>
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 p-1.5 text-white">{selected && playing ? <span className="px-1 text-xs">Playing</span> : <Play size={13} fill="currentColor" />}</span>
            </div>
            <div className="space-y-2 p-4"><h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--theme-text)]">{video.title}</h3><p className="truncate text-xs text-[var(--theme-textMuted)]">{video.artist}</p><span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-secondary)]">{selected ? "Selected in MusicPlayer" : "Play in MusicPlayer"} <Play size={12} fill="currentColor" /></span></div>
          </motion.button>;
        })}
      </div>}

      <p className="text-xs leading-5 text-[var(--theme-textMuted)]">YouTube videos play through the embedded YouTube player in the existing MusicPlayer. Some videos may restrict embedded playback.</p>
    </section>
  );
}

