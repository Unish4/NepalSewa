import jwt from "jsonwebtoken";
import ENV from "../config/env.js";

const generateToken = (user) => {
  const payload =
    typeof user === "object" && user !== null
      ? { id: user._id, tokenVersion: user.tokenVersion || 0 }
      : { id: user, tokenVersion: 0 };

  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;
