import User from "../models/User.js";
import { BADGE_DEFINITIONS } from "../utils/badgeConfig.js";
import { notify } from "./notificationService.js";
import logger from "../config/logger.js";

export const awardBadgesIfEarned = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      "stats badges isEmailVerified name",
    );
    if (!user) return;

    const existingKeys = new Set((user.badges || []).map((b) => b.key));
    const candidates = BADGE_DEFINITIONS.filter(
      (def) => !existingKeys.has(def.key) && def.check(user.stats || {}, user),
    );
    if (candidates.length === 0) return;

    const newlyEarned = [];
    for (const def of candidates) {
      const awardedAt = new Date();
      const result = await User.updateOne(
        { _id: userId, "badges.key": { $ne: def.key } },
        { $push: { badges: { key: def.key, awardedAt } } },
      );
      if (result.modifiedCount > 0) {
        newlyEarned.push({ key: def.key, label: def.label, awardedAt });
      }
    }
    if (newlyEarned.length === 0) return;
    for (const badge of newlyEarned) {
      notify({
        recipient: userId,
        type: "badge_earned",
        title: "New badge earned!",
        message: `You've earned the "${badge.label}" badge.`,
        link: "/profile",
      }).catch((err) =>
        logger.error({ err, userId }, "Badge notification failed"),
      );
    }
  } catch (err) {
    logger.error({ err, userId }, "Failed to check/award badges");
  }
};
