import { describe, expect, it, vi } from "vitest";

import { AUTH_UNAVAILABLE_CODE } from "@/utils/auth-messages";
import { callAuthRateLimitStore } from "@/utils/auth-store";

describe("callAuthRateLimitStore", () => {
  it("пробрасывает результат при успехе", async () => {
    await expect(callAuthRateLimitStore(async () => 42)).resolves.toBe(42);
  });

  it("оборачивает сбой store в AuthStoreUnavailableError", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      callAuthRateLimitStore(async () => {
        throw new Error("redis down");
      }),
    ).rejects.toMatchObject({
      name: "AuthStoreUnavailableError",
      code: AUTH_UNAVAILABLE_CODE,
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
