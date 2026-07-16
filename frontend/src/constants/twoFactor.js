export const TWO_FACTOR_REQUIRED_ROLES = [
  "admin",
  "super_admin",
  "field_worker",
];
export const requiresTwoFactor = (user) =>
  TWO_FACTOR_REQUIRED_ROLES.includes(user?.role);
