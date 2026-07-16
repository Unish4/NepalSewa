import { Lock } from "lucide-react";
import { BADGE_CONFIG } from "../../constants/badges.js";

// Deliberately shows every badge, earned or not — a locked badge with
// its requirement visible is what makes this function as an actual
// incentive to keep reporting, rather than a passive sticker that only
// appears after the fact with no visible "next goal."
const BadgeGrid = ({ badges = [] }) => {
  const earnedKeys = new Set(badges.map((b) => b.key));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.entries(BADGE_CONFIG).map(([key, cfg]) => {
        const earned = earnedKeys.has(key);
        const Icon = cfg.icon;
        return (
          <div
            key={key}
            className={`rounded-xl border p-3.5 text-center transition-all ${
              earned ? "" : "border-[#e2e8f0] opacity-60"
            }`}
            style={
              earned
                ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}33` }
                : {}
            }
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: earned ? "white" : "#f1f5f9" }}
            >
              {earned ? (
                <Icon size={16} style={{ color: cfg.color }} />
              ) : (
                <Lock size={14} className="text-[#94a3b8]" />
              )}
            </div>
            <p
              className="text-xs font-semibold"
              style={{ color: earned ? cfg.color : "#94a3b8" }}
            >
              {cfg.label}
            </p>
            <p className="text-[10px] text-[#94a3b8] mt-1 leading-snug">
              {cfg.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default BadgeGrid;
