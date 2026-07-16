import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import useAuthStore from "../../store/useAuthStore.js";
import { requiresTwoFactor } from "../../constants/twoFactor.js";

// Mirrors Phase 25's EmailVerificationBanner — a persistent, non-blocking
// prompt in the layout itself, proactively guiding the user to setup
// rather than making them discover the requirement only after being
// bounced by a 403 on their first admin action.
const TwoFactorRequiredBanner = () => {
  const { user } = useAuthStore();
  if (!user || !requiresTwoFactor(user) || user.twoFactorEnabled) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5 flex-wrap">
        <ShieldAlert size={14} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 flex-1 min-w-50">
          Two-factor authentication is required for your role.
        </p>
        <Link
          to="/security-setup"
          className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          Set up now
        </Link>
      </div>
    </div>
  );
};

export default TwoFactorRequiredBanner;
