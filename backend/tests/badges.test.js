import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";

vi.mock("../src/utils/uploadToCloudinary.js", () => ({
  uploadToCloudinary: vi
    .fn()
    .mockResolvedValue({
      secure_url: "https://res.cloudinary.com/fake/test.jpg",
    }),
}));
vi.mock("../src/services/aiService.js", () => ({
  categorizeIssue: vi.fn().mockResolvedValue(null),
  generateTitle: vi.fn().mockResolvedValue(null),
  findDuplicates: vi.fn().mockResolvedValue([]),
}));
vi.mock("../src/utils/emailService.js", () => ({
  sendStatusChangeEmail: vi.fn().mockResolvedValue(),
  sendAssignmentEmail: vi.fn().mockResolvedValue(),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(),
  sendVerificationEmail: vi.fn().mockResolvedValue(),
  sendEscalationEmail: vi.fn().mockResolvedValue(),
}));
vi.mock("../src/utils/smsService.js", () => ({
  sendStatusChangeSMS: vi.fn().mockResolvedValue(),
  sendAssignmentSMS: vi.fn().mockResolvedValue(),
  checkSmsBalance: vi.fn().mockResolvedValue(null),
}));

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.user._id };
};

const createIssue = async (cookie) => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", cookie)
    .field("title", "Badge test issue")
    .field(
      "description",
      "A test issue used to verify stats and badge awarding",
    )
    .field("category", "Road Damage");
  return res.body.issue._id;
};

const pollUser = async (userId, conditionFn, timeoutMs = 2000, intervalMs = 30) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const user = await User.findById(userId);
    if (user && conditionFn(user)) {
      return user;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return User.findById(userId);
};

describe("Reputation and badges", () => {
  it("awards first_report after a citizen's first submission", async () => {
    const { cookie, userId } = await registerAndLogin("citizen1@test.com");
    await createIssue(cookie);

    const user = await pollUser(userId, (u) =>
      u.stats?.reportsSubmitted === 1 &&
      u.badges?.some((b) => b.key === "first_report")
    );
    expect(user.stats.reportsSubmitted).toBe(1);
    expect(user.badges.some((b) => b.key === "first_report")).toBe(true);
  });

  it("awards active_reporter only after the fifth report, not before", async () => {
    const { cookie, userId } = await registerAndLogin("citizen2@test.com");
    for (let i = 0; i < 4; i++) await createIssue(cookie);
    
    let user = await pollUser(userId, (u) => u.stats?.reportsSubmitted === 4);
    expect(user.badges.some((b) => b.key === "active_reporter")).toBe(false);

    await createIssue(cookie);

    user = await pollUser(userId, (u) =>
      u.stats?.reportsSubmitted === 5 &&
      u.badges?.some((b) => b.key === "active_reporter")
    );
    expect(user.stats.reportsSubmitted).toBe(5);
    expect(user.badges.some((b) => b.key === "active_reporter")).toBe(true);
  });

  it("awards verified_reporter immediately upon email verification if reports already exist", async () => {
    const { cookie, userId } = await registerAndLogin("citizen3@test.com");
    await createIssue(cookie);

    let user = await pollUser(userId, (u) => u.stats?.reportsSubmitted === 1);
    expect(user.isEmailVerified).toBe(false);
    expect(user.badges.some((b) => b.key === "verified_reporter")).toBe(false);

    // Simulate verification directly (the real flow requires an emailed
    // token; the badge logic itself is what this test targets).
    const { generateRawToken, hashToken } =
      await import("../src/utils/tokenUtils.js");
    const VerificationToken = (
      await import("../src/models/VerificationToken.js")
    ).default;
    const rawToken = generateRawToken();
    await VerificationToken.create({
      user: userId,
      tokenHash: hashToken(rawToken),
      purpose: "email_verification",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await request(app).get(`/api/auth/verify-email/${rawToken}`);

    user = await pollUser(userId, (u) =>
      u.isEmailVerified === true &&
      u.badges?.some((b) => b.key === "verified_reporter")
    );
    expect(user.isEmailVerified).toBe(true);
    expect(user.badges.some((b) => b.key === "verified_reporter")).toBe(true);
  });

  it("awards problem_solver when a citizen's report is resolved by an admin", async () => {
    const { cookie: citizenCookie, userId } =
      await registerAndLogin("citizen4@test.com");
    const issueId = await createIssue(citizenCookie);

    const { default: Issue } = await import("../src/models/Issue.js");
    await Issue.findByIdAndUpdate(issueId, {
      "location.province": "Bagmati Province",
      "location.district": "Kathmandu",
    });

    const { cookie: adminCookie } = await registerAndLogin("admin4@test.com");
    await User.findOneAndUpdate(
      { email: "admin4@test.com" },
      {
        role: "admin",
        jurisdiction: { province: "Bagmati Province", district: "Kathmandu" },
      },
    );

    await request(app)
      .patch(`/api/admin/issues/${issueId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "resolved" });

    const user = await pollUser(userId, (u) =>
      u.stats?.reportsResolved === 1 &&
      u.badges?.some((b) => b.key === "problem_solver")
    );
    expect(user.stats.reportsResolved).toBe(1);
    expect(user.badges.some((b) => b.key === "problem_solver")).toBe(true);
  });

  it("never awards the same badge twice, even after multiple qualifying actions", async () => {
    const { cookie, userId } = await registerAndLogin("citizen5@test.com");
    await createIssue(cookie);
    await pollUser(userId, (u) => u.stats?.reportsSubmitted === 1);
    await createIssue(cookie);
    const user = await pollUser(userId, (u) => u.stats?.reportsSubmitted === 2);

    const firstReportCount = user.badges.filter(
      (b) => b.key === "first_report",
    ).length;
    expect(firstReportCount).toBe(1);
  });

  it("awards engaged_citizen after ten comments", async () => {
    const { cookie: authorCookie } = await registerAndLogin("author5@test.com");
    const issueId = await createIssue(authorCookie);

    const { cookie: commenterCookie, userId } = await registerAndLogin(
      "commenter5@test.com",
    );
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post(`/api/issues/${issueId}/comments`)
        .set("Cookie", commenterCookie)
        .send({ text: `Comment number ${i}` });
    }

    const user = await pollUser(userId, (u) =>
      u.stats?.commentsPosted === 10 &&
      u.badges?.some((b) => b.key === "engaged_citizen")
    );
    expect(user.stats.commentsPosted).toBe(10);
    expect(user.badges.some((b) => b.key === "engaged_citizen")).toBe(true);
  });

  it("returns stats and badges on the logged-in user's own profile via /me", async () => {
    const { cookie, userId } = await registerAndLogin("citizen6@test.com");
    await createIssue(cookie);
    
    await pollUser(userId, (u) => u.stats?.reportsSubmitted === 1);

    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.body.user.stats.reportsSubmitted).toBe(1);
    expect(res.body.user.badges.some((b) => b.key === "first_report")).toBe(
      true,
    );
  });
});
