import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { getQueuedIssues, removeQueuedIssue } from "../../lib/offlineQueue.js";
import { createIssueRequest } from "../../services/issueService.js";
import useOfflineStore from "../../store/useOfflineStore.js";
import useIssueStore from "../../store/useIssueStore.js";

const mergeSyncedIssue = (issue, state) => ({
  issues: [issue, ...state.issues.filter((current) => current._id !== issue._id)],
  myIssues: [issue, ...state.myIssues.filter((current) => current._id !== issue._id)],
});

const SyncManager = () => {
  const { isOnline, refreshPendingCount } = useOfflineStore();
  const isSyncingRef = useRef(false); // prevents overlapping sync passes

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const queued = await getQueuedIssues();
      if (queued.length === 0) return;

      let successCount = 0;

      for (const item of queued) {
        try {
          const res = await createIssueRequest({
            ...item.payload,
            idempotencyKey: item.id,
            images: item.images,
          });
          await removeQueuedIssue(item.id);
          successCount++;

          useIssueStore.setState((state) => mergeSyncedIssue(res.issue, state));
        } catch (error) {
          console.error(
            `Failed to sync queued issue ${item.id}: ${error.message}`,
          );
        }
      }

      await refreshPendingCount();

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "1 offline report submitted successfully"
            : `${successCount} offline reports submitted successfully`,
        );
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!isOnline) return;

    // Sync immediately when we come online (or on initial mount if
    // already online, catching reports queued in a previous session).
    processQueue();

    // Also retry periodically while online, in case the 'online' browser
    // event didn't fire reliably (this varies across mobile browsers) or
    // a previous sync attempt failed due to a flaky connection.
    const interval = setInterval(
      () => {
        if (useOfflineStore.getState().isOnline) processQueue();
      },
      5 * 60 * 1000,
    ); // every 5 minutes

    return () => clearInterval(interval);
  }, [isOnline, processQueue]);

  return null;
};

export default SyncManager;
