import mongoose from "mongoose";

const artistApplicationSchema = new mongoose.Schema(
{
// =====================================================
// USER
// =====================================================

    
user_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true,
},

// =====================================================
// ARTIST INFORMATION
// =====================================================

artist_name: {
  type: String,
  required: true,
  trim: true,
  minlength: 2,
  maxlength: 100,
},

genre: {
  type: String,
  required: true,
  trim: true,
  maxlength: 80,
},

description: {
  type: String,
  required: true,
  trim: true,
  minlength: 20,
  maxlength: 2000,
},

// =====================================================
// ARTIST IMAGE
// =====================================================

image_url: {
  type: String,
  required: true,
  trim: true,
  maxlength: 1000,
},

// =====================================================
// SOCIAL / PORTFOLIO
// =====================================================

social_profile_url: {
  type: String,
  required: true,
  trim: true,
  maxlength: 500,
},

// =====================================================
// VERIFICATION SONG
// =====================================================

verification_song_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "VerificationSong",
  required: true,
  index: true,
},

// =====================================================
// APPLICATION STATUS
// =====================================================

status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending",
  index: true,
},

// =====================================================
// SUPERADMIN REVIEW
// =====================================================

admin_note: {
  type: String,
  trim: true,
  maxlength: 2000,
  default: "",
},

reviewed_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
  index: true,
},

reviewed_at: {
  type: Date,
  default: null,
},
    

},
{
timestamps: {
createdAt: "created_at",
updatedAt: "updated_at",
},
}
);

// =====================================================
// ONE PENDING APPLICATION PER USER
// =====================================================

artistApplicationSchema.index(
{
user_id: 1,
status: 1,
},
{
partialFilterExpression: {
status: "pending",
},
unique: true,
}
);

// =====================================================
// SUPERADMIN APPLICATION LIST
// =====================================================

artistApplicationSchema.index({
status: 1,
created_at: -1,
});

// =====================================================
// USER APPLICATION HISTORY
// =====================================================

artistApplicationSchema.index({
user_id: 1,
created_at: -1,
});

// =====================================================
// REVIEW QUEUE
// =====================================================

artistApplicationSchema.index({
status: 1,
reviewed_at: -1,
});

// =====================================================
// EXPORT
// =====================================================

const ArtistApplication =
mongoose.models.ArtistApplication ||
mongoose.model("ArtistApplication", artistApplicationSchema);

export default ArtistApplication;
