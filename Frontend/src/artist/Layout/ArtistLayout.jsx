
import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import ArtistSidebar from "../components/ArtistSidebar";
import FloatingBackButton from "../components/FloatingBackButton";

const ArtistLayout = () => {
  const location = useLocation();

  return (
    <div
      className="relative min-h-screen w-full overflow-x-clip transition-colors duration-300"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      <div className="flex min-h-screen w-full min-w-0">
        {/* Desktop sidebar and mobile navigation */}
        <ArtistSidebar />

        {/* Main content */}
        <main
          className="relative min-h-screen min-w-0 w-full flex-1 transition-colors duration-300"
          style={{
            backgroundColor: "var(--theme-background)",
          }}
        >
          {/* Theme-aware ambient background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute -right-32 -top-32 h-72 w-72 rounded-full blur-3xl"
              style={{
                backgroundColor: "var(--theme-primary)",
                opacity: 0.055,
              }}
            />

            <div
              className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full blur-3xl"
              style={{
                backgroundColor: "var(--theme-secondary)",
                opacity: 0.045,
              }}
            />

            <div
              className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
              style={{
                backgroundColor: "var(--theme-primary)",
                opacity: 0.018,
              }}
            />
          </div>

          {/* Page content */}
          <div
            className="
              relative mx-auto min-h-screen w-full min-w-0 max-w-[1800px]
              px-2 pt-[80px] pb-24
              sm:px-4
              md:px-6 md:py-7
              xl:px-8 xl:py-8
            "
          >
            <div
              key={location.pathname}
              className="min-w-0 animate-in fade-in duration-300"
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Floating back button */}
      <FloatingBackButton />
    </div>
  );
};

export default ArtistLayout;
