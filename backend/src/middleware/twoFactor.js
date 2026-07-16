import { TWO_FACTOR_REQUIRED_ROLES } from "../utils/twoFactorConfig.js";

export const requireTwoFactorEnabled = (req, res, next) => {
  if (!TWO_FACTOR_REQUIRED_ROLES.includes(req.user.role)) return next();
  if (req.user.twoFactorEnabled && req.twoFactorVerified) return next();

  return res.status(403).json({
    success: false,
    code: "TWO_FACTOR_SETUP_REQUIRED",
    message:
      "Two-factor authentication is required for your role. Please complete setup before continuing.",
  });
};
