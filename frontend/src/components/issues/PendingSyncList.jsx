import { useEffect, useState, useCallback, useRef } from "react";
import { CloudOff, Trash2, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import { getQueuedIssues, removeQueuedIssue } from "../../lib/offlineQueue.js";
import { createIssueRequest } from "../../services/issueService.js";
import useOfflineStore from "../../store/useOfflineStore.js";
import useIssueStore from "../../store/useIssueStore.js";

const mergeSyncedIssue = (issue, state) => ({
  issues: [issue, ...state.issues.filter((current) => current._id !== issue._id)],
  myIssues: [issue, ...state.myIssues.filter((current) => current._id !== issue._id)],
});

const PendingSyncThumbnail = ({ blob }) => {
  const imgRef = useRef(null);

  useEffect(() => {
    if (!blob) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(blob);
    const imgEl = imgRef.current;

    if (imgEl) {
      imgEl.src = objectUrl;
    }

    return () => {
      if (imgEl && imgEl.src === objectUrl) {
        imgEl.src = "";
      }
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  if (!blob) return null;

  return (
    <img
      ref={imgRef}
      alt=""
      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-amber-200"
    />
  );
};

const PendingSyncList = () => {
  const [queued, setQueued] = useState([]);
  const [retryingId, setRetryingId] = useState(null);
  const { isOnline, pendingCount, refreshPendingCount } = useOfflineStore();

  const load = useCallback(async () => {
    const issues = await getQueuedIssues();
    setQueued(issues);
  }, []);

  useEffect(() => {
    let isActive = true;

    (async () => {
      const issues = await getQueuedIssues();
      if (isActive) {
        setQueued(issues);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [pendingCount, load]);

  const handleRetry = async (item) => {
    if (!isOnline) {
      toast.error(
        "You're still offline — this will sync automatically once reconnected.",
      );
      return;
    }
    setRetryingId(item.id);
    try {
      const res = await createIssueRequest({
        ...item.payload,
        idempotencyKey: item.id,
        images: item.images,
      });
      try {
        await removeQueuedIssue(item.id);
      } catch (cleanupErr) {
        console.error(
          "Submitted but failed to clear local queue entry",
          cleanupErr,
        );
      }
      await refreshPendingCount();
      await load();
      useIssueStore.setState((state) => mergeSyncedIssue(res.issue, state));
      toast.success("Report submitted successfully");
    } catch {
      toast.error("Still couldn't submit — will retry automatically later.");
    } finally {
      setRetryingId(null);
    }
  };
  const handleRemove = async (id) => {
    await removeQueuedIssue(id);
    await refreshPendingCount();
    await load();
    toast.success("Draft removed");
  };

  if (queued.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <CloudOff size={15} className="text-amber-500" />
        <h2 className="text-sm font-semibold text-[#0f172a]">
          Waiting to sync ({queued.length})
        </h2>
      </div>

      <div className="space-y-2">
        {queued.map((item) => (
          <div
            key={item.id}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3.5
              flex items-center gap-3"
          >
            <PendingSyncThumbnail blob={item.images?.[0]} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0f172a] truncate">
                {item.payload.title}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {item.images?.length ?? 0} photo
                {item.images?.length !== 1 ? "s" : ""} · Saved offline
              </p>
            </div>
            <button
              onClick={() => handleRetry(item)}
              disabled={retryingId === item.id}
              className="w-8 h-8 rounded-lg bg-white border border-amber-200
                flex items-center justify-center text-amber-600
                hover:bg-amber-100 transition-colors disabled:opacity-50
                shrink-0"
              title="Retry now"
            >
              <RotateCw
                size={13}
                className={retryingId === item.id ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => handleRemove(item.id)}
              className="w-8 h-8 rounded-lg bg-white border border-red-200
                flex items-center justify-center text-red-500
                hover:bg-red-50 transition-colors shrink-0"
              title="Discard draft"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingSyncList;
