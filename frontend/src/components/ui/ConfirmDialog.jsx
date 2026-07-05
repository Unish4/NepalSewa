import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent backdrop — clicking closes the dialog */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div
          className="w-12 h-12 bg-red-50 rounded-full flex items-center
          justify-center mx-auto mb-4"
        >
          <AlertTriangle size={22} className="text-red-500" />
        </div>

        {/* Content */}
        <h2 className="text-base font-semibold text-gray-900 text-center mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
          {description}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm
              font-medium rounded-lg hover:bg-gray-50 transition-colors
              disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium
              rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50
              disabled:cursor-not-allowed"
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
