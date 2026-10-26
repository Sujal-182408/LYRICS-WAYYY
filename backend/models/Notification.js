  import mongoose from "mongoose";

  const notificationSchema = new mongoose.Schema(
    {
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "song",
          "album",
          "collection",
          "artist",
          "profile",
          "security",
          "system",
          "announcement",
        ],
        default: "system",
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      message: {
        type: String,
        required: true,
        trim: true,
      },

      icon: {
        type: String,
        default: "bell",
      },

      link: {
        type: String,
        default: "",
      },

      read: {
        type: Boolean,
        default: false,
        index: true,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

  const Notification = mongoose.model("Notification", notificationSchema);

  export default Notification;