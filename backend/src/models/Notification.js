import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "status_change",
        "assignment",
        "escalation",
        "comment",
        "admin_action",
        "badge_earned",
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    link: { type: String },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
