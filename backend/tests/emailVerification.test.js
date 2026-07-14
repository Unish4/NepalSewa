import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/utils/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(),
  sendVerificationEmail: vi.fn().mockResolvedValue(),
  sendStatusChangeEmail: vi.fn().mockResolvedValue(),
  sendAssignmentEmail: vi.fn().mockResolvedValue(),
}));
import { sendVerificationEmail } from "../src/utils/emailService.js";

describe("Email verification flow", () => {
  beforeEach(() => vi.clearAllMocks());

  const user = {
    name: "Test User",
    email: "verifyme@test.com",
    password: "password123",
  };

  it("creates a new account as unverified and sends a verification email", async () => {
    const res = await request(app).post("/api/auth/register").send(user);
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid verification token", async () => {
    const res = await request(app).get(
      "/api/auth/verify-email/not-a-real-token",
    );
    expect(res.status).toBe(400);
  });

  it("verifies the account with a valid token", async () => {
    await request(app).post("/api/auth/register").send(user);
    const rawToken = sendVerificationEmail.mock.calls[0][1];

    const verifyRes = await request(app).get(
      `/api/auth/verify-email/${rawToken}`,
    );
    expect(verifyRes.status).toBe(200);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });
    const cookie = loginRes.headers["set-cookie"];
    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.body.user.isEmailVerified).toBe(true);
  });

  it("blocks resending verification once already verified", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(user);
    const cookie = registerRes.headers["set-cookie"];
    const rawToken = sendVerificationEmail.mock.calls[0][1];
    await request(app).get(`/api/auth/verify-email/${rawToken}`);

    const resendRes = await request(app)
      .post("/api/auth/resend-verification")
      .set("Cookie", cookie);
    expect(resendRes.status).toBe(400);
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
