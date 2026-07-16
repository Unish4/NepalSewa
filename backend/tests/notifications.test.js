import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Notification from "../src/models/Notification.js";

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
const makeAdmin = async (email, jurisdiction) => {
  const { cookie } = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "admin", jurisdiction });
  return cookie;
};

describe("In-app notifications", () => {
  it("creates a notification for the citizen when their issue's status changes", async () => {
    const { cookie: citizenCookie, userId } =
      await registerAndLogin("citizen1@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Notification test issue")
      .field(
        "description",
        "A test issue used to verify in-app notifications fire correctly",
      )
      .field("category", "Road Damage");

    await require("../src/models/Issue.js").default.findByIdAndUpdate(
      createRes.body.issue._id,
      {
        "location.province": "Bagmati Province",
        "location.district": "Kathmandu",
      },
    );

    const ktmAdmin = await makeAdmin("ktmadmin@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    await request(app)
      .patch(`/api/admin/issues/${createRes.body.issue._id}/status`)
      .set("Cookie", ktmAdmin)
      .send({ status: "verified" });

    const notifRes = await request(app)
      .get("/api/notifications")
      .set("Cookie", citizenCookie);
    expect(notifRes.status).toBe(200);
    const statusChange = notifRes.body.notifications.find((n) => n.type === "status_change");
    expect(statusChange).toBeDefined();
    expect(notifRes.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("scopes notifications strictly to the recipient — one user never sees another's", async () => {
    const { cookie: citizenA, userId: idA } =
      await registerAndLogin("citizenA@test.com");
    const { cookie: citizenB } = await registerAndLogin("citizenB@test.com");

    await Notification.create({
      recipient: idA,
      type: "status_change",
      title: "Test",
      message: "For citizen A only",
      link: "/issues/123",
    });

    const resB = await request(app)
      .get("/api/notifications")
      .set("Cookie", citizenB);
    expect(resB.body.notifications.length).toBe(0);

    const resA = await request(app)
      .get("/api/notifications")
      .set("Cookie", citizenA);
    expect(resA.body.notifications.length).toBe(1);
  });

  it("marks a single notification as read, scoped to its owner", async () => {
    const { cookie, userId } = await registerAndLogin("citizen2@test.com");
    const notif = await Notification.create({
      recipient: userId,
      type: "status_change",
      title: "Test",
      message: "Test message",
      link: "/issues/123",
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  it("prevents marking another user's notification as read", async () => {
    const { userId: idA } = await registerAndLogin("citizenC@test.com");
    const { cookie: cookieB } = await registerAndLogin("citizenD@test.com");

    const notif = await Notification.create({
      recipient: idA,
      type: "status_change",
      title: "Test",
      message: "For A only",
      link: "/issues/123",
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set("Cookie", cookieB);
    expect(res.status).toBe(404);
  });

  it("marks all unread notifications as read in one call", async () => {
    const { cookie, userId } = await registerAndLogin("citizen3@test.com");
    await Notification.create([
      {
        recipient: userId,
        type: "status_change",
        title: "A",
        message: "A",
        link: "/a",
      },
      {
        recipient: userId,
        type: "status_change",
        title: "B",
        message: "B",
        link: "/b",
      },
    ]);

    await request(app)
      .patch("/api/notifications/read-all")
      .set("Cookie", cookie);

    const countRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Cookie", cookie);
    expect(countRes.body.unreadCount).toBe(0);
  });

  it("blocks the notifications endpoints entirely without authentication", async () => {
    const getNotifications = await request(app).get("/api/notifications");
    expect(getNotifications.status).toBe(401);

    const getUnreadCount = await request(app).get("/api/notifications/unread-count");
    expect(getUnreadCount.status).toBe(401);

    const patchRead = await request(app).patch("/api/notifications/some-fake-id/read");
    expect(patchRead.status).toBe(401);

    const patchReadAll = await request(app).patch("/api/notifications/read-all");
    expect(patchReadAll.status).toBe(401);
  });
});
