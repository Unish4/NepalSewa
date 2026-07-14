import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["password_reset", "email_verification"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Speeds up the exact lookup every reset/verify request performs.
verificationTokenSchema.index({ tokenHash: 1, purpose: 1 });

const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema,
);
export default VerificationToken;
