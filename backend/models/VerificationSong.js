import mongoose from "mongoose";

// ============================================================
// VERIFICATION SONG SCHEMA
// ============================================================

const verificationSongSchema = new mongoose.Schema(
{
// ----------------------------------------------------------
// USER
// ----------------------------------------------------------

    
user_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: [true, "User is required"],
},

// ----------------------------------------------------------
// ARTIST APPLICATION
// ----------------------------------------------------------

application_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "ArtistApplication",
  default: null,
},

// ----------------------------------------------------------
// FILE INFORMATION
// ----------------------------------------------------------

title: {
  type: String,
  required: [true, "Verification song title is required"],
  trim: true,
  maxlength: [200, "Song title cannot exceed 200 characters"],
},

original_filename: {
  type: String,
  required: [true, "Original filename is required"],
  trim: true,
  maxlength: [255, "Filename cannot exceed 255 characters"],
},

duration: {
  type: Number,
  default: 0,
  min: [0, "Duration cannot be negative"],
},

audio_path: {
  type: String,
  required: [true, "Audio path is required"],
  trim: true,
  maxlength: [1000, "Audio path is too long"],
},

mime_type: {
  type: String,
  required: [true, "MIME type is required"],
  trim: true,
  maxlength: [100, "MIME type is too long"],
},

file_size: {
  type: Number,
  required: [true, "File size is required"],
  min: [1, "File size must be greater than zero"],
},

// ----------------------------------------------------------
// STATUS
// ----------------------------------------------------------

status: {
  type: String,
  enum: {
    values: ["pending", "approved", "rejected"],
    message: "Invalid verification song status",
  },
  default: "pending",
},
    

},
{
timestamps: true,
strict: true,
}
);

// ============================================================
// INDEXES
// ============================================================

// User lookup
verificationSongSchema.index({
user_id: 1,
});

// Application lookup
verificationSongSchema.index({
application_id: 1,
});

// Status filtering
verificationSongSchema.index({
status: 1,
});

// Application + status
verificationSongSchema.index({
application_id: 1,
status: 1,
});

// ============================================================
// EXPORT
// ============================================================

const VerificationSong =
mongoose.models.VerificationSong ||
mongoose.model("VerificationSong", verificationSongSchema);

export default VerificationSong;
