import api from "../lib/axios.js";

export const registerUser = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};

export const fetchMe = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

export const updatePreferencesRequest = async (preferences) => {
  const response = await api.patch("/api/auth/preferences", preferences);
  return response.data;
};

export const updateProfileRequest = async (profileData) => {
  const response = await api.patch("/api/auth/profile", profileData);
  return response.data;
};

export const uploadAvatarRequest = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post("/api/auth/avatar", formData);
  return response.data;
};

export const forgotPasswordRequest = async (email) => {
  const response = await api.post("/api/auth/forgot-password", { email });
  return response.data;
};

export const resetPasswordRequest = async (token, password) => {
  const response = await api.post(`/api/auth/reset-password/${token}`, {
    password,
  });
  return response.data;
};

export const verifyEmailRequest = async (token) => {
  const response = await api.get(`/api/auth/verify-email/${token}`);
  return response.data;
};

export const resendVerificationRequest = async () => {
  const response = await api.post("/api/auth/resend-verification");
  return response.data;
};
