
// =====================================================
// SUPER ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================
//
// SECURITY RULES:
//
// 1. authMiddleware MUST run first.
// 2. Authorization uses req.authUser, populated from
//    the current database user by authMiddleware.
// 3. Never trust req.body.role / req.query.role.
// 4. Never trust only the JWT role.
// 5. Only "superadmin" is allowed.
// 6. No database query is performed here.
// 7. No expensive processing is added.
//
// Performance:
// - Synchronous checks only.
// - No additional MongoDB query.
// - No filesystem access.
// =====================================================

const superAdminMiddleware = (req, res, next) => {
  try {
    // =================================================
    // 1. AUTHENTICATION CHECK
    // =================================================

    if (!req.authUser || !req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // =================================================
    // 2. READ DATABASE USER ROLE
    // =================================================

    const role = String(req.authUser.role || "")
      .trim()
      .toLowerCase();

    // =================================================
    // 3. SUPERADMIN AUTHORIZATION
    // =================================================

    if (role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "SuperAdmin access required.",
      });
    }

    // =================================================
    // 4. ACCOUNT STATUS CHECKS
    // =================================================

    if (req.authUser.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive.",
      });
    }

    if (req.authUser.isSuspended === true) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended.",
      });
    }

    // =================================================
    // 5. MARK REQUEST
    // =================================================

    req.isSuperAdmin = true;

    // =================================================
    // 6. CONTINUE
    // =================================================

    return next();
  } catch (error) {
    console.error(
      "SUPERADMIN AUTHORIZATION ERROR:",
      error?.message || "Unknown authorization error"
    );

    return res.status(500).json({
      success: false,
      message: "Authorization service unavailable.",
    });
  }
};

export default superAdminMiddleware;
