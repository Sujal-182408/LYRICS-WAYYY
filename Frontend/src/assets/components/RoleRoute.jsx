import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

const roleRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated } = useAuth();

  const storedUser = localStorage.getItem("user");
  const storedRole = localStorage.getItem("role");

  let user = null;

  try {
    user = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error("Invalid stored user:", error);
  }

  const role = user?.role || storedRole;

  console.log("========== ROLE ROUTE ==========");
  console.log("Authenticated:", isAuthenticated);
  console.log("User:", user);
  console.log("Stored role:", storedRole);
  console.log("Final role:", role);
  console.log("Allowed roles:", allowedRoles);
  console.log("================================");

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Role not allowed
  if (!role || !allowedRoles.includes(role)) {
    if (role === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    }

    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (role === "artist") {
      return <Navigate to="/artist" replace />;
    }

    return <Navigate to="/home" replace />;
  }

  return children;
};

export default roleRoute;