import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function SuperAdminLayout() {
  return (
    <div className="min-h-screen bg-[#15181d] text-white">
      <div className="flex min-h-screen">

        {/* =========================================
            DESKTOP SIDEBAR
        ========================================= */}
        <aside className="hidden w-[270px] shrink-0 lg:block">
          <Sidebar />
        </aside>

        {/* =========================================
            MAIN CONTENT
        ========================================= */}
        <main className="min-w-0 flex-1">

          {/* TOPBAR */}
          <Topbar />

          {/* PAGE CONTENT */}
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
}