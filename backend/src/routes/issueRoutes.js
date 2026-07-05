import { Router } from "express";
import {
  createIssue, getIssues, getMyIssues,
  getIssueById, updateIssue, deleteIssue,
} from "../controllers/issueController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createIssueValidator, updateIssueValidator } from "../utils/validators.js";
import { upload } from "../middleware/upload.js";

const router = Router();

//  Non-parameterized routes 
router.get("/",   getIssues);
router.get("/me", protect, getMyIssues);
router.post("/",  protect, upload.array("images", 3), createIssueValidator, createIssue);

//  Parameterized routes 
// PUT sends JSON (no file upload in Phase 7), so no upload middleware here.
router.get    ("/:id", getIssueById);
router.put    ("/:id", protect, updateIssueValidator, updateIssue);
router.delete ("/:id", protect, deleteIssue);

// Phase 8: router.post("/:id/upvote", protect, upvoteIssue);

export default router;