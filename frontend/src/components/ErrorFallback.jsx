import { RefreshCw } from "lucide-react";

const ErrorFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
      <RefreshCw size={26} className="text-red-500" />
    </div>
    <h1 className="text-xl font-bold text-[#0f172a] mb-2">
      Something went wrong
    </h1>
    <p className="text-sm text-[#64748b] max-w-sm mb-6">
      We've logged the issue and our team will look into it. Try reloading the
      page.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="h-11 px-6 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm transition-colors"
    >
      Reload page
    </button>
  </div>
);

export default ErrorFallback;
