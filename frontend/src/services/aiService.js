import api from "../lib/axios.js";

// POST /api/ai/suggest
// Returns AI category + priority suggestion for a description.
export const fetchAISuggestion = async ({ title = "", description = "" }) => {
  const response = await api.post("/api/ai/suggest", { title, description });
  return response.data;
};

// POST /api/ai/generate-title
export const generateTitleRequest = async ({ description, category = "" }) => {
  const response = await api.post("/api/ai/generate-title", {
    description,
    category,
  });
  return response.data;
};

// POST /api/ai/check-duplicates
export const checkDuplicatesRequest = async (data) => {
  const response = await api.post("/api/ai/check-duplicates", data);
  return response.data;
};
