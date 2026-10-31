import mongoose from "mongoose";

// =====================================================
// ARTIST APPLICATION SUB-SCHEMA
// =====================================================

const artistApplicationSchema = new mongoose.Schema(
{
status: {
type: String,
enum: ["none", "pending", "approved", "rejected"],
default: "none",
},

   
artistName: {
  type: String,
  trim: true,
  maxlength: 100,
  default: "",
  validate: {
    validator: function (value) {
      if (!value) return true;
      return value.length >= 2;
    },
    message: "Artist name must be at least 2 characters.",
  },
},

bio: {
  type: String,
  trim: true,
  maxlength: 2000,
  default: "",
},

genre: {
  type: String,
  trim: true,
  maxlength: 80,
  default: "",
},

image: {
  type: String,
  trim: true,
  default: "",
},

portfolioUrl: {
  type: String,
  trim: true,
  maxlength: 500,
  default: "",
},

rejectionReason: {
  type: String,
  trim: true,
  maxlength: 2000,
  default: "",
},

submittedAt: {
  type: Date,
  default: null,
},

reviewedAt: {
  type: Date,
  default: null,
},
   

},
{
_id: false,
}
);

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
{
// BASIC INFORMATION
name: {
type: String,
required: [true, "Name is required."],
trim: true,
minlength: [2, "Name must be at least 2 characters."],
maxlength: [100, "Name cannot exceed 100 characters."],
},

   
email: {
  type: String,
  required: [true, "Email is required."],
  unique: true,
  lowercase: true,
  trim: true,
  maxlength: 254,
},

password: {
  type: String,
  required: [true, "Password is required."],
  select: false,
},

// ROLE
role: {
  type: String,
  enum: ["user", "artist", "superadmin"],
  default: "user",
  index: true,
},

// ACCOUNT STATUS
isActive: {
  type: Boolean,
  default: true,
  index: true,
},

isSuspended: {
  type: Boolean,
  default: false,
  index: true,
},

suspensionReason: {
  type: String,
  trim: true,
  maxlength: 500,
  default: "",
},

// PROFILE
profileImage: {
  type: String,
  trim: true,
  default: "",
},

// PREMIUM
isPremium: {
  type: Boolean,
  default: false,
  index: true,
},

// ARTIST APPLICATION
artistApplication: {
  type: artistApplicationSchema,
  default: () => ({
    status: "none",
    artistName: "",
    bio: "",
    genre: "",
    image: "",
    portfolioUrl: "",
    rejectionReason: "",
    submittedAt: null,
    reviewedAt: null,
  }),
},

// SESSION SECURITY
tokenVersion: {
  type: Number,
  default: 0,
  min: 0,
},

// LOGIN SECURITY
failedLoginAttempts: {
  type: Number,
  default: 0,
  min: 0,
},

lockUntil: {
  type: Date,
  default: null,
  index: true,
},

// LOGIN INFORMATION
lastLoginAt: {
  type: Date,
  default: null,
},

lastLoginIp: {
  type: String,
  trim: true,
  maxlength: 100,
  default: "",
},

// PASSWORD SECURITY
passwordChangedAt: {
  type: Date,
  default: null,
},

// PASSWORD RESET
passwordResetToken: {
  type: String,
  default: undefined,
  select: false,
},

passwordResetExpires: {
  type: Date,
  default: undefined,
  select: false,
},

// EMAIL VERIFICATION
emailVerified: {
  type: Boolean,
  default: false,
  index: true,
},

emailVerifiedAt: {
  type: Date,
  default: null,
},


},
{
timestamps: true,

// JSON SECURITY
toJSON: {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.tokenVersion;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    delete ret.lastLoginIp;
    delete ret.passwordChangedAt;

    return ret;
  },
},

// OBJECT SECURITY
toObject: {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.tokenVersion;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    delete ret.lastLoginIp;
    delete ret.passwordChangedAt;

    return ret;
  },
},


}
);

// =====================================================
// DATABASE INDEXES
// =====================================================

userSchema.index({
role: 1,
isActive: 1,
isSuspended: 1,
});

userSchema.index({
"artistApplication.status": 1,
});

// =====================================================
// NORMALIZE USER DATA
// =====================================================

userSchema.pre("validate", function () {
if (this.email) {
this.email = this.email.trim().toLowerCase();
}

if (this.name) {
this.name = this.name.trim().replace(/\s+/g, " ");
}

if (this.artistApplication) {
const application = this.artistApplication;

   
if (application.artistName) {
  application.artistName = application.artistName.trim();
}

if (application.bio) {
  application.bio = application.bio.trim();
}

if (application.genre) {
  application.genre = application.genre.trim();
}

if (application.image) {
  application.image = application.image.trim();
}

if (application.portfolioUrl) {
  application.portfolioUrl = application.portfolioUrl.trim();
}

if (application.rejectionReason) {
  application.rejectionReason =
    application.rejectionReason.trim();
}
   

}
});

// =====================================================
// PASSWORD CHANGE SECURITY
// =====================================================
//
// When an existing user's password changes:
// 1. passwordChangedAt is updated.
// 2. tokenVersion increases.
//
// authMiddleware compares the JWT tokenVersion with
// the current database tokenVersion.
//
// Do not increment tokenVersion manually in
// authController.changePassword().
//

userSchema.pre("save", function () {
if (this.isModified("password") && !this.isNew) {
this.passwordChangedAt = new Date();

   
this.tokenVersion = Number(this.tokenVersion || 0) + 1;
   

}
});

// =====================================================
// EXPORT
// =====================================================

const User =
mongoose.models.User ||
mongoose.model("User", userSchema);

export default User;
