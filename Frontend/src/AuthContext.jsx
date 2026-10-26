import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEYS = [
  "token",
  "accessToken",
  "user",
  "role",
  "approvalStatus",
  "isAuthenticated",
];

const clearStoredAuth = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

// =====================================================
// ALLOWED ROLES
// =====================================================

const ALLOWED_ROLES = [
  "user",
  "artist",
  "superadmin",
];

// =====================================================
// NORMALIZE ROLE
// =====================================================

const normalizeRole = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

// =====================================================
// GET STORED USER
// =====================================================

const getStoredUser = () => {
  try {
    const rawUser =
      localStorage.getItem("user");

    if (!rawUser) {
      return null;
    }

    const parsedUser =
      JSON.parse(rawUser);

    if (
      !parsedUser ||
      typeof parsedUser !== "object"
    ) {
      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error(
      "❌ Failed to parse stored user:",
      error
    );

    return null;
  }
};

// =====================================================
// GET STORED ROLE
// =====================================================

const getStoredRole = () => {
  const storedRole =
    normalizeRole(
      localStorage.getItem("role")
    );

  if (
    storedRole &&
    ALLOWED_ROLES.includes(storedRole)
  ) {
    return storedRole;
  }

  const user =
    getStoredUser();

  const userRole =
    normalizeRole(user?.role);

  if (
    userRole &&
    ALLOWED_ROLES.includes(userRole)
  ) {
    return userRole;
  }

  return "";
};

// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
  children,
}) => {
  // ===================================================
  // INITIAL AUTHENTICATION
  // ===================================================

  const [isAuthenticated, setIsAuthenticated] =
    useState(() => {
      const token =
        localStorage.getItem("token");

      return Boolean(
        token &&
          token !== "[object Object]"
      );
    });

  // ===================================================
  // INITIAL USER
  // ===================================================

  const [user, setUser] =
    useState(() =>
      getStoredUser()
    );

  // ===================================================
  // INITIAL ROLE
  // ===================================================

  const [role, setRole] =
    useState(() =>
      getStoredRole()
    );

  // Keep React auth state synchronized when an API request receives 401
  // or when the user signs in/out in another browser tab.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredAuth();
      setUser(null);
      setRole("");
      setIsAuthenticated(false);
    };

    const handleStorage = (event) => {
      if (!event || !["token", "user", "role"].includes(event.key)) return;

      const token = localStorage.getItem("token");
      const storedUser = getStoredUser();
      const storedRole = getStoredRole();

      if (!token || !storedUser || !storedRole) {
        setUser(null);
        setRole("");
        setIsAuthenticated(false);
        return;
      }

      setUser({ ...storedUser, role: storedRole });
      setRole(storedRole);
      setIsAuthenticated(token !== "[object Object]");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // ===================================================
  // LOGIN
  // ===================================================

  const login = (
    token = null,
    userData = null
  ) => {
    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "        AUTH CONTEXT LOGIN"
    );
    console.log(
      "========================================"
    );

    // -------------------------------------------------
    // TOKEN
    // -------------------------------------------------

    const finalToken =
      token ||
      localStorage.getItem("token");

    if (
      !finalToken ||
      finalToken === "[object Object]"
    ) {
      console.error(
        "❌ AUTH CONTEXT: INVALID TOKEN",
        finalToken
      );

      setIsAuthenticated(false);
      setUser(null);
      setRole("");

      return false;
    }

    // -------------------------------------------------
    // USER
    // -------------------------------------------------

    const currentUser =
      userData ||
      getStoredUser();

    if (
      !currentUser ||
      typeof currentUser !== "object"
    ) {
      console.error(
        "❌ AUTH CONTEXT: INVALID USER",
        currentUser
      );

      setIsAuthenticated(false);
      setUser(null);
      setRole("");

      return false;
    }

    // -------------------------------------------------
    // ROLE
    // -------------------------------------------------

    const currentRole =
      normalizeRole(
        currentUser?.role
      );

    console.log(
      "AUTH CONTEXT USER:",
      currentUser
    );

    console.log(
      "AUTH CONTEXT ROLE:",
      currentRole
    );

    // -------------------------------------------------
    // ROLE MUST EXIST
    // -------------------------------------------------

    if (!currentRole) {
      console.error(
        "❌ AUTH CONTEXT: USER HAS NO ROLE"
      );

      setIsAuthenticated(false);
      setUser(null);
      setRole("");

      return false;
    }

    // -------------------------------------------------
    // ROLE MUST BE ALLOWED
    // -------------------------------------------------

    if (
      !ALLOWED_ROLES.includes(
        currentRole
      )
    ) {
      console.error(
        "❌ AUTH CONTEXT: INVALID ROLE:",
        currentRole
      );

      setIsAuthenticated(false);
      setUser(null);
      setRole("");

      return false;
    }

    // -------------------------------------------------
    // CREATE CLEAN USER
    // -------------------------------------------------

    const normalizedUser = {
      ...currentUser,
      role: currentRole,
    };

    // -------------------------------------------------
    // SAVE TOKEN
    // -------------------------------------------------

    localStorage.setItem(
      "token",
      finalToken
    );

    // -------------------------------------------------
    // SAVE USER
    // -------------------------------------------------

    localStorage.setItem(
      "user",
      JSON.stringify(
        normalizedUser
      )
    );

    // -------------------------------------------------
    // SAVE ROLE
    // -------------------------------------------------

    localStorage.setItem(
      "role",
      currentRole
    );

    // -------------------------------------------------
    // APPROVAL STATUS
    // -------------------------------------------------

    const approvalStatus =
      normalizeRole(
        normalizedUser?.artistApplicationStatus ||
          normalizedUser?.approvalStatus ||
          normalizedUser?.artistApplication?.status
      );

    if (approvalStatus) {
      localStorage.setItem(
        "approvalStatus",
        approvalStatus
      );
    }

    // -------------------------------------------------
    // UPDATE REACT STATE
    // -------------------------------------------------

    setUser(
      normalizedUser
    );

    setRole(
      currentRole
    );

    setIsAuthenticated(
      true
    );

    console.log(
      "========================================"
    );
    console.log(
      "        AUTH CONTEXT LOGIN SUCCESS"
    );
    console.log(
      "========================================"
    );
    console.log(
      "AUTHENTICATED:",
      true
    );
    console.log(
      "ROLE:",
      currentRole
    );
    console.log(
      "USER:",
      normalizedUser
    );
    console.log(
      "LOCAL STORAGE ROLE:",
      localStorage.getItem(
        "role"
      )
    );
    console.log(
      "========================================"
    );

    return true;
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setRole("");
    setIsAuthenticated(false);
  };

  // ===================================================
  // REFRESH AUTH
  // ===================================================

  const refreshAuth = () => {
    console.log(
      "AUTH CONTEXT: REFRESH AUTH"
    );

    const token =
      localStorage.getItem(
        "token"
      );

    if (
      !token ||
      token === "[object Object]"
    ) {
      console.log(
        "AUTH CONTEXT: NO VALID TOKEN"
      );

      clearStoredAuth();
      setUser(null);
      setRole("");
      setIsAuthenticated(false);

      return false;
    }

    const storedUser =
      getStoredUser();

    if (!storedUser) {
      console.log(
        "AUTH CONTEXT: NO STORED USER"
      );

      clearStoredAuth();
      setUser(null);
      setRole("");
      setIsAuthenticated(false);

      return false;
    }

    const userRole =
      normalizeRole(
        storedUser?.role
      );

    const storedRole =
      normalizeRole(
        localStorage.getItem(
          "role"
        )
      );

    // -------------------------------------------------
    // PREFER USER ROLE
    // -------------------------------------------------

    const finalRole =
      userRole ||
      storedRole;

    if (
      !ALLOWED_ROLES.includes(
        finalRole
      )
    ) {
      console.error(
        "AUTH CONTEXT REFRESH: INVALID ROLE",
        {
          userRole,
          storedRole,
        }
      );

      clearStoredAuth();
      setUser(null);
      setRole("");
      setIsAuthenticated(false);

      return false;
    }

    // -------------------------------------------------
    // KEEP USER + ROLE SYNCHRONIZED
    // -------------------------------------------------

    const normalizedUser = {
      ...storedUser,
      role: finalRole,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(
        normalizedUser
      )
    );

    localStorage.setItem(
      "role",
      finalRole
    );

    // -------------------------------------------------
    // UPDATE STATE
    // -------------------------------------------------

    setUser(
      normalizedUser
    );

    setRole(
      finalRole
    );

    setIsAuthenticated(
      true
    );

    console.log(
      "AUTH CONTEXT REFRESH SUCCESS:",
      {
        authenticated: true,
        role: finalRole,
        userId:
          normalizedUser?._id,
      }
    );

    return true;
  };

  // ===================================================
  // CONTEXT
  // ===================================================

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        role,

        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// USE AUTH
// =====================================================

export const useAuth = () => {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};