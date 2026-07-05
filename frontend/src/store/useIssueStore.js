import { create } from "zustand";
import {
  fetchIssues,
  fetchIssueById,
  fetchMyIssues,
  createIssueRequest,
  updateIssueRequest,
  deleteIssueRequest,
} from "../services/issueService.js";

const useIssueStore = create((set) => ({
  issues: [],
  myIssues: [],
  currentIssue: null,
  pagination: null,
  myIssuesPagination: null,
  isLoading: false,
  error: null,


  getIssues: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchIssues(params);
      set({ issues: res.issues, pagination: res.pagination });
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to load issues" });
    } finally {
      set({ isLoading: false });
    }
  },

  getIssueById: async (id) => {
    set({ isLoading: true, currentIssue: null, error: null });
    try {
      const res = await fetchIssueById(id);
      set({ currentIssue: res.issue });
    } catch (error) {
      set({ error: error.response?.data?.message || "Issue not found" });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches only the logged-in user's reports for MyIssuesPage.
  getMyIssues: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchMyIssues(params);
      set({ myIssues: res.issues, myIssuesPagination: res.pagination });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to load your issues",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createIssue: async (issueData) => {
    set({ isLoading: true });
    try {
      const res = await createIssueRequest(issueData);
      set((state) => ({ issues: [res.issue, ...state.issues] }));
      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  // After a successful update, sync the change into every list that
  // might be holding a stale copy of this issue.
  updateIssue: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await updateIssueRequest(id, data);
      set((state) => ({
        issues: state.issues.map((i) => (i._id === id ? res.issue : i)),
        myIssues: state.myIssues.map((i) => (i._id === id ? res.issue : i)),
        currentIssue:
          state.currentIssue?._id === id ? res.issue : state.currentIssue,
      }));
      return res;
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove the deleted issue from every list immediately so the UI
  // updates without needing a refetch.
  deleteIssue: async (id) => {
    set({ isLoading: true });
    try {
      await deleteIssueRequest(id);
      set((state) => ({
        issues: state.issues.filter((i) => i._id !== id),
        myIssues: state.myIssues.filter((i) => i._id !== id),
        currentIssue:
          state.currentIssue?._id === id ? null : state.currentIssue,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useIssueStore;
