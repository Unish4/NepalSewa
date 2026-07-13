import { WifiOff } from "lucide-react";
import useOfflineStore from "../../store/useOfflineStore.js";

const OfflineBanner = () => {
  const { isOnline, pendingCount } = useOfflineStore();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50
        bg-[#0f172a] text-white text-xs font-medium pl-3 pr-4 py-2
        rounded-full shadow-lg flex items-center gap-2"
    >
      <WifiOff size={13} className="text-amber-400 shrink-0" />
      You're offline
      {pendingCount > 0 && (
        <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
          {pendingCount} queued
        </span>
      )}
    </div>
  );
};

export default OfflineBanner;
