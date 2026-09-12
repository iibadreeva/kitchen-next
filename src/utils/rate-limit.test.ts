import { afterEach, describe, expect, it } from "vitest";

import {
  consumeRateLimit,
  peekRateLimit,
  refundRateLimit,
  resetRateLimitBuckets,
} from "@/utils/rate-limit";

describe("rate-limit", () => {
  afterEach(async () => {
    await resetRateLimitBuckets();
  });

  it("peek не увеличивает счётчик", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await peekRateLimit("k", 3)).ok).toBe(true);
    }
    expect((await peekRateLimit("k", 3)).ok).toBe(true);
    expect((await consumeRateLimit("k", 3, 60_000)).ok).toBe(true);
    expect((await consumeRateLimit("k", 3, 60_000)).ok).toBe(true);
    expect((await consumeRateLimit("k", 3, 60_000)).ok).toBe(true);
    const blocked = await peekRateLimit("k", 3);
    expect(blocked.ok).toBe(false);
  });

  it("consume блокирует после limit попыток", async () => {
    expect((await consumeRateLimit("a", 2, 60_000)).ok).toBe(true);
    expect((await consumeRateLimit("a", 2, 60_000)).ok).toBe(true);
    const blocked = await consumeRateLimit("a", 2, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
    }
  });

  it("consume атомарно: параллельные вызовы не превышают limit", async () => {
    const limit = 5;
    const results = await Promise.all(
      Array.from({ length: 40 }, () => consumeRateLimit("race", limit, 60_000)),
    );
    expect(results.filter((r) => r.ok).length).toBe(limit);
    expect(results.filter((r) => !r.ok).length).toBe(40 - limit);
  });

  it("refund уменьшает счётчик после consume", async () => {
    expect((await consumeRateLimit("refund", 2, 60_000)).ok).toBe(true);
    expect((await consumeRateLimit("refund", 2, 60_000)).ok).toBe(true);
    expect((await peekRateLimit("refund", 2)).ok).toBe(false);

    await refundRateLimit("refund");
    expect((await peekRateLimit("refund", 2)).ok).toBe(true);
    expect((await consumeRateLimit("refund", 2, 60_000)).ok).toBe(true);
  });
});
