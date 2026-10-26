import React, { useState, useEffect, useRef, useCallback } from "react";

import { Link, useNavigate, useLocation } from "react-router-dom";

import axios from "axios";

import { useAuth } from "../../AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { BASE_URL } from "../../config/api";

import ThemeSwitcher from "../../assets/utility/ThemeSwitcher";
import NotificationPanel from "../components/notifications/NotificationPanel";

import {
  Menu,
  X,
  Search,
  Bell,
  User,
  Music4,
  LogOut,
  Mic2,
  Loader2,
  ArrowUpRight,
  Disc3,
  Clock3,
  SearchX,
  Home,
  ListMusic,
  Library,
  History,
  Info,
  Wrench,
  Clapperboard,
  Images,
  Mail,
  ChevronRight,
  SlidersHorizontal,
  Settings,
  Compass,
} from "lucide-react";

const DEBOUNCE_DELAY = 300;
const MAX_RESULTS = 6;
const MIN_QUERY_LENGTH = 2;

const navLinks = [
  { name: "HOME", link: "/home" },
  { name: "ABOUT", link: "/about" },
  { name: "SERVICES", link: "/service" },
  { name: "PRODUCTION", link: "/productions" },
  { name: "CONTACT", link: "/contact" },
];

const mobilePrimaryLinks = [
  {
    name: "Home",
    path: "/home",
    icon: Home,
  },
  {
    name: "Search",
    action: "search",
    icon: Search,
  },
  {
    name: "Playlists",
    path: "/playlists",
    icon: ListMusic,
  },
  {
    name: "Collections",
    path: "/collections",
    icon: Library,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: User,
  },
];

const mobileSecondaryLinks = [
  {
    name: "Discover",
    path: "/suggestions",
    icon: Compass,
  },
  {
    name: "Artists",
    path: "/artists",
    icon: Mic2,
  },
  {
    name: "Albums",
    path: "/albums",
    icon: Disc3,
  },
  {
    name: "Listening History",
    path: "/history",
    icon: History,
  },
  {
    name: "Favorites",
    path: "/favorites",
    icon: Music4,
  },
  {
    name: "Following Artists",
    path: "/following-artists",
    icon: User,
  },
  {
    name: "About",
    path: "/about",
    icon: Info,
  },
  {
    name: "Services",
    path: "/service",
    icon: Wrench,
  },
  {
    name: "Productions",
    path: "/productions",
    icon: Clapperboard,
  },
  {
    name: "Gallery",
    path: "/gallery",
    icon: Images,
  },
  {
    name: "Contact",
    path: "/contact",
    icon: Mail,
  },
];

const getId = (item) => String(item?._id || item?.id || "");

const getArtistName = (song) => {
  if (typeof song?.artist === "string") {
    return song.artist;
  }

  return song?.artist?.name || song?.uploadedBy?.name || "Unknown Artist";
};

const getMediaUrl = (path) => {
  if (!path) return "";

  const value = String(path).trim();

  if (!value) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  const base = String(BASE_URL || "").replace(/\/+$/, "");
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");

  return `${base}/${normalized}`;
};

const iconButtonStyle = (active = false) => ({
  backgroundColor: "var(--theme-surface)",
  borderColor: active ? "var(--theme-primary)" : "var(--theme-border)",
  color: active ? "var(--theme-primary)" : "var(--theme-textMuted)",
  boxShadow: active
    ? "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)"
    : "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
});

const Navbar = () => {
  const { logout, role } = useAuth();

  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  const isArtist = normalizedRole === "artist";
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    songs: [],
    artists: [],
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  const searchContainerRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const requestIdRef = useRef(0);

  const normalizedQuery = searchQuery.trim();

  const allResults = [
    ...searchResults.songs.map((item) => ({
      ...item,
      resultType: "song",
    })),
    ...searchResults.artists.map((item) => ({
      ...item,
      resultType: "artist",
    })),
  ];

  // =====================================================
  // ROUTE HELPERS
  // =====================================================

  const isActiveRoute = useCallback(
    (path) => {
      const pathname = location.pathname;

      if (path === "/home") {
        return pathname === "/" || pathname === "/home";
      }

      if (path === "/playlists") {
        return pathname === "/playlists" || pathname.startsWith("/playlists/");
      }

      if (path === "/collections") {
        return (
          pathname === "/collections" || pathname.startsWith("/collections/")
        );
      }

      if (path === "/profile") {
        return pathname.startsWith("/profile");
      }

      if (path === "/history") {
        return (
          pathname === "/history" || pathname === "/profile/listening-history"
        );
      }

      if (path === "/artists") {
        return pathname.startsWith("/artists");
      }

      if (path === "/albums") {
        return pathname.startsWith("/albums");
      }

      return pathname === path;
    },
    [location.pathname],
  );

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setMobileMenu(false);
    setNotificationOpen(false);
    clearSearch();

    logout();
    navigate("/signin");
  };

  // =====================================================
  // SEARCH HELPERS
  // =====================================================

  const clearSearch = useCallback(() => {
    requestIdRef.current += 1;

    setSearchQuery("");
    setSearchResults({
      songs: [],
      artists: [],
    });
    setSearchLoading(false);
    setSearchError("");
    setActiveResultIndex(-1);
    setSearchOpen(false);
  }, []);

  const fetchSearchResults = useCallback(async (query) => {
    const currentRequestId = ++requestIdRef.current;

    if (query.length < MIN_QUERY_LENGTH) {
      setSearchResults({
        songs: [],
        artists: [],
      });
      setSearchLoading(false);
      setSearchError("");
      setActiveResultIndex(-1);
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    try {
      const encodedQuery = encodeURIComponent(query);

      const [songsResponse, artistsResponse] = await Promise.all([
        axios.get(
          `${BASE_URL}/api/songs?search=${encodedQuery}&page=1&limit=${MAX_RESULTS}&sort=latest`,
          { timeout: 10000 },
        ),
        axios.get(
          `${BASE_URL}/api/artists?search=${encodedQuery}&page=1&limit=${MAX_RESULTS}`,
          { timeout: 10000 },
        ),
      ]);

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const songsData = songsResponse.data;
      const artistsData = artistsResponse.data;

      const songs = Array.isArray(songsData?.songs) ? songsData.songs : [];

      const artists = Array.isArray(artistsData?.artists)
        ? artistsData.artists
        : [];

      setSearchResults({
        songs: songs.slice(0, MAX_RESULTS),
        artists: artists.slice(0, MAX_RESULTS),
      });

      setActiveResultIndex(-1);
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      console.error("NAVBAR SEARCH ERROR:", error);

      setSearchResults({
        songs: [],
        artists: [],
      });

      setSearchError(
        error.code === "ECONNABORTED"
          ? "Search took too long. Please try again."
          : "Unable to load search results. Please try again.",
      );
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setSearchLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!searchOpen) return undefined;

    const query = normalizedQuery;

    if (query.length < MIN_QUERY_LENGTH) {
      requestIdRef.current += 1;

      setSearchResults({
        songs: [],
        artists: [],
      });

      setSearchLoading(false);
      setSearchError("");
      setActiveResultIndex(-1);

      return undefined;
    }

    const timer = window.setTimeout(() => {
      fetchSearchResults(query);
    }, DEBOUNCE_DELAY);

    return () => window.clearTimeout(timer);
  }, [normalizedQuery, searchOpen, fetchSearchResults]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setSearchOpen(true);
    setActiveResultIndex(-1);
    setSearchError("");
  };

  const handleResultClick = (item) => {
    if (!item) return;

    const itemId = getId(item);

    if (!itemId) {
      console.error("Search result has no ID:", item);
      return;
    }

    setMobileMenu(false);
    setNotificationOpen(false);

    if (item.resultType === "artist") {
      navigate(`/artists/${encodeURIComponent(itemId)}`);
    } else {
      navigate("/", {
        state: {
          searchSongId: itemId,
          autoPlaySearchSong: true,
        },
      });
    }

    clearSearch();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveResultIndex(-1);

      desktopSearchInputRef.current?.blur();
      mobileSearchInputRef.current?.blur();

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);

      if (allResults.length > 0) {
        setActiveResultIndex((previous) =>
          previous >= allResults.length - 1 ? 0 : previous + 1,
        );
      }

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (allResults.length > 0) {
        setActiveResultIndex((previous) =>
          previous <= 0 ? allResults.length - 1 : previous - 1,
        );
      }

      return;
    }

    if (
      event.key === "Enter" &&
      activeResultIndex >= 0 &&
      allResults[activeResultIndex]
    ) {
      event.preventDefault();
      handleResultClick(allResults[activeResultIndex]);
    }
  };

  // =====================================================
  // OUTSIDE CLICK
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        const mobileSearch = mobileSearchInputRef.current;
        const clickedMobileSearch = mobileSearch?.contains(event.target);

        if (!clickedMobileSearch) {
          setSearchOpen(false);
          setActiveResultIndex(-1);
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // =====================================================
  // ROUTE CHANGES
  // =====================================================

  useEffect(() => {
    setMobileMenu(false);
    setNotificationOpen(false);
    setSearchOpen(false);
    setActiveResultIndex(-1);
  }, [location.pathname]);

  // =====================================================
  // SCROLL
  // =====================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // =====================================================
  // ESCAPE KEY
  // =====================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenu(false);
        setNotificationOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // =====================================================
  // SEARCH RESULT ITEM
  // =====================================================

  const renderSearchResult = (item, index) => {
    const isSong = item.resultType === "song";

    const title = isSong
      ? item.title || "Untitled Song"
      : item.name || "Unknown Artist";

    const subtitle = isSong
      ? getArtistName(item)
      : item.genre || item.bio || "Artist";

    const imagePath = isSong
      ? item.coverImage
      : item.image || item.user?.profileImage;

    const imageUrl = getMediaUrl(imagePath);
    const isActive = activeResultIndex === index;

    return (
      <button
        key={`${item.resultType}-${getId(item) || title}`}
        type="button"
        role="option"
        aria-selected={isActive}
        onMouseEnter={() => setActiveResultIndex(index)}
        onClick={() => handleResultClick(item)}
        className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-px"
        style={{
          backgroundColor: isActive
            ? "var(--theme-active)"
            : "var(--theme-surface)",
          borderColor: isActive
            ? "var(--theme-primary)"
            : "var(--theme-border)",
          color: "var(--theme-text)",
          boxShadow: isActive
            ? "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)"
            : "3px 3px 7px var(--theme-shadowDark), -3px -3px 7px var(--theme-shadowLight)",
        }}
      >
        <span
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-border)",
            color: "var(--theme-primary)",
            boxShadow:
              "inset 2px 2px 5px var(--theme-shadowDark), inset -2px -2px 5px var(--theme-shadowLight)",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : isSong ? (
            <Disc3 size={21} />
          ) : (
            <Mic2 size={21} />
          )}

          <span
            className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-tl-md"
            style={{
              backgroundColor: "var(--theme-primary)",
              color: "#ffffff",
            }}
          >
            {isSong ? <Music4 size={9} /> : <Mic2 size={9} />}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">
            {title}
          </span>

          <span
            className="mt-1 block truncate text-[11px]"
            style={{ color: "var(--theme-textMuted)" }}
          >
            {subtitle}
          </span>
        </span>

        <ArrowUpRight
          size={16}
          className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
          style={{ color: "var(--theme-primary)" }}
        />
      </button>
    );
  };

  // =====================================================
  // SEARCH RESULTS PANEL
  // =====================================================

  const renderSearchResultsPanel = (mobile = false) => (
    <div
      className={
        mobile
          ? "mt-2 max-h-[42vh] overflow-y-auto rounded-2xl border p-3"
          : "absolute right-0 top-[calc(100%+12px)] z-[10000] max-h-[min(72vh,560px)] w-[min(390px,calc(100vw-24px))] overflow-y-auto rounded-[24px] border p-3 animate-[menuDrop_0.2s_ease]"
      }
      style={{
        backgroundColor: "var(--theme-surface)",
        borderColor: "var(--theme-border)",
        boxShadow:
          "9px 9px 20px var(--theme-shadowDark), -6px -6px 18px var(--theme-shadowLight)",
      }}
    >
      {!mobile && (
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p
              className="text-[12px] font-bold tracking-[1.4px]"
              style={{ color: "var(--theme-text)" }}
            >
              SEARCH DISCOVER
            </p>

            <p
              className="mt-1 text-[10px]"
              style={{ color: "var(--theme-textMuted)" }}
            >
              Find your next favorite
            </p>
          </div>

          <span
            className="rounded-lg border px-2 py-1 text-[10px] font-semibold"
            style={{
              borderColor: "var(--theme-border)",
              color: "var(--theme-primary)",
            }}
          >
            LIVE SEARCH
          </span>
        </div>
      )}

      {normalizedQuery.length < MIN_QUERY_LENGTH ? (
        <div className="px-3 py-6 text-center">
          <Search
            size={26}
            className="mx-auto mb-2"
            style={{ color: "var(--theme-primary)" }}
          />

          <p
            className="text-sm font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            What do you want to hear?
          </p>

          <p
            className="mt-1 text-xs"
            style={{ color: "var(--theme-textMuted)" }}
          >
            Type at least 2 characters.
          </p>
        </div>
      ) : searchLoading ? (
        <div className="flex flex-col items-center py-7">
          <Loader2
            size={24}
            className="mb-3 animate-spin"
            style={{ color: "var(--theme-primary)" }}
          />

          <p className="text-xs" style={{ color: "var(--theme-textMuted)" }}>
            Searching songs and artists...
          </p>
        </div>
      ) : searchError ? (
        <div className="px-3 py-6 text-center">
          <SearchX
            size={26}
            className="mx-auto mb-2"
            style={{ color: "var(--theme-primary)" }}
          />

          <p
            className="text-sm font-semibold"
            style={{ color: "var(--theme-text)" }}
          >
            Search unavailable
          </p>

          <p
            className="mt-1 text-xs"
            style={{ color: "var(--theme-textMuted)" }}
          >
            {searchError}
          </p>

          <button
            type="button"
            onClick={() => fetchSearchResults(normalizedQuery)}
            className="mt-3 rounded-xl border px-4 py-2 text-xs font-semibold"
            style={{
              color: "var(--theme-primary)",
              borderColor: "var(--theme-border)",
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {searchResults.songs.length > 0 && (
            <section className="mb-4">
              <div className="mb-2 flex items-center gap-2 px-1">
                <Music4 size={14} style={{ color: "var(--theme-primary)" }} />

                <h3
                  className="text-[10px] font-bold tracking-[1.5px]"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  SONGS
                </h3>

                <span
                  className="text-[10px]"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  {searchResults.songs.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {searchResults.songs.map((song, index) =>
                  renderSearchResult({ ...song, resultType: "song" }, index),
                )}
              </div>
            </section>
          )}

          {searchResults.artists.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2 px-1">
                <Mic2 size={14} style={{ color: "var(--theme-secondary)" }} />

                <h3
                  className="text-[10px] font-bold tracking-[1.5px]"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  ARTISTS
                </h3>

                <span
                  className="text-[10px]"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  {searchResults.artists.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {searchResults.artists.map((artist, index) =>
                  renderSearchResult(
                    { ...artist, resultType: "artist" },
                    searchResults.songs.length + index,
                  ),
                )}
              </div>
            </section>
          )}

          {searchResults.songs.length === 0 &&
            searchResults.artists.length === 0 && (
              <div className="px-3 py-7 text-center">
                <SearchX
                  size={26}
                  className="mx-auto mb-2"
                  style={{ color: "var(--theme-primary)" }}
                />

                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--theme-text)" }}
                >
                  No matches found
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  Try another song or artist name.
                </p>
              </div>
            )}
        </>
      )}

      {!mobile && (
        <div
          className="mt-3 flex items-center gap-2 border-t px-1 pt-3"
          style={{ borderColor: "var(--theme-border)" }}
        >
          <Clock3 size={12} style={{ color: "var(--theme-textMuted)" }} />

          <p
            className="text-[10px]"
            style={{ color: "var(--theme-textMuted)" }}
          >
            Use ↑ ↓ to navigate and Enter to select
          </p>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      {/* TOP NAVBAR */}
      <header
        className={`
          fixed left-0 right-0 top-0 z-[100]
          flex flex-col items-center
          px-4 pt-5
          font-['Inter',sans-serif]
          transition-all duration-300
          ${scrolled ? "pt-2.5" : ""}
          max-[760px]:px-2.5
          max-[760px]:pt-3
          max-[420px]:px-2
          max-[420px]:pt-2.5
        `}
      >
        <nav
          className="
            flex w-full max-w-[1680px]
            items-center justify-between gap-3
            rounded-3xl border px-5 py-2.5
            transition-all duration-300
            max-[1200px]:gap-3
            max-[900px]:gap-2
            max-[760px]:rounded-[20px]
            max-[760px]:px-3
            max-[420px]:gap-1.5
            max-[420px]:px-2
            max-[420px]:py-2
          "
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-border)",
            color: "var(--theme-text)",
            boxShadow:
              "9px 9px 18px var(--theme-shadowDark), -9px -9px 18px var(--theme-shadowLight)",
          }}
        >
          {/* LOGO */}
          <Link
            to="/home"
            onClick={() => {
              setMobileMenu(false);
              setSearchOpen(false);
            }}
            className="flex shrink-0 items-center gap-2 no-underline"
            aria-label="LYRICS WAYYY home"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300 max-[420px]:h-9 max-[420px]:w-9"
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: "var(--theme-border)",
                color: "var(--theme-primary)",
                boxShadow:
                  "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
              }}
            >
              <Music4 size={20} />
            </span>

            <span
              className="whitespace-nowrap font-['Sora',sans-serif] text-[14px] font-bold tracking-[0.3px] max-[1200px]:text-base max-[760px]:text-[15px] max-[420px]:text-[12px]"
              style={{ color: "var(--theme-text)" }}
            >
              LYRICS WAYYY
            </span>

            <span className="ml-0.5 hidden h-3.5 items-end gap-1 min-[761px]:flex">
              {[6, 14, 9].map((height, index) => (
                <span
                  key={index}
                  className="w-[3px] rounded-[3px] animate-[eq-bounce_1.1s_ease-in-out_infinite]"
                  style={{
                    height,
                    animationDelay: `${index * 0.2}s`,
                    background:
                      "linear-gradient(180deg,var(--theme-secondary),var(--theme-primary))",
                  }}
                />
              ))}
            </span>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="flex flex-1 items-center justify-center gap-3 max-[1200px]:gap-2 max-[900px]:hidden">
            {navLinks.map((item) => {
              const active = isActiveRoute(item.link);

              return (
                <Link
                  key={item.link}
                  to={item.link}
                  onClick={() => setMobileMenu(false)}
                  className="flex min-w-0 items-center justify-center whitespace-nowrap rounded-[14px] border px-3 py-2 text-[13px] font-medium no-underline transition-all duration-300 hover:-translate-y-px max-[1200px]:px-2.5"
                  style={{
                    backgroundColor: active
                      ? "var(--theme-active)"
                      : "var(--theme-surface)",
                    color: active
                      ? "var(--theme-secondary)"
                      : "var(--theme-textMuted)",
                    borderColor: active ? "var(--theme-border)" : "transparent",
                    boxShadow: active
                      ? "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)"
                      : "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
                  }}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* DESKTOP SEARCH */}
          <div
            ref={searchContainerRef}
            className="relative hidden w-55 shrink max-[1200px]:w-45 min-[901px]:block"
          >
            <div
              className="flex w-full items-center gap-2 rounded-[14px] border px-3.5 py-[9px] transition-all duration-200"
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: searchOpen
                  ? "var(--theme-primary)"
                  : "var(--theme-border)",
                color: "var(--theme-textMuted)",
                boxShadow:
                  "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
              }}
            >
              <Search
                size={16}
                className="shrink-0"
                style={{
                  color: searchOpen
                    ? "var(--theme-primary)"
                    : "var(--theme-textMuted)",
                }}
              />

              <input
                ref={desktopSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search songs, artists..."
                aria-label="Search songs and artists"
                aria-expanded={searchOpen}
                autoComplete="off"
                className="w-full min-w-0 border-none bg-transparent text-[12px] outline-none placeholder:text-[var(--theme-textMuted)]"
                style={{ color: "var(--theme-text)" }}
              />

              {searchLoading ? (
                <Loader2
                  size={15}
                  className="shrink-0 animate-spin"
                  style={{ color: "var(--theme-primary)" }}
                />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="shrink-0 rounded-full p-0.5"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            {searchOpen && renderSearchResultsPanel(false)}
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex shrink-0 items-center gap-2 max-[900px]:gap-1.5 max-[420px]:gap-1">
            {/* THEME SWITCHER: DESKTOP */}
            <div className="hidden shrink-0 items-center justify-center min-[761px]:flex">
              <ThemeSwitcher />
            </div>

            {/* NOTIFICATIONS */}
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((previous) => !previous);
                setMobileMenu(false);
              }}
              aria-label="Notifications"
              aria-expanded={notificationOpen}
              className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300 hover:-translate-y-0.5 max-[760px]:h-[38px] max-[760px]:w-[38px] max-[420px]:h-[34px] max-[420px]:w-[34px]"
              style={iconButtonStyle(notificationOpen)}
            >
              <Bell size={18} />

              {unreadCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    boxShadow: "0 0 12px var(--theme-glowPrimary)",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* PROFILE: DESKTOP */}

            {/* PROFILE: DESKTOP */}
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                setNotificationOpen(false);
                clearSearch();
                navigate("/profile");
              }}
              aria-label="Profile"
              title="Profile"
              className="flex shrink-0 items-center gap-2 rounded-2xl border px-1.5 py-1.5 pr-3 transition-all duration-300 hover:-translate-y-0.5 max-[900px]:p-[5px] max-[760px]:hidden"
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: "var(--theme-border)",
                color: "var(--theme-text)",
                boxShadow:
                  "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
              }}
            >
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] border"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  color: "var(--theme-primary)",
                  borderColor: "var(--theme-border)",
                  boxShadow:
                    "inset 2px 2px 4px var(--theme-shadowDark), inset -2px -2px 4px var(--theme-shadowLight)",
                }}
              >
                <User size={16} />
              </span>

              <span className="text-[13px] font-semibold max-[900px]:hidden">
                Profile
              </span>
            </button>

            {/* THEME SWITCHER: MOBILE ONLY */}
            <div className="flex shrink-0 items-center justify-center min-[761px]:hidden">
              <ThemeSwitcher />
            </div>

            {/* DESKTOP LOGOUT */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300 hover:-translate-y-0.5 max-[760px]:hidden"
              style={iconButtonStyle()}
            >
              <LogOut size={19} />
            </button>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => {
                setMobileMenu((previous) => !previous);
                setNotificationOpen(false);
              }}
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
              className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[14px] border transition-all duration-300 min-[761px]:hidden max-[420px]:h-8.5 max-[420px]:w-8.5"
              style={iconButtonStyle(mobileMenu)}
            >
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* NOTIFICATION PANEL */}
        {notificationOpen && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-[9998] cursor-default"
              onClick={() => setNotificationOpen(false)}
            />

            <div className="relative z-[9999]">
              <NotificationPanel onClose={() => setNotificationOpen(false)} />
            </div>
          </>
        )}

        {/* MOBILE SECONDARY DRAWER */}
        {mobileMenu && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-[101] bg-black/40 min-[761px]:hidden"
              onClick={() => setMobileMenu(false)}
            />

            <div
              className="relative z-[102] mt-3 flex max-h-[min(70vh,620px)] w-full max-w-[620px] flex-col gap-3 overflow-y-auto rounded-[22px] border p-4 animate-[menuDrop_0.25s_ease] min-[761px]:hidden max-[420px]:rounded-[18px] max-[420px]:p-3"
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: "var(--theme-border)",
                boxShadow:
                  "9px 9px 18px var(--theme-shadowDark), -9px -9px 18px var(--theme-shadowLight)",
              }}
            >
              {/* DRAWER HEADER */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="text-sm font-bold tracking-wide"
                    style={{ color: "var(--theme-text)" }}
                  >
                    Explore LYRICS WAYYY
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--theme-textMuted)" }}
                  >
                    Your music, your way.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenu(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                  style={iconButtonStyle()}
                >
                  <X size={18} />
                </button>
              </div>

              {/* MOBILE SEARCH */}
              <div className="relative w-full">
                <div
                  className="flex w-full items-center gap-2 rounded-[14px] border px-3 py-3"
                  style={{
                    backgroundColor: "var(--theme-surface)",
                    borderColor: searchOpen
                      ? "var(--theme-primary)"
                      : "var(--theme-border)",
                    color: "var(--theme-textMuted)",
                    boxShadow:
                      "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
                  }}
                >
                  <Search
                    size={17}
                    className="shrink-0"
                    style={{ color: "var(--theme-primary)" }}
                  />

                  <input
                    ref={mobileSearchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search songs and artists..."
                    aria-label="Search songs and artists"
                    autoComplete="off"
                    className="w-full min-w-0 bg-transparent text-base outline-none"
                    style={{ color: "var(--theme-text)" }}
                  />

                  {searchLoading ? (
                    <Loader2
                      size={16}
                      className="shrink-0 animate-spin"
                      style={{ color: "var(--theme-primary)" }}
                    />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      className="shrink-0"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>

                {searchOpen && renderSearchResultsPanel(true)}
              </div>

              {/* MAIN QUICK LINKS */}
              <div>
                <p
                  className="mb-3 px-1 text-[10px] font-bold tracking-[1.8px]"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  YOUR MUSIC
                </p>

                {isArtist && (
                  <Link
                    to="/artist/dashboard"
                    onClick={() => setMobileMenu(false)}
                    className="flex w-full items-center gap-3 rounded-2xl border p-3 no-underline transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))",
                      borderColor: "var(--theme-border)",
                      color: "#ffffff",
                      boxShadow:
                        "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
                    }}
                  >
                    <Mic2 size={19} />
                    <span className="flex-1 text-sm font-semibold">
                      Artist Studio
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {mobilePrimaryLinks
                    .filter((item) => item.action !== "search")
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActiveRoute(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenu(false)}
                          className="flex min-w-0 items-center gap-3 rounded-2xl border p-3 no-underline transition-all duration-200"
                          style={{
                            backgroundColor: active
                              ? "var(--theme-active)"
                              : "var(--theme-surface)",
                            borderColor: active
                              ? "var(--theme-primary)"
                              : "var(--theme-border)",
                            color: active
                              ? "var(--theme-primary)"
                              : "var(--theme-text)",
                            boxShadow: active
                              ? "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)"
                              : "4px 4px 8px var(--theme-shadowDark), -4px -4px 8px var(--theme-shadowLight)",
                          }}
                        >
                          <Icon size={18} className="shrink-0" />

                          <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                            {item.name}
                          </span>

                          <ChevronRight
                            size={14}
                            className="shrink-0 opacity-50"
                          />
                        </Link>
                      );
                    })}
                </div>
              </div>

              {/* SECONDARY LINKS */}
              <div>
                <p
                  className="mb-3 px-1 text-[10px] font-bold tracking-[1.8px]"
                  style={{ color: "var(--theme-textMuted)" }}
                >
                  EXPLORE
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {mobileSecondaryLinks.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenu(false)}
                        className="flex min-w-0 items-center gap-2 rounded-2xl border p-3 no-underline transition-all duration-200"
                        style={{
                          backgroundColor: active
                            ? "var(--theme-active)"
                            : "var(--theme-surface)",
                          borderColor: active
                            ? "var(--theme-primary)"
                            : "var(--theme-border)",
                          color: active
                            ? "var(--theme-primary)"
                            : "var(--theme-text)",
                          boxShadow: active
                            ? "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)"
                            : "4px 4px 8px var(--theme-shadowDark), -4px -4px 8px var(--theme-shadowLight)",
                        }}
                      >
                        <Icon size={17} className="shrink-0" />

                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                          {item.name}
                        </span>

                        <ChevronRight
                          size={13}
                          className="shrink-0 opacity-50"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* SETTINGS SHORTCUT */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenu(false);
                  navigate("/profile/edit");
                }}
                className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  borderColor: "var(--theme-border)",
                  color: "var(--theme-text)",
                  boxShadow:
                    "4px 4px 8px var(--theme-shadowDark), -4px -4px 8px var(--theme-shadowLight)",
                }}
              >
                <Settings size={18} style={{ color: "var(--theme-primary)" }} />

                <span className="flex-1 text-sm font-semibold">
                  Profile Settings
                </span>

                <ChevronRight size={15} />
              </button>

              {/* LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  borderColor: "var(--theme-border)",
                  color: "var(--theme-text)",
                  boxShadow:
                    "5px 5px 10px var(--theme-shadowDark), -5px -5px 10px var(--theme-shadowLight)",
                }}
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </>
        )}
      </header>

      {/* ==========================================
      PREMIUM MOBILE MUSIC DOCK
  ========================================== */}
      <nav
        aria-label="Mobile navigation"
        className="mobile-music-dock min-[761px]:hidden"
      >
        <div className="mobile-music-dock__inner">
          {mobilePrimaryLinks.map((item) => {
            const Icon = item.icon;

            const active = item.path
              ? isActiveRoute(item.path)
              : mobileMenu && searchOpen;

            return (
              <button
                key={item.name}
                type="button"
                aria-label={item.name}
                aria-current={active && item.path ? "page" : undefined}
                onClick={() => {
                  if (item.action === "search") {
                    setMobileMenu(true);
                    setNotificationOpen(false);
                    setSearchOpen(true);

                    window.setTimeout(() => {
                      mobileSearchInputRef.current?.focus();
                    }, 180);

                    return;
                  }

                  setMobileMenu(false);
                  setSearchOpen(false);
                  setNotificationOpen(false);
                  navigate(item.path);
                }}
                className={`mobile-music-dock__item ${
                  active ? "is-active" : ""
                }`}
                style={{
                  "--dock-accent": "var(--theme-primary)",
                  "--dock-secondary": "var(--theme-secondary)",
                }}
              >
                <span className="mobile-music-dock__icon-wrap">
                  <Icon
                    className="mobile-music-dock__icon"
                    size={21}
                    strokeWidth={active ? 2.5 : 1.8}
                  />

                  {active && (
                    <span
                      className="mobile-music-dock__active-dot"
                      aria-hidden="true"
                    />
                  )}
                </span>

                <span className="mobile-music-dock__label">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`
    .mobile-music-dock {
      position: fixed;
      z-index: 200;
      left: 0;
      right: 0;
      bottom: 0;
      padding:
        10px 12px
        max(10px, env(safe-area-inset-bottom));
      pointer-events: none;
      font-family: 'Inter', sans-serif;
    }

    .mobile-music-dock__inner {
      pointer-events: auto;
      position: relative;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      align-items: center;
      gap: 5px;
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      padding: 9px 8px;
      border: 1px solid var(--theme-border);
      border-radius: 27px;
      background: var(--theme-surface);
      box-shadow:
        0 12px 30px var(--theme-shadowDark),
        0 -2px 12px var(--theme-shadowLight),
        inset 1px 1px 0 var(--theme-shadowLight);
      isolation: isolate;
    }

    .mobile-music-dock__item {
      position: relative;
      display: flex;
      min-width: 0;
      min-height: 58px;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 5px;
      padding: 6px 2px;
      border: 1px solid transparent;
      border-radius: 19px;
      background: transparent;
      color: var(--theme-textMuted);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        color 220ms ease,
        background 220ms ease,
        border-color 220ms ease,
        transform 220ms ease,
        box-shadow 220ms ease;
    }

    .mobile-music-dock__icon-wrap {
      position: relative;
      display: flex;
      width: 34px;
      height: 30px;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 220ms ease;
    }

    .mobile-music-dock__icon {
      transition:
        transform 220ms ease,
        filter 220ms ease;
    }

    .mobile-music-dock__label {
      display: block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
      line-height: 1.2;
      font-weight: 600;
      letter-spacing: 0.05px;
      transition: color 220ms ease;
    }

    .mobile-music-dock__item.is-active {
      color: var(--theme-primary);
      border-color: var(--theme-border);
      background: var(--theme-active);
      box-shadow:
        inset 3px 3px 7px var(--theme-shadowDark),
        inset -3px -3px 7px var(--theme-shadowLight);
    }

    .mobile-music-dock__item.is-active
    .mobile-music-dock__icon-wrap {
      transform: translateY(-1px);
    }

    .mobile-music-dock__item.is-active
    .mobile-music-dock__icon {
      filter: drop-shadow(
        0 0 5px var(--theme-glowPrimary)
      );
    }

    .mobile-music-dock__active-dot {
      position: absolute;
      width: 4px;
      height: 4px;
      bottom: -3px;
      left: 50%;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--theme-primary),
        var(--theme-secondary)
      );
      box-shadow: 0 0 8px var(--theme-glowPrimary);
      transform: translateX(-50%);
    }

    .mobile-music-dock__item:focus-visible {
      outline: 2px solid var(--theme-primary);
      outline-offset: 2px;
    }

    @media (hover: hover) and (pointer: fine) {
      .mobile-music-dock__item:hover {
        color: var(--theme-primary);
      }

      .mobile-music-dock__item:hover
      .mobile-music-dock__icon-wrap {
        transform: translateY(-2px);
      }
    }

    @media (max-width: 380px) {
      .mobile-music-dock {
        padding-left: 8px;
        padding-right: 8px;
      }

      .mobile-music-dock__inner {
        gap: 2px;
        padding: 7px 5px;
        border-radius: 23px;
      }

      .mobile-music-dock__item {
        min-height: 55px;
        border-radius: 16px;
      }

      .mobile-music-dock__label {
        font-size: 9px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .mobile-music-dock__item,
      .mobile-music-dock__icon-wrap,
      .mobile-music-dock__icon,
      .mobile-music-dock__label {
        transition: none !important;
      }
    }
  `}</style>
    </>
  );
};

export default Navbar;
