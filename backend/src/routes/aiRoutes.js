import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  suggestCategorization,
  generateTitleController,
  checkDuplicates,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

const aiLimiterOptions = {
  windowMs: 10 * 60 * 1000,
  message: {
    success: false,
    message: "Too many AI requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?._id?.toString() ?? ipKeyGenerator(req.ip),
};

const createAiLimiter = (max) => rateLimit({ ...aiLimiterOptions, max });

const suggestLimiter = createAiLimiter(15);
const generateTitleLimiter = createAiLimiter(10);
const checkDuplicatesLimiter = createAiLimiter(10);

router.post("/suggest", protect, suggestLimiter, suggestCategorization);
router.post("/generate-title", protect, generateTitleLimiter, generateTitleController); // ← Phase 13
router.post("/check-duplicates", protect, checkDuplicatesLimiter, checkDuplicates); // ← Phase 13

export default router;
