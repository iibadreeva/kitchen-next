import { describe, expect, it } from "vitest";

import {
  AUTH_UNAVAILABLE_CODE,
  authUnavailableMessage,
  isAuthUnavailableCode,
  parseRateLimitedCode,
  rateLimitedAuthCode,
  rateLimitedMessage,
} from "@/utils/auth-messages";

describe("auth-messages", () => {
  it("rateLimitedAuthCode совместим с parseRateLimitedCode (CredentialsSignin)", () => {
    const code = rateLimitedAuthCode(42);
    expect(code).toBe("rate_limited:42");
    expect(parseRateLimitedCode(code)).toEqual({
      limited: true,
      retryAfterSec: 42,
    });
  });

  it("парсит code с секундами", () => {
    expect(parseRateLimitedCode("rate_limited:45")).toEqual({
      limited: true,
      retryAfterSec: 45,
    });
  });

  it("парсит code без секунд", () => {
    expect(parseRateLimitedCode("rate_limited")).toEqual({
      limited: true,
      retryAfterSec: null,
    });
  });

  it("формирует сообщение с секундами", () => {
    expect(rateLimitedMessage(30)).toContain("30 сек");
  });

  it("распознаёт auth_unavailable и не путает с rate_limited", () => {
    expect(AUTH_UNAVAILABLE_CODE).toBe("auth_unavailable");
    expect(isAuthUnavailableCode(AUTH_UNAVAILABLE_CODE)).toBe(true);
    expect(isAuthUnavailableCode("rate_limited:1")).toBe(false);
    expect(authUnavailableMessage()).toMatch(/временно недоступен/i);
  });
});
