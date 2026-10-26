import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../AuthContext";

// =====================================================
// ALLOWED ROLES
// =====================================================

const VALID_ROLES = ["user", "artist", "superadmin"];

// =====================================================
// NORMALIZE ROLE
// =====================================================

const normalizeRole = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

// =====================================================
// ROLE PROTECTED ROUTE
// =====================================================

const RoleProtectedRoute = ({
  allowedRoles = [],
  children,
}) => {
  const {
    isAuthenticated,
    user,
    role,
  } = useAuth();

  const location = useLocation();

  // ===================================================
  // NORMALIZE CURRENT ROLE
  // ===================================================

  const currentRole = normalizeRole(
    role || user?.role
  );

  // ===================================================
  // NORMALIZE ALLOWED ROLES
  // ===================================================

  const normalizedAllowedRoles =
    Array.isArray(allowedRoles)
      ? allowedRoles.map(
          normalizeRole
        )
      : [];

  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "========================================"
  );

  console.log(
    "ROLE PROTECTED ROUTE"
  );

  console.log(
    "PATH:",
    location.pathname
  );

  console.log(
    "AUTHENTICATED:",
    isAuthenticated
  );

  console.log(
    "AUTH CONTEXT ROLE:",
    role
  );

  console.log(
    "USER ROLE:",
    user?.role
  );

  console.log(
    "FINAL ROLE:",
    currentRole
  );

  console.log(
    "ALLOWED ROLES:",
    normalizedAllowedRoles
  );

  console.log(
    "========================================"
  );

  // ===================================================
  // 1. NOT AUTHENTICATED
  // ===================================================

  if (!isAuthenticated) {
    console.log(
      "❌ ROUTE BLOCKED: NOT AUTHENTICATED"
    );

    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // ===================================================
  // 2. INVALID / MISSING ROLE
  // ===================================================

  if (
    !currentRole ||
    !VALID_ROLES.includes(
      currentRole
    )
  ) {
    console.error(
      "❌ ROUTE BLOCKED: INVALID ROLE",
      {
        role,
        userRole: user?.role,
      }
    );

    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  // ===================================================
  // 3. ROLE NOT ALLOWED
  // ===================================================

  const isAllowed =
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.includes(
      currentRole
    );

  if (!isAllowed) {
    console.log(
      "❌ ROLE NOT ALLOWED:",
      {
        currentRole,
        allowedRoles:
          normalizedAllowedRoles,
        path:
          location.pathname,
      }
    );

    // -------------------------------------------------
    // SUPER ADMIN
    // -------------------------------------------------

    if (
      currentRole ===
      "superadmin"
    ) {
      return (
        <Navigate
          to="/superadmin/dashboard"
          replace
        />
      );
    }

    // -------------------------------------------------
    // ARTIST
    // -------------------------------------------------

    if (
      currentRole === "artist"
    ) {
      return (
        <Navigate
          to="/artist/dashboard"
          replace
        />
      );
    }

    // -------------------------------------------------
    // NORMAL USER
    // -------------------------------------------------

    if (
      currentRole === "user"
    ) {
      return (
        <Navigate
          to="/home"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  // ===================================================
  // 4. AUTHORIZED
  // ===================================================

  console.log(
    "✅ ROLE AUTHORIZED:",
    currentRole
  );

  // ===================================================
  // CHILDREN ROUTE
  // ===================================================

  if (children) {
    return children;
  }

  // ===================================================
  // NESTED ROUTE
  // ===================================================

  return <Outlet />;
};

export default RoleProtectedRoute;