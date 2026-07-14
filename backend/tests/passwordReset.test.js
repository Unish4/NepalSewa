import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import VerificationToken from "../src/models/VerificationToken.js";

vi.mock("../src/utils/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(),
  sendVerificationEmail: vi.fn().mockResolvedValue(),
  sendStatusChangeEmail: vi.fn().mockResolvedValue(),
  sendAssignmentEmail: vi.fn().mockResolvedValue(),
}));
import { sendPasswordResetEmail } from "../src/utils/emailService.js";

describe("Password reset flow", () => {
  beforeEach(() => vi.clearAllMocks());

  const user = {
    name: "Test User",
    email: "resetme@test.com",
    password: "password123",
  };

  it("always returns 200 on forgot-password, even for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@test.com" });
    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends a reset email only when the account actually exists", async () => {
    await request(app).post("/api/auth/register").send(user);
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: user.email });
    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid or expired reset token", async () => {
    await request(app).post("/api/auth/register").send(user);
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: user.email });

    const rawToken = sendPasswordResetEmail.mock.calls[0][1];

    // Expire the token by setting its expiresAt in the past
    await VerificationToken.findOneAndUpdate(
      { purpose: "password_reset" },
      { expiresAt: new Date(Date.now() - 10000) },
    );

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: "newpassword123" });
    expect(res.status).toBe(400);
  });

  it("resets the password with a valid token, and the same token cannot be reused", async () => {
    await request(app).post("/api/auth/register").send(user);
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: user.email });

    const rawToken = sendPasswordResetEmail.mock.calls[0][1];

    const resetRes = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: "brandnewpassword" });
    expect(resetRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "brandnewpassword" });
    expect(newLoginRes.status).toBe(200);

    const reuseRes = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: "anotherpassword" });
    expect(reuseRes.status).toBe(400);
  });
});
