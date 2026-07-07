import { GoogleGenerativeAI } from "@google/generative-ai";
import ENV from "../config/env.js";

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
const TIMEOUT_MS = 10_000;

const VALID_CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Water Issue",
  "Street Light",
  "Illegal Construction",
  "Public Space",
  "Other",
];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

// ── Shared helper
const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini timeout after ${TIMEOUT_MS}ms`)),
        TIMEOUT_MS,
      ),
    ),
  ]);

// ── 1. Categorization
const buildCategorizationPrompt = (title, description) =>
  `
You are an AI assistant for SmartNepal, a civic issue reporting platform in Nepal.
Analyze this citizen report and classify it.

Title: "${title}"
Description: "${description}"

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "category": "<CATEGORY>",
  "priority": "<PRIORITY>",
  "confidence": <NUMBER>
}

CATEGORY must be exactly one of:
"Road Damage" | "Garbage" | "Water Issue" | "Street Light" | "Illegal Construction" | "Public Space" | "Other"

PRIORITY must be exactly one of:
"critical" (immediate safety risk) | "high" (urgent, address within 48h) | "medium" (address within a week) | "low" (minor inconvenience)

confidence: integer 0-100.
`.trim();

export const categorizeIssue = async (title, description) => {
  if (!title?.trim() && !description?.trim()) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await withTimeout(
      model.generateContent(buildCategorizationPrompt(title, description)),
    );
    const raw = result.response.text().trim();
    const clean = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(clean);

    if (
      !VALID_CATEGORIES.includes(parsed.category) ||
      !VALID_PRIORITIES.includes(parsed.priority)
    ) {
      console.error("AI categorization returned invalid values:", parsed);
      return null;
    }
    const rawConfidence = Number(parsed.confidence);
    return {
      category: parsed.category,
      priority: parsed.priority,
      confidence: Math.min(
        100,
        Math.max(
          0,
          Math.round(Number.isFinite(rawConfidence) ? rawConfidence : 80),
        ),
      ),
    };
  } catch (err) {
    console.error(`categorizeIssue failed: ${err.message}`);
    return null;
  }
};

// ── 2. Title generation
const buildTitlePrompt = (description, category) =>
  `
You are an AI assistant for SmartNepal, a civic issue reporting platform in Nepal.
A citizen has described a problem but not provided a clear title.

Description: "${description}"
${category ? `Category: ${category}` : ""}

Generate a concise, professional issue title for a government civic tracker.
Rules:
- Maximum 90 characters
- Be specific about the problem and implied location if mentioned
- Use plain English, no jargon
- Do NOT start with "Issue:", "Problem:", "Report:" or similar prefixes
- Write it as a noun phrase, not a full sentence

Respond with ONLY the title text — no quotes, no punctuation at end, no explanation.
`.trim();

export const generateTitle = async (description, category) => {
  if (!description?.trim()) return null;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await withTimeout(
      model.generateContent(buildTitlePrompt(description, category)),
    );
    const title = result.response
      .text()
      .trim()
      // Strip surrounding quotes Gemini sometimes adds
      .replace(/^["']|["']$/g, "")
      // Hard-cap at 100 chars to match the schema constraint
      .slice(0, 100);

    return title.length >= 5 ? title : null;
  } catch (err) {
    console.error(`generateTitle failed: ${err.message}`);
    return null;
  }
};

// ── 3. Duplicate detection

const buildDuplicatePrompt = (newIssue, candidates) =>
  `
You are analyzing civic issue reports for SmartNepal to detect potential duplicates.

NEW REPORT:
Title: "${newIssue.title}"
Description: "${newIssue.description?.slice(0, 300)}"
Category: ${newIssue.category}

EXISTING REPORTS (check if any describe the same physical problem):
${candidates
  .map(
    (c, i) => `
[${i + 1}] ID: "${c._id}"
Title: "${c.title}"
Description: "${c.description?.slice(0, 200)}"
Status: ${c.status}
`,
  )
  .join("\n")}

Return ONLY a valid JSON array. Include only reports with similarity above 60%.
If none qualify, return an empty array.

[
  {
    "id": "<exact _id string from the list>",
    "similarity": <integer 0-100>,
    "reason": "<one sentence: why this is a likely duplicate>"
  }
]

No markdown, no explanation — only the JSON array.
`.trim();

export const findDuplicates = async (newIssue, candidates) => {
  // No point calling Gemini if heuristics found nothing.
  if (!candidates?.length) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await withTimeout(
      model.generateContent(buildDuplicatePrompt(newIssue, candidates)),
    );
    const raw = result.response.text().trim();
    const clean = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) return [];

    // Validate: only return entries whose id matches a real candidate.
    const validIds = new Set(candidates.map((c) => c._id.toString()));
    return parsed.filter(
      (d) =>
        d.id &&
        validIds.has(d.id.toString()) &&
        typeof d.similarity === "number" &&
        d.similarity >= 60,
    );
  } catch (err) {
    console.error(`findDuplicates failed: ${err.message}`);
    return [];
  }
};
