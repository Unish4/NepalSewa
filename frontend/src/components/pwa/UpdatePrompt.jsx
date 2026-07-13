import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4
        sm:w-80 z-50 bg-[#0f172a] rounded-2xl shadow-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg bg-[#16a34a]/20 flex items-center
          justify-center shrink-0"
        >
          <RefreshCw size={16} className="text-[#4ade80]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-1">
            Update available
          </p>
          <p className="text-xs text-[#94a3b8] mb-3">
            A new version of NepalSewa is ready. Reload to update.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="h-8 px-3 bg-[#16a34a] hover:bg-[#15803d] text-white
                text-xs font-semibold rounded-lg transition-colors"
            >
              Reload
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="h-8 px-3 text-[#94a3b8] hover:text-white text-xs
                font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
