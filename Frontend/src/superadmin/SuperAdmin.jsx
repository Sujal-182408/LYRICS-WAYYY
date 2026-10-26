import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import SuperAdminLayout from "./layout/SuperAdminLayout";

import Dashboard from "./dashboard/Dashboard";
import ArtistManagement from "./artist/ArtistManagement";
import MusicManagement from "./music/MusicManagement";

export default function SuperAdmin() {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        {/* /superadmin */}
        <Route
          index
          element={
            <Navigate
              to="/superadmin/dashboard"
              replace
            />
          }
        />

        {/* /superadmin/dashboard */}
        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        {/* /superadmin/artist */}
        <Route
          path="artist"
          element={<ArtistManagement />}
        />

        {/* /superadmin/music */}
        <Route
          path="music"
          element={<MusicManagement />}
        />

        {/* Unknown SuperAdmin route */}
        <Route
          path="*"
          element={
            <Navigate
              to="/superadmin/dashboard"
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
}