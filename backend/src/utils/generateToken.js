import jwt from "jsonwebtoken";
import ENV from "../config/env.js";
import User from "../models/User.js";

const generateToken = (user, twoFactorVerified = false) => {
  const payload =
    typeof user === "object" && user !== null
      ? { id: user._id, tokenVersion: user.tokenVersion || 0, twoFactorVerified }
      : { id: user, tokenVersion: 0, twoFactorVerified };

  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const generatePendingTwoFactorToken = (userId, tokenVersion = 0) =>
  jwt.sign({ userId, tokenVersion, pending2FA: true }, ENV.JWT_SECRET, { expiresIn: "5m" });

export const verifyPendingTwoFactorToken = async (token) => {
  const payload = jwt.verify(token, ENV.JWT_SECRET);
  if (!payload.pending2FA) throw new Error("Not a valid pending 2FA token");

  const user = await User.findById(payload.userId);
  if (!user) throw new Error("User not found");

  const currentTokenVersion = user.tokenVersion || 0;
  const tokenVersionInToken = payload.tokenVersion || 0;
  if (currentTokenVersion !== tokenVersionInToken) {
    throw new Error("Token version mismatch. Please sign in again.");
  }

  return payload;
};

export default generateToken;
