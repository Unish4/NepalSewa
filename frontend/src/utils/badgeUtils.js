export const hasBadge = (user, badgeKey) => {
  if (!user || !Array.isArray(user.badges)) return false;
  return user.badges.some((b) => {
    if (typeof b === "string") return b === badgeKey;
    if (b && typeof b === "object") return b.key === badgeKey;
    return false;
  });
};
