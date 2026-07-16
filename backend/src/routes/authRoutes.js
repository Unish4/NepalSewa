import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  getMe,
  logout,
  updatePreferences,
  updateProfile,
  uploadAvatar,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
  getTwoFactorStatus,
  setupTwoFactor,
  verifySetupTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  registerValidator,
  loginValidator,
  updatePreferencesValidator,
  updateProfileValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  twoFactorCodeValidator,
  twoFactorLoginValidator,
  disableTwoFactorValidator,
} from "../utils/validators.js";
import {
  registerArcjet,
  loginArcjet,
  passwordResetArcjet,
} from "../config/arcjet.js";
import { arcjetGuard } from "../middleware/arcjetMiddleware.js";

const router = Router();

const twoFactorLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  skip: () => process.env.NODE_ENV !== "production",
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const tokenOrAccount = req.body?.pendingToken || req.body?.email || "anonymous";
    return `${ip}:${tokenOrAccount}`;
  },
  message: {
    success: false,
    message: "Too many attempts. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  arcjetGuard(registerArcjet, (req) => ({ email: req.body?.email })),
  registerValidator,
  register,
);

router.post("/login", arcjetGuard(loginArcjet), loginValidator, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch(
  "/preferences",
  protect,
  updatePreferencesValidator,
  updatePreferences,
);
router.patch("/profile", protect, updateProfileValidator, updateProfile);
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

router.post(
  "/forgot-password",
  arcjetGuard(passwordResetArcjet),
  forgotPasswordValidator,
  forgotPassword,
);

router.get  ("/2fa/status",       protect, getTwoFactorStatus);
router.post ("/2fa/setup",        protect, setupTwoFactor);
router.post ("/2fa/verify-setup", protect, twoFactorCodeValidator, verifySetupTwoFactor);
router.post ("/2fa/disable",      protect, disableTwoFactorValidator, disableTwoFactor);
router.post ("/2fa/login-verify", twoFactorLimiter, twoFactorLoginValidator, verifyTwoFactorLogin);

router.post("/reset-password/:token", resetPasswordValidator, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post(
  "/resend-verification",
  protect,
  arcjetGuard(passwordResetArcjet),
  resendVerification,
);


export default router;
