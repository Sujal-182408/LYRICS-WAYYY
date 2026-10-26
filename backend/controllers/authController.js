import ArtistApplication from "../models/ArtistApplication.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =====================================================
// CONFIG
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_ACCESS_SECRET;

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  "lyrics-wayyy";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE ||
  "lyrics-wayyy-users";

// =====================================================
// SECURITY CONFIG
// =====================================================

const BCRYPT_ROUNDS = 12;

const MIN_PASSWORD_LENGTH = 8;

// bcrypt effectively processes only the first
// 72 bytes of a password.
// Reject longer passwords instead of silently
// truncating them.
const MAX_PASSWORD_BYTES = 72;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

// Account lock configuration.
//
// 10 failed login attempts temporarily lock
// the account for 15 minutes.
//
// IP-based express-rate-limit remains the
// primary brute-force protection.
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const ACCOUNT_LOCK_MINUTES = 15;

// =====================================================
// DUMMY PASSWORD HASH
// =====================================================
//
// Used when an email does not exist so that login
// attempts still perform bcrypt work.
//
// This reduces timing differences between:
// - email exists
// - email does not exist
//
// This is NOT a real user's password.
//

const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMye" +
  "IjZAgcfl7p92ldGxad68LJZdL17lhWy";

// =====================================================
// ALLOWED ROLES
// =====================================================

const ALLOWED_ROLES = new Set([
  "user",
  "artist",
  "superadmin",
]);

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// SANITIZE USER
// -----------------------------------------------------

const sanitizeUser = (user) => {
  if (!user) return null;

  const obj =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete obj.password;
  delete obj.passwordHash;
  delete obj.tokenVersion;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  delete obj.lastLoginIp;
  delete obj.passwordChangedAt;
  delete obj.__v;

  return obj;
};

// -----------------------------------------------------
// GET USER ID
// -----------------------------------------------------

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.userId ||
    req.user?.user_id ||
    req.authUser?._id ||
    null
  );
};

// -----------------------------------------------------
// GET CLIENT IP
// -----------------------------------------------------

const getClientIp = (req) => {
  return String(req.ip || "")
    .trim()
    .slice(0, 100);
};

// -----------------------------------------------------
// NORMALIZE EMAIL
// -----------------------------------------------------

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

// -----------------------------------------------------
// NORMALIZE NAME
// -----------------------------------------------------

const normalizeName = (name) => {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ");
};

// -----------------------------------------------------
// VALIDATE EMAIL
// -----------------------------------------------------

const isValidEmail = (email) => {
  if (!email) {
    return false;
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

// -----------------------------------------------------
// VALIDATE NAME
// -----------------------------------------------------

const isValidName = (name) => {
  if (!name) {
    return false;
  }

  if (name.length > MAX_NAME_LENGTH) {
    return false;
  }

  return true;
};

// -----------------------------------------------------
// VALIDATE PASSWORD
// -----------------------------------------------------

const validatePassword = (password) => {
  if (typeof password !== "string") {
    return "Password is required.";
  }

  if (!password) {
    return "Password is required.";
  }

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {
    return `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (
    Buffer.byteLength(
      password,
      "utf8"
    ) > MAX_PASSWORD_BYTES
  ) {
    return `Password cannot exceed ${MAX_PASSWORD_BYTES} bytes.`;
  }

  return null;
};

// -----------------------------------------------------
// JWT CONFIGURATION
// -----------------------------------------------------

console.log("JWT CONFIG CHECK:", {
  jwtSecretPresent: Boolean(process.env.JWT_SECRET),
  jwtSecretLength: process.env.JWT_SECRET?.length || 0,
  jwtAccessSecretPresent: Boolean(process.env.JWT_ACCESS_SECRET),
});

const ensureJwtConfiguration = () => {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  if (
    typeof JWT_SECRET !== "string" ||
    JWT_SECRET.length < 32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }
};

// -----------------------------------------------------
// CREATE JWT
// -----------------------------------------------------

const createToken = (user) => {
  ensureJwtConfiguration();

  const role = String(
    user.role || "user"
  )
    .trim()
    .toLowerCase();

  if (!ALLOWED_ROLES.has(role)) {
    throw new Error(
      "Invalid user role."
    );
  }

  const tokenVersion = Number(
    user.tokenVersion || 0
  );

  if (
    !Number.isInteger(tokenVersion) ||
    tokenVersion < 0
  ) {
    throw new Error(
      "Invalid token version."
    );
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role,
      tokenVersion,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    }
  );
};

// =====================================================
// SIGNUP
// =====================================================

export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body || {};

    // -------------------------------------------------
    // NORMALIZE
    // -------------------------------------------------

    const cleanName =
      normalizeName(name);

    const cleanEmail =
      normalizeEmail(email);

    // -------------------------------------------------
    // NAME VALIDATION
    // -------------------------------------------------

    if (!isValidName(cleanName)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid name.",
      });
    }

    // -------------------------------------------------
    // EMAIL VALIDATION
    // -------------------------------------------------

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    // -------------------------------------------------
    // PASSWORD VALIDATION
    // -------------------------------------------------

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // -------------------------------------------------
    // CONFIRM PASSWORD
    // -------------------------------------------------

    if (
      typeof confirmPassword !== "string" ||
      password !== confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    // -------------------------------------------------
    // CHECK EXISTING USER
    // -------------------------------------------------

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      })
        .select("_id")
        .lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(
        password,
        BCRYPT_ROUNDS
      );

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------
    //
    // Public signup ALWAYS creates a normal user.
    //
    // Never accept role from req.body.
    //
    // Artist/admin/superadmin accounts must be created
    // through protected administrative workflows.
    //

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,

      role: "user",

      tokenVersion: 0,

      isActive: true,
      isSuspended: false,

      failedLoginAttempts: 0,
      lockUntil: null,
    });

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "SIGNUP ERROR:",
      error?.message || "Unknown error"
    );

    // MongoDB duplicate key protection.
    // Handles concurrent signup requests.

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create account.",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

export const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    const cleanEmail =
      normalizeEmail(email);

    // -------------------------------------------------
    // INPUT VALIDATION
    // -------------------------------------------------

    if (
      !cleanEmail ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select("+password");

    // -------------------------------------------------
    // ACCOUNT LOCK
    // -------------------------------------------------

    if (user?.lockUntil) {
      const lockUntil =
        new Date(user.lockUntil);

      if (
        Number.isFinite(
          lockUntil.getTime()
        ) &&
        lockUntil.getTime() > Date.now()
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Too many unsuccessful login attempts. Please try again later.",
        });
      }
    }

    // -------------------------------------------------
    // PASSWORD VERIFICATION
    // -------------------------------------------------

    const passwordHash =
      user?.password ||
      DUMMY_PASSWORD_HASH;

    const validPassword =
      await bcrypt.compare(
        password,
        passwordHash
      );

    // -------------------------------------------------
    // INVALID LOGIN
    // -------------------------------------------------

    if (!user || !validPassword) {
      // Increment failed attempts when the account exists.

      if (user) {
        const currentAttempts =
          Number(
            user.failedLoginAttempts || 0
          );

        const nextAttempts =
          currentAttempts + 1;

        const shouldLock =
          nextAttempts >=
          MAX_FAILED_LOGIN_ATTEMPTS;

        const update = {
          $set: {
            failedLoginAttempts:
              shouldLock
                ? MAX_FAILED_LOGIN_ATTEMPTS
                : nextAttempts,
          },
        };

        if (shouldLock) {
          update.$set.lockUntil =
            new Date(
              Date.now() +
                ACCOUNT_LOCK_MINUTES *
                  60 *
                  1000
            );
        }

        await User.updateOne(
          {
            _id: user._id,
          },
          update
        );
      }

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    // -------------------------------------------------
    // ACCOUNT ACTIVE
    // -------------------------------------------------

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    // -------------------------------------------------
    // ACCOUNT SUSPENDED
    // -------------------------------------------------

    if (user.isSuspended === true) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    // -------------------------------------------------
    // ROLE VALIDATION
    // -------------------------------------------------

    const role = String(
      user.role || ""
    )
      .trim()
      .toLowerCase();

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has an invalid role.",
      });
    }

    // -------------------------------------------------
    // ARTIST APPROVAL
    // -------------------------------------------------

    if (role === "artist") {
      let artistApplicationStatus =
        String(
          user.artistApplication?.status || ""
        )
          .trim()
          .toLowerCase();

      // ArtistApplication collection is the source of truth.

      const artistApplication =
        await ArtistApplication.findOne({
          user_id: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .select("status")
          .lean();

      if (artistApplication?.status) {
        artistApplicationStatus =
          String(
            artistApplication.status
          )
            .trim()
            .toLowerCase();
      }

      if (
        artistApplicationStatus !== "approved"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your artist account has not been approved yet.",
        });
      }

      // Synchronize embedded status if required.

      if (
        user.artistApplication &&
        user.artistApplication.status !== "approved"
      ) {
        user.artistApplication.status =
          "approved";
      }
    }

    // -------------------------------------------------
    // RESET LOGIN FAILURE STATE
    // -------------------------------------------------

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // -------------------------------------------------
    // LOGIN INFORMATION
    // -------------------------------------------------

    user.lastLoginAt = new Date();

    const clientIp = getClientIp(req);

    if (clientIp) {
      user.lastLoginIp = clientIp;
    }

    // -------------------------------------------------
    // TOKEN VERSION
    // -------------------------------------------------

    const tokenVersion =
      Number(user.tokenVersion || 0);

    if (
      !Number.isInteger(tokenVersion) ||
      tokenVersion < 0
    ) {
      user.tokenVersion = 0;
    }

    // -------------------------------------------------
    // SAVE LOGIN STATE
    // -------------------------------------------------

    await user.save();

    // -------------------------------------------------
    // CREATE JWT
    // -------------------------------------------------

    const token = createToken(user);

    // -------------------------------------------------
    // SAFE USER
    // -------------------------------------------------

    const safeUser = sanitizeUser(user);

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error?.message || "Unknown error"
    );

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================

export const getMe = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ACCOUNT STATUS
    // -------------------------------------------------

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    if (user.isSuspended === true) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    // -------------------------------------------------
    // ROLE
    // -------------------------------------------------

    const role = String(
      user.role || ""
    )
      .trim()
      .toLowerCase();

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid account role.",
      });
    }

    // -------------------------------------------------
    // ARTIST APPROVAL
    // -------------------------------------------------

    if (role === "artist") {
      const artistApplication =
        await ArtistApplication.findOne({
          user_id: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .select(
            "_id status artist_name"
          )
          .lean();

      const artistApplicationStatus =
        String(
          artistApplication?.status ||
            user.artistApplication?.status ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        artistApplicationStatus !== "approved"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Artist account approval is incomplete.",
          status:
            artistApplicationStatus || "unknown",
        });
      }
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "GET CURRENT USER ERROR:",
      error?.message || "Unknown error"
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve account.",
    });
  }
};

// =====================================================
// UPDATE PROFILE
// =====================================================

export const updateProfile = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ACCOUNT STATUS
    // -------------------------------------------------

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    if (user.isSuspended === true) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    // -------------------------------------------------
    // ALLOWED PROFILE FIELDS
    // -------------------------------------------------

    const allowedFields = [
      "name",
      "bio",
      "phone",
      "gender",
      "dateOfBirth",
      "country",
      "city",
      "website",
    ];

    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    // -------------------------------------------------
    // NAME
    // -------------------------------------------------

    if (req.body?.name !== undefined) {
      const cleanName =
        normalizeName(req.body.name);

      if (!isValidName(cleanName)) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid name.",
        });
      }

      user.name = cleanName;
    }

    // -------------------------------------------------
    // PROFILE IMAGE
    // -------------------------------------------------

    if (req.file) {
      const filename =
        String(
          req.file.filename || ""
        ).trim();

      if (filename) {
        user.profileImage =
          `uploads/profiles/${filename}`;
      }
    }

    // -------------------------------------------------
    // SECURITY
    // -------------------------------------------------
    //
    // These fields are NEVER accepted from req.body:
    //
    // role
    // email
    // password
    // tokenVersion
    // isActive
    // isSuspended
    // suspensionReason
    // artistApplication
    // failedLoginAttempts
    // lockUntil
    // emailVerified
    // permissions
    //

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE ERROR:",
      error?.message || "Unknown error"
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Profile information conflicts with an existing account.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to update profile.",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changePassword = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const {
      currentPassword,
      oldPassword,
      newPassword,
      confirmPassword,
    } = req.body || {};

    const existingPassword =
      typeof currentPassword === "string"
        ? currentPassword
        : oldPassword;

    // -------------------------------------------------
    // CURRENT PASSWORD
    // -------------------------------------------------

    if (
      typeof existingPassword !== "string" ||
      !existingPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is required.",
      });
    }

    // -------------------------------------------------
    // NEW PASSWORD
    // -------------------------------------------------

    const passwordError =
      validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message:
          passwordError.replace(
            "Password",
            "New password"
          ),
      });
    }

    // -------------------------------------------------
    // CONFIRM NEW PASSWORD
    // -------------------------------------------------

    if (
      typeof confirmPassword !== "string" ||
      newPassword !== confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New passwords do not match.",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user =
      await User.findById(userId)
        .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ACCOUNT STATUS
    // -------------------------------------------------

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });
    }

    if (user.isSuspended === true) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    // -------------------------------------------------
    // PASSWORD HASH
    // -------------------------------------------------

    const passwordHash = user.password;

    if (!passwordHash) {
      console.error(
        "CHANGE PASSWORD ERROR: PASSWORD HASH MISSING"
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to change password.",
      });
    }

    // -------------------------------------------------
    // VERIFY CURRENT PASSWORD
    // -------------------------------------------------

    const validPassword =
      await bcrypt.compare(
        existingPassword,
        passwordHash
      );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    // -------------------------------------------------
    // PREVENT PASSWORD REUSE
    // -------------------------------------------------

    const samePassword =
      await bcrypt.compare(
        newPassword,
        passwordHash
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    // -------------------------------------------------
    // HASH NEW PASSWORD
    // -------------------------------------------------

    user.password =
      await bcrypt.hash(
        newPassword,
        BCRYPT_ROUNDS
      );

    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------
    //
    // User.js pre-save hook should handle:
    // - passwordChangedAt
    // - tokenVersion
    //
    // Do not manually increment tokenVersion here
    // if the model hook already handles it.
    //

    await user.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error?.message || "Unknown error"
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to change password.",
    });
  }
};