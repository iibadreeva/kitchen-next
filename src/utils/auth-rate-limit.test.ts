import { afterEach, describe, expect, it, vi } from "vitest";

import { UNKNOWN_IP } from "@/utils/client-ip";
import {
  beginLoginRateLimit,
  consumeAuthRateLimits,
  grantLoginRateLimitBypass,
  grantLoginRateLimitBypassSafe,
  hasLoginRateLimitBypass,
  peekAuthRateLimits,
  recordAuthRateLimitFailure,
  refundAuthRateLimits,
  refundAuthRateLimitsSafe,
  releaseLoginRateLimitsAfterSuccess,
  takeLoginRateLimitBypass,
  takeLoginRateLimitBypassSafe,
  __resetRateLimitBucketsForTests,
} from "@/utils/auth-rate-limit";
import {
  getRateLimitStore,
  __setRateLimitStoreForTests,
} from "@/utils/rate-limit-store";

describe("authRateLimits", () => {
  afterEach(async () => {
    await __resetRateLimitBucketsForTests();
  });

  it("при неизвестном IP лимит только по email (нет общего soft-cap)", async () => {
    const windowMs = 60_000;
    const limit = 1;

    for (let i = 0; i < 40; i++) {
      const result = await consumeAuthRateLimits({
        action: "login",
        ip: UNKNOWN_IP,
        email: `user${i}@example.com`,
        limit,
        windowMs,
      });
      expect(result.ok).toBe(true);
    }

    const sameEmailBlocked = await consumeAuthRateLimits({
      action: "login",
      ip: UNKNOWN_IP,
      email: "user0@example.com",
      limit,
      windowMs,
    });
    expect(sameEmailBlocked.ok).toBe(false);
  });

  it("при неизвестном IP register тоже только по email", async () => {
    const windowMs = 60_000;
    const limit = 1;

    for (let i = 0; i < 35; i++) {
      expect(
        (
          await consumeAuthRateLimits({
            action: "register",
            ip: UNKNOWN_IP,
            email: `ok${i}@example.com`,
            limit,
            windowMs,
          })
        ).ok,
      ).toBe(true);
    }
  });

  it("peek не расходует лимит; record — расходует", async () => {
    const email = "same@example.com";
    const base = {
      action: "login" as const,
      ip: UNKNOWN_IP,
      email,
      limit: 3,
      windowMs: 60_000,
    };

    for (let i = 0; i < 5; i++) {
      expect((await peekAuthRateLimits(base)).ok).toBe(true);
    }

    for (let i = 0; i < 3; i++) {
      await recordAuthRateLimitFailure(base);
    }

    const blocked = await peekAuthRateLimits(base);
    expect(blocked.ok).toBe(false);
  });

  it("ограничивает по известному IP при consume", async () => {
    const ip = "203.0.113.10";

    for (let i = 0; i < 3; i++) {
      expect(
        (
          await consumeAuthRateLimits({
            action: "login",
            ip,
            email: `a${i}@example.com`,
            limit: 3,
            windowMs: 60_000,
          })
        ).ok,
      ).toBe(true);
    }

    const blocked = await consumeAuthRateLimits({
      action: "login",
      ip,
      email: "other@example.com",
      limit: 3,
      windowMs: 60_000,
    });

    expect(blocked.ok).toBe(false);
  });

  it("при блоке по IP откатывает email-бакет", async () => {
    const ip = "203.0.113.50";
    const limit = 1;
    const windowMs = 60_000;

    expect(
      (
        await consumeAuthRateLimits({
          action: "login",
          ip,
          email: "first@example.com",
          limit,
          windowMs,
        })
      ).ok,
    ).toBe(true);

    const blocked = await consumeAuthRateLimits({
      action: "login",
      ip,
      email: "second@example.com",
      limit,
      windowMs,
    });
    expect(blocked.ok).toBe(false);

    // email second не должен остаться «сожжённым» после отката
    expect(
      (
        await consumeAuthRateLimits({
          action: "login",
          ip: "198.51.100.10",
          email: "second@example.com",
          limit,
          windowMs,
        })
      ).ok,
    ).toBe(true);
  });

  it("refund возвращает слот после успешного login-reserve", async () => {
    const base = {
      action: "login" as const,
      ip: UNKNOWN_IP,
      email: "refund@example.com",
      limit: 1,
      windowMs: 60_000,
    };

    expect((await consumeAuthRateLimits(base)).ok).toBe(true);
    expect((await peekAuthRateLimits(base)).ok).toBe(false);

    await refundAuthRateLimits(base);
    expect((await peekAuthRateLimits(base)).ok).toBe(true);
    expect((await consumeAuthRateLimits(base)).ok).toBe(true);
  });

  it("beginLoginRateLimit с bypass не consume'ит слот", async () => {
    const email = "bypass-ok@example.com";
    await grantLoginRateLimitBypass(email);
    const base = {
      action: "login" as const,
      ip: UNKNOWN_IP,
      email,
      limit: 1,
      windowMs: 60_000,
    };

    await expect(beginLoginRateLimit(base)).resolves.toEqual({
      ok: true,
      hasBypass: true,
      reserved: false,
    });
    // слот ещё свободен — успешный post-register login не должен его жечь заранее
    expect((await consumeAuthRateLimits(base)).ok).toBe(true);
  });

  it("bypass не разрешает попытки после исчерпания лимита", async () => {
    const email = "bypass-limited@example.com";
    await grantLoginRateLimitBypass(email);
    const base = {
      action: "login" as const,
      ip: UNKNOWN_IP,
      email,
      limit: 2,
      windowMs: 60_000,
    };

    expect((await recordAuthRateLimitFailure(base)).ok).toBe(true);
    expect((await recordAuthRateLimitFailure(base)).ok).toBe(true);
    expect((await recordAuthRateLimitFailure(base)).ok).toBe(false);

    const begin = await beginLoginRateLimit(base);
    expect(begin.ok).toBe(false);
    if (!begin.ok) {
      expect(begin.retryAfterSec).toBeGreaterThan(0);
      expect(begin.hasBypass).toBe(true);
    }
    expect(await hasLoginRateLimitBypass(email)).toBe(true);
  });

  it("hasBypass не снимает bypass; take — снимает", async () => {
    const email = "peek-bypass@example.com";
    await grantLoginRateLimitBypass(email);

    expect(await hasLoginRateLimitBypass(email)).toBe(true);
    expect(await hasLoginRateLimitBypass(email)).toBe(true);
    expect(await takeLoginRateLimitBypass(email)).toBe(true);
    expect(await hasLoginRateLimitBypass(email)).toBe(false);
  });

  it("bypass одноразово: take снимает ключ", async () => {
    const email = "new@example.com";
    await grantLoginRateLimitBypass(email);
    expect(await takeLoginRateLimitBypass(email)).toBe(true);
    expect(await takeLoginRateLimitBypass(email)).toBe(false);
  });

  it("bypass атомарно: параллельный take побеждает только один", async () => {
    const email = "race@example.com";
    await grantLoginRateLimitBypass(email);
    const results = await Promise.all([
      takeLoginRateLimitBypass(email),
      takeLoginRateLimitBypass(email),
      takeLoginRateLimitBypass(email),
      takeLoginRateLimitBypass(email),
    ]);
    expect(results.filter(Boolean).length).toBe(1);
  });

  it("grantLoginRateLimitBypassSafe не пробрасывает ошибку store", async () => {
    const real = getRateLimitStore();
    __setRateLimitStoreForTests({
      ...real,
      async set() {
        throw new Error("redis down");
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      grantLoginRateLimitBypassSafe("safe@example.com"),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("refundAuthRateLimitsSafe не пробрасывает ошибку store", async () => {
    const real = getRateLimitStore();
    __setRateLimitStoreForTests({
      ...real,
      async refund() {
        throw new Error("redis down");
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      refundAuthRateLimitsSafe({
        action: "login",
        ip: UNKNOWN_IP,
        email: "refund-safe@example.com",
        limit: 1,
        windowMs: 60_000,
      }),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("takeLoginRateLimitBypassSafe не пробрасывает ошибку store", async () => {
    const real = getRateLimitStore();
    __setRateLimitStoreForTests({
      ...real,
      async take() {
        throw new Error("redis down");
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      takeLoginRateLimitBypassSafe("take-safe@example.com"),
    ).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("releaseLoginRateLimitsAfterSuccess при сбое refund не бросает", async () => {
    const real = getRateLimitStore();
    __setRateLimitStoreForTests({
      ...real,
      async refund() {
        throw new Error("redis down");
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      releaseLoginRateLimitsAfterSuccess({
        action: "login",
        ip: UNKNOWN_IP,
        email: "release@example.com",
        limit: 1,
        windowMs: 60_000,
        hasBypass: false,
        reserved: true,
      }),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("refund при UNKNOWN_IP возвращает только email-слот", async () => {
    const base = {
      action: "login" as const,
      ip: UNKNOWN_IP,
      email: "email-refund@example.com",
      limit: 1,
      windowMs: 60_000,
    };

    expect((await consumeAuthRateLimits(base)).ok).toBe(true);
    expect((await peekAuthRateLimits(base)).ok).toBe(false);
    await refundAuthRateLimits(base);
    expect((await peekAuthRateLimits(base)).ok).toBe(true);
    expect((await consumeAuthRateLimits(base)).ok).toBe(true);
  });
});
