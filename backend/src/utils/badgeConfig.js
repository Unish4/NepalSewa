export const BADGE_DEFINITIONS = [
  {
    key: "first_report",
    label: "First Report",
    check: (stats) => stats.reportsSubmitted >= 1,
  },
  {
    key: "verified_reporter",
    label: "Verified Reporter",
    check: (stats, user) => user.isEmailVerified && stats.reportsSubmitted >= 1,
  },
  {
    key: "active_reporter",
    label: "Active Reporter",
    check: (stats) => stats.reportsSubmitted >= 5,
  },
  {
    key: "community_pillar",
    label: "Community Pillar",
    check: (stats) => stats.reportsSubmitted >= 20,
  },
  {
    key: "problem_solver",
    label: "Problem Solver",
    check: (stats) => stats.reportsResolved >= 1,
  },
  {
    key: "trusted_voice",
    label: "Trusted Voice",
    check: (stats) => stats.reportsResolved >= 10,
  },
  {
    key: "engaged_citizen",
    label: "Engaged Citizen",
    check: (stats) => stats.commentsPosted >= 10,
  },
  {
    key: "visionary_leader",
    label: "Visionary Leader",
    check: (stats) => stats.reportsSubmitted >= 50,
  },
  {
    key: "civic_champion",
    label: "Civic Champion",
    check: (stats) => stats.reportsResolved >= 50,
  }
];
