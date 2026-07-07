import { Router } from "express";
import {
  register,
  login,
  getMe,
  logout,
  updatePreferences,
  updateProfile,
  uploadAvatar,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  registerValidator,
  loginValidator,
  updatePreferencesValidator,
  updateProfileValidator,
} from "../utils/validators.js";

const router = Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.patch(
  "/preferences",
  protect,
  updatePreferencesValidator,
  updatePreferences,
);
router.patch("/profile", protect, updateProfileValidator, updateProfile);
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

export default router;
