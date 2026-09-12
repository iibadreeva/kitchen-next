import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/utils/auth-rate-limit", () => ({
  consumeAuthRateLimits: vi.fn(),
  refundAuthRateLimits: vi.fn(),
  grantLoginRateLimitBypassSafe: vi.fn(),
}));

vi.mock("@/utils/client-ip", () => ({
  getClientIp: vi.fn(),
}));

vi.mock("@/utils/password", () => ({
  saltAndHashPassword: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
    },
  },
}));

import { registerUser } from "@/actions/register";
import {
  consumeAuthRateLimits,
  grantLoginRateLimitBypassSafe,
  refundAuthRateLimits,
} from "@/utils/auth-rate-limit";
import { getClientIp } from "@/utils/client-ip";
import { saltAndHashPassword } from "@/utils/password";
import { prisma } from "@/lib/prisma";

const validForm = {
  email: "new@example.com",
  password: "Password1",
  confirmPassword: "Password1",
};

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClientIp).mockResolvedValue("203.0.113.1");
    vi.mocked(consumeAuthRateLimits).mockResolvedValue({ ok: true });
    vi.mocked(refundAuthRateLimits).mockResolvedValue(undefined);
    vi.mocked(grantLoginRateLimitBypassSafe).mockResolvedValue(undefined);
    vi.mocked(saltAndHashPassword).mockResolvedValue("hash");
  });

  it("при неожиданной ошибке БД откатывает rate-limit", async () => {
    vi.mocked(prisma.user.create).mockRejectedValue(new Error("db down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await registerUser(validForm);

    expect(result).toEqual({ error: "Ошибка при регистрации" });
    expect(refundAuthRateLimits).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("при P2002 (email занят) не откатывает rate-limit", async () => {
    vi.mocked(prisma.user.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await registerUser(validForm);

    expect(result).toEqual({
      error:
        "Не удалось зарегистрироваться. Если у вас уже есть аккаунт — войдите.",
    });
    expect(refundAuthRateLimits).not.toHaveBeenCalled();
  });

  it("при успехе не откатывает rate-limit и выдаёт bypass", async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "u1",
      email: "new@example.com",
    } as never);

    const result = await registerUser(validForm);

    expect(result).toEqual({
      ok: true,
      user: { id: "u1", email: "new@example.com" },
    });
    expect(refundAuthRateLimits).not.toHaveBeenCalled();
    expect(grantLoginRateLimitBypassSafe).toHaveBeenCalledWith(
      "new@example.com",
    );
  });

  it("при недоступном rate-limit store возвращает auth_unavailable", async () => {
    vi.mocked(consumeAuthRateLimits).mockRejectedValue(new Error("redis down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await registerUser(validForm);

    expect(result).toEqual({
      error: expect.stringMatching(/временно недоступен/i),
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
