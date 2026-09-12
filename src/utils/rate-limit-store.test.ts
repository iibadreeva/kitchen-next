import { afterEach, describe, expect, it } from "vitest";

import {
  assertRateLimitStoreConfig,
  getRateLimitStore,
  isInMemoryRateLimitAllowed,
  __setRateLimitStoreForTests,
} from "@/utils/rate-limit-store";

describe("rate-limit store config", () => {
  afterEach(() => {
    __setRateLimitStoreForTests(null);
  });

  it("в production без Upstash in-memory запрещён", () => {
    expect(
      isInMemoryRateLimitAllowed({
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });

  it("в production с ALLOW_IN_MEMORY_RATE_LIMIT in-memory разрешён", () => {
    expect(
      isInMemoryRateLimitAllowed({
        NODE_ENV: "production",
        ALLOW_IN_MEMORY_RATE_LIMIT: "true",
      }),
    ).toBe(true);
  });

  it("в development без Upstash in-memory разрешён", () => {
    expect(
      isInMemoryRateLimitAllowed({
        NODE_ENV: "development",
      }),
    ).toBe(true);
  });

  it("assert в production без Upstash бросает", () => {
    expect(() =>
      assertRateLimitStoreConfig({
        NODE_ENV: "production",
      }),
    ).toThrow(/UPSTASH_REDIS/);
  });

  it("assert в production с Upstash не бросает", () => {
    expect(() =>
      assertRateLimitStoreConfig({
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    ).not.toThrow();
  });

  it("getRateLimitStore в production без Upstash бросает", () => {
    const prev = process.env.NODE_ENV;
    const prevAllow = process.env.ALLOW_IN_MEMORY_RATE_LIMIT;
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_IN_MEMORY_RATE_LIMIT;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __setRateLimitStoreForTests(null);

    try {
      expect(() => getRateLimitStore()).toThrow(/UPSTASH_REDIS/);
    } finally {
      process.env.NODE_ENV = prev;
      if (prevAllow === undefined) delete process.env.ALLOW_IN_MEMORY_RATE_LIMIT;
      else process.env.ALLOW_IN_MEMORY_RATE_LIMIT = prevAllow;
      if (prevUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = prevUrl;
      if (prevToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
    }
  });
});
