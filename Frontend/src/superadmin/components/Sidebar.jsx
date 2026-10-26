import React from "react";
import {
  LayoutDashboard,
  Mic2,
  Music2,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/superadmin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Artists",
    path: "/superadmin/artist",
    icon: Mic2,
  },
  {
    label: "Music",
    path: "/superadmin/music",
    icon: Music2,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    ["token", "accessToken", "user", "role", "approvalStatus", "isAuthenticated"]
      .forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    navigate("/signin", { replace: true });
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside
      className="
        flex
        min-h-screen
        flex-col
        bg-[#15181d]
        px-4
        py-6
      "
    >
      {/* =========================================
          LOGO
      ========================================= */}
      <div
        className="
          mb-8
          rounded-[24px]
          bg-[#1b2027]
          p-5
          shadow-[8px_8px_16px_#0c0f13,-8px_-8px_16px_#252b34]
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-[#1b2027]
              text-[#8c7cf7]
              shadow-[inset_4px_4px_8px_#0d1014,inset_-4px_-4px_8px_#29303a]
            "
          >
            <ShieldCheck size={23} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-white">
              JOY MUSIC
            </h1>

            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#8c7cf7]">
              Super Admin
            </p>
          </div>
        </div>
      </div>

      {/* =========================================
          NAVIGATION
      ========================================= */}
      <div className="mb-3 px-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Management
        </p>
      </div>

      <nav className="space-y-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavigation(item.path)}
              className={`
                group
                flex
                min-h-[52px]
                w-full
                items-center
                gap-3
                rounded-2xl
                px-4
                text-left
                transition-all
                duration-200

                ${
                  active
                    ? `
                      bg-[#1d2229]
                      text-[#8c7cf7]
                      shadow-[inset_5px_5px_10px_#0d1014,inset_-5px_-5px_10px_#29303a]
                    `
                    : `
                      bg-[#1b2027]
                      text-white/55
                      shadow-[6px_6px_12px_#0c0f13,-6px_-6px_12px_#252b34]
                      hover:text-white
                    `
                }
              `}
            >
              <Icon
                size={20}
                className={
                  active
                    ? "text-[#8c7cf7]"
                    : "text-white/40 group-hover:text-[#8c7cf7]"
                }
              />

              <span className="text-sm font-medium">
                {item.label}
              </span>

              {active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#8c7cf7] shadow-[0_0_10px_#8c7cf7]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* =========================================
          SPACER
      ========================================= */}
      <div className="flex-1" />

      {/* =========================================
          SYSTEM STATUS
      ========================================= */}
      <div
        className="
          mb-4
          rounded-2xl
          bg-[#1b2027]
          p-4
          shadow-[inset_4px_4px_8px_#0d1014,inset_-4px_-4px_8px_#29303a]
        "
      >
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2bd4c4] shadow-[0_0_10px_#2bd4c4]" />

          <div>
            <p className="text-xs font-semibold text-white">
              System Online
            </p>

            <p className="mt-0.5 text-[10px] text-white/35">
              SuperAdmin Control
            </p>
          </div>
        </div>
      </div>

      {/* =========================================
          LOGOUT
      ========================================= */}
      <button
        type="button"
        onClick={handleLogout}
        className="
          flex
          min-h-[50px]
          w-full
          items-center
          gap-3
          rounded-2xl
          bg-[#1b2027]
          px-4
          text-white/45
          shadow-[6px_6px_12px_#0c0f13,-6px_-6px_12px_#252b34]
          transition-all
          duration-200
          hover:text-red-400
          active:shadow-[inset_5px_5px_10px_#0d1014,inset_-5px_-5px_10px_#29303a]
        "
      >
        <LogOut size={19} />

        <span className="text-sm font-medium">
          Logout
        </span>
      </button>
    </aside>
  );
}