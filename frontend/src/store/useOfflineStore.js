import { create } from "zustand";
import { getQueuedCount } from "../lib/offlineQueue.js";

const useOfflineStore = create((set) => ({
  isOnline: navigator.onLine,
  pendingCount: 0,

  setOnline: (value) => set({ isOnline: value }),

  refreshPendingCount: async () => {
    const count = await getQueuedCount();
    set({ pendingCount: count });
  },
}));

window.addEventListener("online", () =>
  useOfflineStore.getState().setOnline(true),
);
window.addEventListener("offline", () =>
  useOfflineStore.getState().setOnline(false),
);

export default useOfflineStore;
