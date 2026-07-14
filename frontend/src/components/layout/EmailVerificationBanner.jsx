import { useState } from "react";
import { MailWarning } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore.js";

// Shown at the top of the citizen Layout when a logged-in user hasn't
// verified their email yet. Deliberately not blocking — verification is
// a trust signal for the municipality, not a gate on the app's core
// value of letting a citizen report a problem quickly.
const EmailVerificationBanner = () => {
  const { user, resendVerification } = useAuthStore();
  const [isSending, setIsSending] = useState(false);

  if (!user || user.isEmailVerified) return null;

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerification();
      toast.success("Verification email sent — check your inbox.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to resend. Try again shortly.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5 flex-wrap">
        <MailWarning size={14} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 flex-1 min-w-50">
          Please verify your email address to confirm your account.
        </p>
        <button
          onClick={handleResend}
          disabled={isSending}
          className="text-xs font-semibold text-amber-700 hover:text-amber-900
            underline underline-offset-2 disabled:opacity-50 transition-colors"
        >
          {isSending ? "Sending…" : "Resend email"}
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
