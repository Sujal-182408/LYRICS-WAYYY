import React, { Suspense, lazy, useCallback, useEffect, useRef } from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import Navbar from "./assets/layout/Navbar";
import Footer from "./assets/layout/Footer";
import MusicPlayer from "./assets/components/MusicPlayer";
import WaveScrollbar from "./WaveScrollbar";
import RoleProtectedRoute from "./assets/components/RoleProtectedRoute";

import { usePlayer } from "./context/PlayerContext";
import { BASE_URL } from "./config/api";

// =====================================================
// AUTHENTICATION PAGES
// =====================================================

import Signin from "./assets/layout/Signin";
import Signup from "./assets/layout/Signup";

// =====================================================
// GLOBAL FLOATING BACK BUTTON — LAZY LOADED
// =====================================================

const FloatingBackButton = lazy(
  () => import("./assets/utility/FloatingBackButton"),
);

// =====================================================
// PUBLIC PAGES
// =====================================================

const Hero = lazy(() => import("./assets/components/Hero"));
const About = lazy(() => import("./assets/components/About"));
const Service = lazy(() => import("./assets/components/Service"));
const Production = lazy(() => import("./assets/components/Production"));
const Gallery = lazy(() => import("./assets/components/Gallery"));
const Contact = lazy(() => import("./assets/components/Contact"));

const Suggestions = lazy(() => import("./pages/Suggestions"));

// =====================================================
// USER PAGES
// =====================================================

const Collection = lazy(() => import("./pages/Collection"));

const UserProfile = lazy(() => import("./users/profile/userProfile"));

const EditProfile = lazy(() => import("./users/profile/EditProfile"));

const ListeningHistory = lazy(() => import("./pages/ListeningHistory"));

const Favorites = lazy(() => import("./pages/Favorites"));

const FollowingArtists = lazy(() => import("./pages/FollowingArtists"));

const Playlists = lazy(() => import("./pages/Playlists"));

const PlaylistDetails = lazy(() => import("./pages/PlaylistDetails"));

// =====================================================
// PUBLIC ARTIST PROFILE
// =====================================================

const PublicArtistProfile = lazy(() => import("./pages/ArtistProfile"));

// =====================================================
// ARTIST DASHBOARD
// =====================================================

const ArtistLayout = lazy(() => import("./artist/Layout/ArtistLayout"));

const ArtistDashboard = lazy(
  () => import("./artist/Dashboard/ArtistDashboard"),
);

const ArtistSongs = lazy(() => import("./artist/Songs/Songs"));
const AddSong = lazy(() => import("./artist/Songs/AddSongs"));
const EditSong = lazy(() => import("./artist/Songs/EditSongs"));
const ArtistAlbums = lazy(() => import("./artist/albums/Albums"));

const AddAlbum = lazy(() => import("./artist/albums/AddAlbum"));

const EditAlbum = lazy(() => import("./artist/albums/EditAlbum"));

const ArtistCollections = lazy(
  () => import("./artist/collections/Collections"),
);

const ArtistAnalytics = lazy(() => import("./artist/analytics/Analytics"));

const ArtistProfile = lazy(() => import("./artist/Profile/ArtistProfile"));

const ArtistEditProfile = lazy(() => import("./artist/Profile/EditProfile"));

// =====================================================
// SUPER ADMIN
// =====================================================

const SuperAdmin = lazy(() => import("./superadmin/SuperAdmin"));

// =====================================================
// LOADING FALLBACK
// =====================================================

const PageLoader = () => (
  <div
    className="flex min-h-[40vh] items-center justify-center px-4"
    role="status"
    aria-live="polite"
  >
    <div
      className="
        flex items-center gap-3 rounded-2xl
        border border-(--theme-border)
        bg-(--theme-surface)
        px-5 py-4 text-sm
        text-(--theme-textMuted)
        shadow-[6px_6px_12px_var(--theme-shadow-dark),-6px_-6px_12px_var(--theme-shadow-light)]
      "
    >
      <span
        className="
          h-5 w-5 animate-spin rounded-full
          border-2 border-(--theme-border)
          border-t-(--theme-primary)
        "
        aria-hidden="true"
      />

      <span>Loading...</span>
    </div>
  </div>
);

// =====================================================
// HOME PAGE
//
// Hero appears first.
// Suggestions appear underneath.
// Also handles songs selected from Navbar search.
// =====================================================

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { playSong } = usePlayer();

  const requestSequenceRef = useRef(0);
  const lastProcessedRequestRef = useRef("");

  const searchSongId = location.state?.searchSongId;
  const autoPlaySearchSong = location.state?.autoPlaySearchSong;

  const handleSearchSong = useCallback(async () => {
    if (!searchSongId || !autoPlaySearchSong) {
      return;
    }

    const requestKey = String(searchSongId);

    if (lastProcessedRequestRef.current === requestKey) {
      return;
    }

    lastProcessedRequestRef.current = requestKey;

    const requestSequence = ++requestSequenceRef.current;

    try {
      const apiBase = String(BASE_URL || "").replace(/\/+$/, "");

      const response = await axios.get(
        `${apiBase}/api/songs/${encodeURIComponent(requestKey)}`,
      );

      if (requestSequence !== requestSequenceRef.current) {
        return;
      }

      const payload = response?.data;

      const song =
        payload?.song || payload?.data?.song || payload?.data || payload;

      if (!song || !(song._id || song.id)) {
        throw new Error("The songs API did not return a valid song.");
      }

      const audioFields = [
        "audioFile",
        "audioUrl",
        "audioURL",
        "audio",
        "fileUrl",
        "fileURL",
        "songUrl",
        "songURL",
        "url",
        "src",
      ];

      const hasAudioUrl = audioFields.some(
        (field) =>
          song[field] !== undefined &&
          song[field] !== null &&
          song[field] !== "",
      );

      if (!hasAudioUrl) {
        throw new Error("The selected song does not contain an audio URL.");
      }

      await playSong(song, 0, [song]);
    } catch (error) {
      console.error("Unable to play the selected search result:", error);
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        navigate(location.pathname, {
          replace: true,
          state: null,
        });
      }
    }
  }, [searchSongId, autoPlaySearchSong, playSong, navigate, location.pathname]);

  useEffect(() => {
    handleSearchSong();
  }, [handleSearchSong]);

  return (
    <div className="app-page w-full">
      {/* =================================================
          SECTION 1: HERO
      ================================================= */}

      <section
        id="hero-section"
        aria-label="Welcome to LYRICS WAYYY"
        className="relative w-full"
      >
        <Hero />
      </section>

      {/* =================================================
          SECTION 2: MUSIC SUGGESTIONS
      ================================================= */}

      <section
        id="suggestions-section"
        aria-label="Music suggestions"
        className="
          relative w-full
          scroll-mt-20
          py-8 sm:py-10 lg:py-14
        "
      >
        <Suggestions />
      </section>
    </div>
  );
};

// =====================================================
// PUBLIC INFORMATION PAGES
// =====================================================

const AboutPage = () => <About />;

const ServicePage = () => <Service />;

const ProductionPage = () => <Production />;

const GalleryPage = () => <Gallery />;

const ContactPage = () => <Contact />;

// =====================================================
// PUBLIC WEBSITE LAYOUT
// =====================================================

const PublicLayout = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />

    <main className="pb-24 min-[761px]:pb-0">{children}</main>

    <Footer />
  </div>
);

// =====================================================
// USER APPLICATION LAYOUT
// =====================================================

const MainLayout = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />

    <main>{children}</main>

    <Footer />
  </div>
);

// =====================================================
// GLOBAL PERSISTENT MUSIC PLAYER
// =====================================================

const PersistentMusicPlayer = () => {
  const { pathname } = useLocation();

  const isAuthenticationPage = pathname === "/signin" || pathname === "/signup";

  const isArtistDashboard =
    pathname === "/artist" || pathname.startsWith("/artist/");

  const isSuperAdminPage =
    pathname === "/superadmin" || pathname.startsWith("/superadmin/");

  const shouldHidePlayer =
    isAuthenticationPage || isArtistDashboard || isSuperAdminPage;

  return (
    <div
      id="global-music-player"
      style={{
        display: shouldHidePlayer ? "none" : "block",
      }}
      aria-hidden={shouldHidePlayer}
    >
      <MusicPlayer />
    </div>
  );
};

// =====================================================
// APP
// =====================================================

const App = () => {
  const appRef = useRef(null);
  const frameRef = useRef(null);

  const latestPosition = useRef({
    x: 50,
    y: 50,
  });

  // ===================================================
  // GLOBAL CURSOR SPOTLIGHT
  // ===================================================

  useEffect(() => {
    const element = appRef.current;

    if (!element) {
      return undefined;
    }

    const isTouchDevice = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;

    if (isTouchDevice) {
      return undefined;
    }

    const updateSpotlight = () => {
      frameRef.current = null;

      const { x, y } = latestPosition.current;

      element.style.setProperty("--spot-x", `${x}%`);
      element.style.setProperty("--spot-y", `${y}%`);
    };

    const handleMouseMove = (event) => {
      latestPosition.current = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };

      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateSpotlight);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={appRef}
      className="app-root"
      style={{
        "--spot-x": "50%",
        "--spot-y": "50%",
      }}
    >
      {/* GLOBAL CURSOR SPOTLIGHT */}

      <div className="global-spotlight" aria-hidden="true" />

      {/* =================================================
          GLOBAL FLOATING BACK BUTTON

          Lazy-loaded separately from the main application.
          Rendered outside Routes so it works across pages.
      ================================================= */}

      <Suspense fallback={null}>
        <FloatingBackButton />
      </Suspense>

      {/* =================================================
          APPLICATION ROUTES
      ================================================= */}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ===========================================
              HOME
          =========================================== */}

          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />

          {/* ===========================================
              STANDALONE SUGGESTIONS PAGE
          =========================================== */}

          <Route
            path="/suggestions"
            element={
              <RoleProtectedRoute allowedRoles={["user", "artist"]}>
                <MainLayout>
                  <Suggestions />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              AUTHENTICATION
          =========================================== */}

          <Route path="/signin" element={<Signin />} />

          <Route path="/signup" element={<Signup />} />

          {/* ===========================================
              PUBLIC INFORMATION PAGES
          =========================================== */}

          <Route
            path="/about"
            element={
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            }
          />

          <Route
            path="/service"
            element={
              <PublicLayout>
                <ServicePage />
              </PublicLayout>
            }
          />

          <Route
            path="/productions"
            element={
              <PublicLayout>
                <ProductionPage />
              </PublicLayout>
            }
          />

          <Route
            path="/gallery"
            element={
              <PublicLayout>
                <GalleryPage />
              </PublicLayout>
            }
          />

          <Route
            path="/contact"
            element={
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            }
          />

          {/* ===========================================
              PUBLIC ARTIST PROFILE
          =========================================== */}

          <Route
            path="/artists/:artistId"
            element={
              <MainLayout>
                <PublicArtistProfile />
              </MainLayout>
            }
          />

          {/* ===========================================
              USER COLLECTIONS
          =========================================== */}

          <Route
            path="/collections"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <Collection />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              USER PROFILE
          =========================================== */}

          <Route
            path="/profile"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <UserProfile />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              EDIT PROFILE
          =========================================== */}

          <Route
            path="/profile/edit"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <EditProfile />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/edit-profile"
            element={<Navigate to="/profile/edit" replace />}
          />

          {/* ===========================================
              LISTENING HISTORY
          =========================================== */}

          <Route
            path="/history"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <ListeningHistory />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/profile/listening-history"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <ListeningHistory />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              FAVORITES
          =========================================== */}

          <Route
            path="/favorites"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <Favorites />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              FOLLOWING ARTISTS
          =========================================== */}

          <Route
            path="/following-artists"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <FollowingArtists />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              PLAYLISTS
          =========================================== */}

          <Route
            path="/playlists"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <Playlists />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/playlists/:id"
            element={
              <RoleProtectedRoute allowedRoles={["user"]}>
                <MainLayout>
                  <PlaylistDetails />
                </MainLayout>
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              ARTIST DASHBOARD

              RoleProtectedRoute must render Outlet for
              nested routes when no children are supplied.
          =========================================== */}

          <Route element={<RoleProtectedRoute allowedRoles={["artist"]} />}>
            <Route path="/artist" element={<ArtistLayout />}>
              <Route
                index
                element={<Navigate to="/artist/dashboard" replace />}
              />

              <Route path="dashboard" element={<ArtistDashboard />} />

              <Route path="songs" element={<ArtistSongs />} />

              <Route path="songs/new" element={<AddSong />} />

              <Route path="songs/edit/:id" element={<EditSong />} />

              <Route path="albums" element={<ArtistAlbums />} />

              <Route path="albums/new" element={<AddAlbum />} />

              <Route path="albums/edit/:id" element={<EditAlbum />} />

              <Route path="collections" element={<ArtistCollections />} />

              <Route path="analytics" element={<ArtistAnalytics />} />

              <Route path="profile" element={<ArtistProfile />} />

              <Route path="profile/edit" element={<ArtistEditProfile />} />
            </Route>
          </Route>

          {/* ===========================================
              SUPER ADMIN
          =========================================== */}

          <Route
            path="/superadmin/*"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <SuperAdmin />
              </RoleProtectedRoute>
            }
          />

          {/* ===========================================
              404 FALLBACK
          =========================================== */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* =============================================
          GLOBAL PERSISTENT MUSIC PLAYER
      ============================================= */}

      <PersistentMusicPlayer />

      {/* =============================================
          GLOBAL WAVE SCROLLBAR
      ============================================= */}

      <WaveScrollbar />
    </div>
  );
};

export default App;
