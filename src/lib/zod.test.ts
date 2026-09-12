import { describe, expect, it } from "vitest";

import { passwordSchema } from "@/lib/zod";

describe("passwordSchema", () => {
  it("принимает пароль длиной до 72 символов", () => {
    const password = `Aa1${"x".repeat(69)}`;
    expect(password.length).toBe(72);
    expect(passwordSchema.safeParse(password).success).toBe(true);
  });

  it("отклоняет пароль длиннее 72 символов", () => {
    const password = `Aa1${"x".repeat(70)}`;
    expect(password.length).toBe(73);
    expect(passwordSchema.safeParse(password).success).toBe(false);
  });
});
