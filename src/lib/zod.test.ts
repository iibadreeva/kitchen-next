import { describe, expect, it } from "vitest";

import {
  ingredientPriceSchema,
  ingredientSchema,
  passwordSchema,
} from "@/lib/zod";

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

describe("ingredient schemas", () => {
  it("принимает корректный ингредиент и оставляет цену строкой", () => {
    const result = ingredientSchema.safeParse({
      name: "Морковь",
      category: "VEGETABLES",
      unit: "KILOGRAMS",
      pricePerUnit: "89.5",
      description: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pricePerUnit).toBe("89.5");
      expect(result.data.description).toBe("");
    }
  });

  it("принимает описание и отклоняет слишком длинное", () => {
    expect(
      ingredientSchema.safeParse({
        name: "Морковь",
        category: "VEGETABLES",
        unit: "GRAMS",
        pricePerUnit: "10",
        description: "Свежая, с грядки",
      }).success,
    ).toBe(true);

    expect(
      ingredientSchema.safeParse({
        name: "Морковь",
        category: "VEGETABLES",
        unit: "GRAMS",
        pricePerUnit: "10",
        description: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("отклоняет отрицательную цену и три знака после точки", () => {
    expect(ingredientPriceSchema.safeParse("-1").success).toBe(false);
    expect(ingredientPriceSchema.safeParse("10.999").success).toBe(false);
    expect(ingredientPriceSchema.safeParse("10.99").success).toBe(true);
  });

  it("create-схема совпадает с выходом формы (цена — строка)", async () => {
    const { ingredientCreateSchema } = await import("@/lib/zod");
    const once = ingredientSchema.safeParse({
      name: "Морковь",
      category: "VEGETABLES",
      unit: "GRAMS",
      pricePerUnit: "10.00",
      description: "",
    });
    expect(once.success).toBe(true);
    if (!once.success) return;

    const twice = ingredientCreateSchema.safeParse(once.data);
    expect(twice.success).toBe(true);
  });

  it("отклоняет пустую категорию", () => {
    const result = ingredientSchema.safeParse({
      name: "Морковь",
      category: "",
      unit: "GRAMS",
      pricePerUnit: "10",
      description: "",
    });
    expect(result.success).toBe(false);
  });
});
