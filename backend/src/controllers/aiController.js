import {
  categorizeIssue,
  generateTitle,
  findDuplicates,
} from "../services/aiService.js";
import Issue from "../models/Issue.js";

// ── POST /api/ai/suggest
export const suggestCategorization = async (req, res, next) => {
  try {
    const { title = "", description = "" } = req.body;

    if (!title.trim() && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Provide a title or description to get an AI suggestion",
        suggestion: null,
      });
    }

    const suggestion = await categorizeIssue(title, description);

    res.status(200).json({
      success: !!suggestion,
      message: suggestion ? undefined : "AI suggestion not available right now",
      suggestion: suggestion ?? null,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/ai/generate-title
export const generateTitleController = async (req, res, next) => {
  try {
    const { description = "", category = "" } = req.body;

    if (!description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please write a description first",
        title: null,
      });
    }

    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message:
          "Description is too short — add more detail for a better title",
        title: null,
      });
    }

    const title = await generateTitle(description, category);

    res.status(200).json({
      success: !!title,
      message: title ? undefined : "Could not generate a title right now",
      title: title ?? null,
    });
  } catch (error) {
    next(error);
  }
};

export const checkDuplicates = async (req, res, next) => {
  try {
    const { title = "", description = "", category, lat, lng } = req.body;

    if (!category || typeof category !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category is required for duplicate detection",
        duplicates: [],
      });
    }

    // ── Build heuristic query
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const query = {
      category,
      // Rejected issues are dead ends — don't suggest them as duplicates.
      status: { $nin: ["rejected"] },
      createdAt: { $gte: thirtyDaysAgo },
    };
    if (lat != null && lng != null) {
      const delta = 0.05;
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        query["location.lat"] = {
          $gte: parsedLat - delta,
          $lte: parsedLat + delta,
        };
        query["location.lng"] = {
          $gte: parsedLng - delta,
          $lte: parsedLng + delta,
        };
      }
    }

    // Fetch up to 8 candidates — enough for meaningful semantic comparison
    // without making the Gemini prompt too large.
    const candidates = await Issue.find(query)
      .select("_id title description status location")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    if (!candidates.length) {
      return res.status(200).json({
        success: true,
        duplicates: [],
        message: "No similar issues found in the area",
      });
    }

    // ── Gemini semantic similarity check
    const matches = await findDuplicates(
      { title, description, category },
      candidates,
    );

    // Enrich the matches with the full candidate data so the frontend
    // can render issue titles and statuses in the warning banner.
    const enriched = matches.map((match) => {
      const full = candidates.find((c) => c._id.toString() === match.id);
      return {
        _id: match.id,
        title: full?.title ?? "Unknown issue",
        status: full?.status ?? "open",
        similarity: match.similarity,
        reason: match.reason,
      };
    });

    res.status(200).json({
      success: true,
      duplicates: enriched,
    });
  } catch (error) {
    next(error);
  }
};
