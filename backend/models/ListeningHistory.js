import mongoose from "mongoose";

const listeningHistorySchema = new mongoose.Schema(
  {
    // User who listened to the song
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Song played during this session
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
      index: true,
    },

    // Artist associated with the song
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      default: null,
      index: true,
    },

    // When the listening session started
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Actual elapsed listening time in seconds.
    // This must not be calculated from the audio seek position.
    listenedSeconds: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "Listening duration must be a finite number.",
      },
    },

    // Full audio duration in seconds
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Most recent audio playback position in seconds
    position: {
      type: Number,
      default: 0,
      min: 0,
    },

    // True only when the audio track actually reaches its end
    completed: {
      type: Boolean,
      default: false,
    },

    // Most recent time the listening session was updated
    lastListenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// User's newest listening sessions
listeningHistorySchema.index({
  user: 1,
  startedAt: -1,
});

// User's listening history for a particular song
listeningHistorySchema.index({
  user: 1,
  song: 1,
  startedAt: -1,
});

// Reuse the existing model if Mongoose has already registered it.
const ListeningHistory =
  mongoose.models.ListeningHistory ||
  mongoose.model("ListeningHistory", listeningHistorySchema);

export default ListeningHistory;