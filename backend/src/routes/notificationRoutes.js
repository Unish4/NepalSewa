import { Router } from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;
