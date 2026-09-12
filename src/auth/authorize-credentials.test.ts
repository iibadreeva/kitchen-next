import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => {
  class CredentialsSignin extends Error {
    code = "credentials";
    constructor() {
      super("CredentialsSignin");
      this.name = "CredentialsSignin";
    }
  }
  return { CredentialsSignin };
});

vi.mock("@/utils/auth-rate-limit", () => ({
  beginLoginRateLimit: vi.fn(),
  recordAuthRateLimitFailure: vi.fn(),
  releaseLoginRateLimitsAfterSuccess: vi.fn(),
}));

vi.mock("@/utils/client-ip", () => ({
  UNKNOWN_IP: "unknown",
  getClientIp: vi.fn(),
}));

vi.mock("@/utils/user", () => ({
  getUserFromDb: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { CredentialsSignin } from "next-auth";
import { authorizeCredentials } from "@/auth/authorize-credentials";
import { beginLoginRateLimit } from "@/utils/auth-rate-limit";
import { getClientIp } from "@/utils/client-ip";
import { getUserFromDb } from "@/utils/user";
import bcryptjs from "bcryptjs";
import { rateLimitedAuthCode } from "@/utils/auth-messages";

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClientIp).mockResolvedValue("203.0.113.1");
  });

  it("при rate-limit сразу бросает CredentialsSignin без DB и bcrypt", async () => {
    vi.mocked(beginLoginRateLimit).mockResolvedValue({
      ok: false,
      retryAfterSec: 42,
      hasBypass: false,
    });

    await expect(
      authorizeCredentials({
        email: "user@example.com",
        password: "Password1",
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(CredentialsSignin);
      expect((error as CredentialsSignin).code).toBe(rateLimitedAuthCode(42));
      return true;
    });

    expect(getUserFromDb).not.toHaveBeenCalled();
    expect(bcryptjs.compare).not.toHaveBeenCalled();
  });
});
