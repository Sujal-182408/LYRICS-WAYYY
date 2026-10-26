
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import ArtistApplication from "../models/ArtistApplication.js";

// =====================================================
// ALLOWED ROLES
// =====================================================

const ALLOWED_ROLES = new Set([
  "user",
  "artist",
  "superadmin",
]);

// =====================================================
// JWT CONFIGURATION
// =====================================================

const JWT_ISSUER =
  process.env.JWT_ISSUER || "lyrics-wayyy";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE || "lyrics-wayyy-users";

const getJwtSecret = () => {
  const secret =
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET;

  if (
    typeof secret !== "string" ||
    secret.length < 32
  ) {
    throw new Error(
      "JWT_SECRET must be configured and at least 32 characters long."
    );
  }

  return secret;
};

// =====================================================
// STANDARD UNAUTHORIZED RESPONSE
// =====================================================

const unauthorized = (res) => {
  return res.status(401).json({
    success: false,
    message: "Invalid or expired authentication token.",
  });
};

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const authMiddleware = async (req, res, next) => {
  try {
    // -------------------------------------------------
    // 1. Read authorization header
    // -------------------------------------------------

    const authorization = req.headers.authorization;

    if (
      typeof authorization !== "string" ||
      !authorization.toLowerCase().startsWith("bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // 2. Protect against excessively large tokens
    // -------------------------------------------------

    if (token.length > 4096) {
      return unauthorized(res);
    }

    // -------------------------------------------------
    // 3. Get JWT secret
    // -------------------------------------------------

    let JWT_SECRET;

    try {
      JWT_SECRET = getJwtSecret();
    } catch (error) {
      console.error(
        "AUTH CONFIG ERROR:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable.",
      });
    }

    // -------------------------------------------------
    // 4. Verify JWT signature and claims
    // -------------------------------------------------

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    } catch {
      return unauthorized(res);
    }

    // -------------------------------------------------
    // 5. Validate token payload
    // -------------------------------------------------

    if (
      !decoded ||
      typeof decoded !== "object" ||
      Array.isArray(decoded)
    ) {
      return unauthorized(res);
    }

    const userId =
      typeof decoded.id === "string"
        ? decoded.id.trim()
        : "";

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return unauthorized(res);
    }

    // -------------------------------------------------
    // 6. Validate token version
    // -------------------------------------------------

    const tokenVersion = decoded.tokenVersion;

    if (
      !Number.isSafeInteger(tokenVersion) ||
      tokenVersion < 0
    ) {
      return unauthorized(res);
    }

    // -------------------------------------------------
    // 7. Find current user
    // -------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return unauthorized(res);
    }

    // -------------------------------------------------
    // 8. Check account status
    // -------------------------------------------------

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive.",
      });
    }

    if (user.isSuspended === true) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended.",
      });
    }

    // -------------------------------------------------
    // 9. Validate current database role
    // -------------------------------------------------

    const currentRole = String(user.role || "")
      .trim()
      .toLowerCase();

    if (!ALLOWED_ROLES.has(currentRole)) {
      return res.status(403).json({
        success: false,
        message: "Invalid account role.",
      });
    }

    // -------------------------------------------------
    // 10. Check token version against database
    // -------------------------------------------------

    const currentTokenVersion = Number(
      user.tokenVersion ?? 0
    );

    if (
      !Number.isSafeInteger(currentTokenVersion) ||
      currentTokenVersion < 0 ||
      tokenVersion !== currentTokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Your authentication session is no longer valid. Please sign in again.",
      });
    }

    // -------------------------------------------------
    // 11. Check token role against current role
    // -------------------------------------------------

    const tokenRole = String(decoded.role || "")
      .trim()
      .toLowerCase();

    if (
      !ALLOWED_ROLES.has(tokenRole) ||
      tokenRole !== currentRole
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Your authentication session is no longer valid. Please sign in again.",
      });
    }

    // -------------------------------------------------
    // 12. Verify artist approval
    // -------------------------------------------------

    if (currentRole === "artist") {
      const artistApplication =
        await ArtistApplication.findOne({
          user_id: user._id,
        })
          // ArtistApplication.js uses custom timestamps.
          .sort({ created_at: -1 })
          .select("_id status")
          .lean();

      if (!artistApplication) {
        return res.status(403).json({
          success: false,
          message:
            "Artist account approval is incomplete.",
        });
      }

      const status = String(
        artistApplication.status || ""
      )
        .trim()
        .toLowerCase();

      if (status !== "approved") {
        return res.status(403).json({
          success: false,
          message:
            "Artist account approval is incomplete.",
        });
      }
    }

    // -------------------------------------------------
    // 13. Sanitize user data
    // -------------------------------------------------

    const sanitizedUser =
      typeof user.toObject === "function"
        ? user.toObject()
        : { ...user };

    delete sanitizedUser.password;
    delete sanitizedUser.passwordHash;
    delete sanitizedUser.tokenVersion;
    delete sanitizedUser.failedLoginAttempts;
    delete sanitizedUser.lockUntil;
    delete sanitizedUser.lastLoginIp;
    delete sanitizedUser.passwordChangedAt;

    // -------------------------------------------------
    // 14. Attach authentication context
    // -------------------------------------------------

    req.user = sanitizedUser;

    // Keep the Mongoose document available to controllers
    // that intentionally need to update the authenticated user.
    req.authUser = user;

    req.auth = {
      userId: String(user._id),
      role: currentRole,
    };

    // -------------------------------------------------
    // 15. Continue to the next middleware/controller
    // -------------------------------------------------

    return next();
  } catch (error) {
    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Authentication service unavailable.",
    });
  }
};

export default authMiddleware;

