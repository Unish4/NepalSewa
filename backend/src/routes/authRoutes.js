import { Router } from "express";
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
} from "../utils/validators.js";
import {
  registerArcjet,
  loginArcjet,
  passwordResetArcjet,
} from "../config/arcjet.js";
import { arcjetGuard } from "../middleware/arcjetMiddleware.js";

const router = Router();

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
router.post("/reset-password/:token", resetPasswordValidator, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post(
  "/resend-verification",
  protect,
  arcjetGuard(passwordResetArcjet),
  resendVerification,
);
export default router;
