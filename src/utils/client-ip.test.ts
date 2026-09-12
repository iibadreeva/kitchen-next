import { describe, expect, it } from "vitest";

import { UNKNOWN_IP, resolveClientIp } from "@/utils/client-ip";

function headerMap(entries: Record<string, string>) {
  return {
    get(name: string) {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

describe("resolveClientIp", () => {
  it("без TRUST_PROXY не читает proxy-заголовки", () => {
    const ip = resolveClientIp(
      headerMap({
        "x-forwarded-for": "203.0.113.10",
        "x-real-ip": "198.51.100.2",
      }),
      false,
    );
    expect(ip).toBe(UNKNOWN_IP);
  });

  it("при TRUST_PROXY берёт первый IP из x-forwarded-for", () => {
    const ip = resolveClientIp(
      headerMap({
        "x-forwarded-for": " 203.0.113.10 , 198.51.100.2",
      }),
      true,
    );
    expect(ip).toBe("203.0.113.10");
  });

  it("при TRUST_PROXY падает на x-real-ip", () => {
    const ip = resolveClientIp(
      headerMap({
        "x-real-ip": "198.51.100.2",
      }),
      true,
    );
    expect(ip).toBe("198.51.100.2");
  });
});
