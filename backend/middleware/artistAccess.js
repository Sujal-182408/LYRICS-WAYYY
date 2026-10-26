
// * ============================================================
// * ARTIST ACCESS MIDDLEWARE
// * ============================================================


const artistAccess = (req, res, next) => {
// ----------------------------------------------------------
// 1. AUTHENTICATION CHECK
// ----------------------------------------------------------

if (!req.user) {
return res.status(401).json({
success: false,
message: "Authentication required.",
});
}

// ----------------------------------------------------------
// 2. NORMALIZE THE USER ROLE
// ----------------------------------------------------------

const role = String(req.user.role || "")
.trim()
.toLowerCase();

// ----------------------------------------------------------
// 3. DEFINE AUTHORIZED ROLES
// ----------------------------------------------------------

const allowedRoles = [
"artist",
"admin",
"superadmin",
"super_admin",
];

// ----------------------------------------------------------
// 4. AUTHORIZATION CHECK
// ----------------------------------------------------------

if (!allowedRoles.includes(role)) {
return res.status(403).json({
success: false,
message: "Artist or administrator access required.",
});
}

// ----------------------------------------------------------
// 5. GRANT ACCESS
// ----------------------------------------------------------

return next();
};

// ============================================================
// ES MODULE EXPORT
// ============================================================

export default artistAccess;
