import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Music2,
  Disc3,
  Music,
  BarChart3,
  UserRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AudioLines,
  Settings,
  X,
  SlidersHorizontal,
} from "lucide-react";

import { useAuth } from "../../AuthContext";

const MENU_ITEMS = [
  {
    name: "Dashboard",
    label: "Dashboard",
    path: "/artist/dashboard",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    name: "My Albums",
    label: "Albums",
    path: "/artist/albums",
    icon: Disc3,
    mobile: true,
  },
  {
    name: "My Songs",
    label: "Songs",
    path: "/artist/songs",
    icon: Music2,
    mobile: true,
  },
  {
    name: "Analytics",
    label: "Analytics",
    path: "/artist/analytics",
    icon: BarChart3,
    mobile: true,
  },
  {
    name: "Profile",
    label: "Profile",
    path: "/artist/profile",
    icon: UserRound,
    mobile: true,
  },
  {
    name: "My Collections",
    label: "Collections",
    path: "/artist/collections",
    icon: Music,
    mobile: false,
  },
];

const MOBILE_ITEMS = MENU_ITEMS.filter((item) => item.mobile);

const ArtistSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    setSettingsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    const handleOutsideClick = (event) => {
      if (!(event.target instanceof Element)) return;

      if (
        !event.target.closest("[data-artist-settings]") &&
        !event.target.closest("[data-artist-settings-menu]")
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [settingsOpen]);

  const handleLogout = () => {
    setSettingsOpen(false);
    logout();
    navigate("/signin", { replace: true });
  };

  const sidebarStyle = {
    backgroundColor: "var(--theme-background)",
    color: "var(--theme-text)",
    boxShadow: "8px 0 20px var(--theme-shadowDark)",
    borderRight: "1px solid var(--theme-border)",
  };

  const raisedStyle = {
    backgroundColor: "var(--theme-surface)",
    border: "1px solid var(--theme-border)",
    boxShadow:
      "4px 4px 9px var(--theme-shadowDark), -4px -4px 9px var(--theme-shadowLight)",
  };

  const insetStyle = {
    backgroundColor: "var(--theme-surface)",
    border: "1px solid var(--theme-border)",
    boxShadow:
      "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)",
  };

  const renderNavigationLink = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/artist/dashboard"}
        title={collapsed ? item.name : undefined}
        aria-label={item.name}
        className="group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
        style={({ isActive }) => ({
          backgroundColor: isActive ? "var(--theme-surface)" : "transparent",
          color: isActive ? "var(--theme-primary)" : "var(--theme-textMuted)",
          border: `1px solid ${
            isActive ? "var(--theme-border)" : "transparent"
          }`,
          boxShadow: isActive
            ? "inset 3px 3px 6px var(--theme-shadowDark), inset -3px -3px 6px var(--theme-shadowLight)"
            : "none",
        })}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full"
                style={{
                  background: "var(--theme-gradient)",
                  boxShadow: "0 0 8px var(--theme-glowPrimary)",
                }}
              />
            )}

            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={isActive ? insetStyle : undefined}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.8}
                style={{
                  filter: isActive
                    ? "drop-shadow(0 0 5px var(--theme-glowPrimary))"
                    : "none",
                }}
              />
            </span>

            {!collapsed && (
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.name}
              </span>
            )}

            {!collapsed && isActive && (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: "var(--theme-secondary)",
                  boxShadow: "0 0 7px var(--theme-glowSecondary)",
                }}
              />
            )}
          </>
        )}
      </NavLink>
    );
  };

  const renderMobileLink = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/artist/dashboard"}
        aria-label={item.name}
        className={({ isActive }) =>
          [
            "group relative flex min-w-0 flex-1 flex-col items-center justify-center",
            "gap-1 rounded-2xl px-1 py-2",
            "transition-[color,background-color,box-shadow] duration-200",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--theme-primary)]",
            "active:scale-[0.97]",
            isActive ? "scale-[1.02]" : "",
          ].join(" ")
        }
        style={({ isActive }) => ({
          color: isActive ? "var(--theme-primary)" : "var(--theme-textMuted)",
          background: isActive
            ? "linear-gradient(145deg, var(--theme-background), var(--theme-surface))"
            : "transparent",
          border: `1px solid ${
            isActive ? "var(--theme-border)" : "transparent"
          }`,
          boxShadow: isActive
            ? "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)"
            : "none",
        })}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 top-1 h-8 rounded-full blur-xl"
                style={{
                  background:
                    "linear-gradient(90deg, var(--theme-primary), var(--theme-secondary))",
                  opacity: 0.2,
                }}
              />
            )}

            <span
              className="relative z-10 flex h-9 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:-translate-y-0.5"
              style={{
                backgroundColor: isActive
                  ? "var(--theme-surface)"
                  : "transparent",
                border: `1px solid ${
                  isActive ? "var(--theme-border)" : "transparent"
                }`,
                boxShadow: isActive
                  ? "3px 3px 7px var(--theme-shadowDark), -3px -3px 7px var(--theme-shadowLight)"
                  : "none",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  filter: isActive
                    ? "drop-shadow(0 0 5px var(--theme-glowPrimary))"
                    : "none",
                }}
              />
            </span>

            <span
              className={`relative z-10 w-full truncate text-center text-[10px] leading-tight ${
                isActive ? "font-extrabold" : "font-medium"
              }`}
            >
              {item.label}
            </span>

            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 h-[3px] w-6 rounded-full"
                style={{
                  background: "var(--theme-gradient)",
                  boxShadow: "0 0 10px var(--theme-glowPrimary)",
                }}
              />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}
   <aside
  className="artist-sidebar sticky top-0 z-40 hidden h-screen shrink-0 flex-col overflow-visible md:flex"
  style={{
    ...sidebarStyle,
    width: collapsed ? "80px" : "256px",
  }}
>
    
{/* Brand */}
<div
  className={`relative flex h-20 shrink-0 items-center overflow-hidden ${
    collapsed ? "justify-center px-2" : "justify-start px-4"
  }`}
>
  {/* Expanded logo and title */}
  <div
    className="flex min-w-0 items-center gap-3 whitespace-nowrap"
    style={{
      position: "absolute",
      left: collapsed ? "50%" : "16px",
      transform: collapsed
        ? "translate(-50%, 0) scale(0.92)"
        : "translate(0, 0) scale(1)",
      opacity: collapsed ? 0 : 1,
      transition:
        "left 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease",
      pointerEvents: collapsed ? "none" : "auto",
      willChange: "left, transform, opacity",
    }}
    aria-hidden={collapsed}
  >
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
      style={raisedStyle}
    >
      <img
        src="/LW-64.webp"
        alt="LYRICS WAYYY"
        className="h-full w-full rounded-2xl object-cover"
      />
    </div>

    <h1
      className="truncate text-lg font-extrabold tracking-wide"
      style={{
        background: "var(--theme-gradient)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      LYRICS WAYYY
    </h1>
  </div>

  {/* Collapsed logo — stays mounted */}
  <div
    className="absolute left-1/2 top-1/2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl"
    style={{
      ...raisedStyle,
      transform: collapsed
        ? "translate(-50%, -50%) scale(1)"
        : "translate(-50%, -50%) scale(0.65)",
      opacity: collapsed ? 1 : 0,
      transition:
        "transform 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease",
      pointerEvents: collapsed ? "auto" : "none",
      willChange: "transform, opacity",
    }}
    title="LYRICS WAYYY"
    aria-hidden={!collapsed}
  >
    <img
      src="/LW-64.webp"
      alt=""
      className="h-full w-full rounded-2xl object-cover"
    />
  </div>
</div>


        {/* Floating desktop collapse / expand button */}
        <button
          type="button"
          onClick={() => setCollapsed((previous) => !previous)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute right-0 top-16 z-60 flex h-9 w-9 translate-x-1/2 items-center justify-center rounded-full transition-[transform,background-color,color] duration-300 ease-in-out hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-primary)"
          style={{
            backgroundColor: "var(--theme-surface)",
            color: "var(--theme-primary)",
            border: "1px solid var(--theme-border)",
            boxShadow:
              "4px 4px 10px var(--theme-shadowDark), -3px -3px 8px var(--theme-shadowLight)",
          }}
        >
          {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
        </button>

        {/* Divider */}
        <div className="mx-4 shrink-0 py-1">
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--theme-border), transparent)",
            }}
          />
        </div>

        {/* Desktop navigation */}
        <nav
          aria-label="Artist navigation"
          className="artist-sidebar-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-3"
        >
          {!collapsed && (
            <p
              className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--theme-textMuted)" }}
            >
              Workspace
            </p>
          )}

          {MENU_ITEMS.map(renderNavigationLink)}
        </nav>

        {/* Desktop logout */}
        <div
          className="shrink-0 p-3"
          style={{ borderTop: "1px solid var(--theme-border)" }}
        >
          {!collapsed && (
            <p
              className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--theme-textMuted)" }}
            >
              Account
            </p>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            aria-label="Logout"
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--theme-surface)",
              border: "1px solid var(--theme-border)",
              color: "var(--theme-danger)",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.boxShadow =
                "inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.boxShadow = "none";
            }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "var(--theme-surface)",
                border: "1px solid var(--theme-border)",
              }}
            >
              <LogOut size={18} />
            </span>

            {!collapsed && (
              <span className="text-sm font-semibold">Logout</span>
            )}
          </button>

          {!collapsed && (
            <p
              className="mt-4 text-center text-[10px]"
              style={{ color: "var(--theme-textMuted)" }}
            >
              LYRICS WAYYY
            </p>
          )}
        </div>
      </aside>

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}
      <header
        className="fixed inset-x-0 top-0 z-[100] flex h-[68px] w-full items-center justify-between px-3 sm:px-4 md:hidden"
        style={{
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
          borderBottom: "1px solid var(--theme-border)",
          boxShadow: "0 5px 16px var(--theme-shadowDark)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={raisedStyle}
          >
            <AudioLines
              size={21}
              style={{
                color: "var(--theme-primary)",
                filter: "drop-shadow(0 0 4px var(--theme-glowPrimary))",
              }}
            />
          </div>

          <div className="min-w-0">
            <p
              className="truncate text-sm font-extrabold tracking-wide"
              style={{
                background: "var(--theme-gradient)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              LYRICS WAYYY
            </p>
          </div>
        </div>

        {/* Mobile settings menu */}
        <div className="relative" data-artist-settings>
          <button
            type="button"
            aria-label={
              settingsOpen ? "Close settings menu" : "Open settings menu"
            }
            aria-expanded={settingsOpen}
            aria-haspopup="menu"
            onClick={(event) => {
              event.stopPropagation();
              setSettingsOpen((previous) => !previous);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-95"
            style={{
              ...raisedStyle,
              color: settingsOpen
                ? "var(--theme-primary)"
                : "var(--theme-text)",
            }}
          >
            {settingsOpen ? <X size={20} /> : <Settings size={20} />}
          </button>

          {settingsOpen && (
            <div
              data-artist-settings-menu
              role="menu"
              aria-label="Artist settings and more"
              className="absolute right-0 top-[54px] z-[110] w-[min(84vw,290px)] overflow-hidden rounded-2xl p-3"
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-text)",
                border: "1px solid var(--theme-border)",
                boxShadow:
                  "8px 8px 20px var(--theme-shadowDark), -4px -4px 12px var(--theme-shadowLight)",
              }}
            >
              <div className="mb-3 flex items-center gap-3 px-2 py-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={insetStyle}
                >
                  <SlidersHorizontal
                    size={17}
                    style={{ color: "var(--theme-primary)" }}
                  />
                </span>

                <div>
                  <p className="text-sm font-bold">More options</p>
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: "var(--theme-textMuted)" }}
                  >
                    Artist workspace
                  </p>
                </div>
              </div>

              <div
                className="mb-2 h-px"
                style={{ backgroundColor: "var(--theme-border)" }}
              />

              {MENU_ITEMS.filter((item) => !item.mobile).map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    className="mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors"
                    style={({ isActive }) => ({
                      color: isActive
                        ? "var(--theme-primary)"
                        : "var(--theme-text)",
                      backgroundColor: isActive
                        ? "var(--theme-background)"
                        : "transparent",
                      border: `1px solid ${
                        isActive ? "var(--theme-border)" : "transparent"
                      }`,
                    })}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                );
              })}

              <div
                className="my-2 h-px"
                style={{ backgroundColor: "var(--theme-border)" }}
              />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold"
                style={{ color: "var(--theme-danger)" }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={insetStyle}
                >
                  <LogOut size={17} />
                </span>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          FLOATING MOBILE BOTTOM NAVIGATION
      ====================================================== */}
      <nav
        aria-label="Mobile artist navigation"
        className="fixed inset-x-0 bottom-0 z-[9999] px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden"
        style={{
          pointerEvents: "none",
          isolation: "isolate",
        }}
      >
        <div
          className="relative mx-auto grid w-full max-w-lg grid-cols-5 items-stretch gap-1 overflow-hidden rounded-[26px] px-2 py-2"
          style={{
            pointerEvents: "auto",
            backgroundColor: "var(--theme-surface)",
            color: "var(--theme-text)",
            border: "1px solid var(--theme-border)",
            boxShadow:
              "8px 8px 24px var(--theme-shadowDark), -5px -5px 18px var(--theme-shadowLight), 0 0 24px var(--theme-glowPrimary)",
            WebkitBackdropFilter: "none",
            backdropFilter: "none",
            touchAction: "manipulation",
          }}
        >
          {/* Gradient highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--theme-primary), var(--theme-secondary), transparent)",
            }}
          />

          {MOBILE_ITEMS.map(renderMobileLink)}
        </div>
      </nav>
    </>
  );
};

export default ArtistSidebar;
