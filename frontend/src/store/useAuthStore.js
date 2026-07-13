import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginUser,
  logoutUser,
  registerUser,
  updatePreferencesRequest,
  updateProfileRequest,
  uploadAvatarRequest,
} from "../services/authService.js";
import i18n from "../i18n/index.js";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const res = await registerUser(userData);
          set({ user: res.user, isAuthenticated: true });
          if(res.user?.preferredLanguage) {
            i18n.changeLanguage(res.user.preferredLanguage);
          }
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await loginUser(credentials);
          set({ user: res.user, isAuthenticated: true });
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await logoutUser();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      updatePreferences: async (preferences) => {
        set({ isLoading: true });
        try {
          const res = await updatePreferencesRequest(preferences);
          set((state) => ({
            user: { ...state.user, ...res.user },
          }));
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const res = await updateProfileRequest(profileData);
          set((state) => ({
            user: { ...state.user, ...res.user },
          }));
          return res;
        } finally {
          set({ isLoading: false });
        }
      },

      uploadAvatar: async (file) => {
        set({ isLoading: true });
        try {
          const res = await uploadAvatarRequest(file);
          set((state) => ({
            user: { ...state.user, ...res.user },
          }));
          return res;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "NepalSewa-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
