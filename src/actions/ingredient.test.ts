import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/auth/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/utils/client-ip", () => ({
  getClientIp: vi.fn(),
  UNKNOWN_IP: "unknown",
}));

vi.mock("@/utils/rate-limit", () => ({
  consumeRateLimit: vi.fn(),
  refundRateLimit: vi.fn(),
}));

vi.mock("@/utils/auth-store", () => ({
  callAuthRateLimitStore: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ingredient: {
      create: vi.fn(),
    },
  },
}));

import { createIngredient } from "@/actions/ingredient";
import { auth } from "@/auth/auth";
import { getClientIp } from "@/utils/client-ip";
import { consumeRateLimit, refundRateLimit } from "@/utils/rate-limit";
import { prisma } from "@/lib/prisma";

const validInput = {
  name: "Морковь",
  category: "VEGETABLES" as const,
  unit: "KILOGRAMS" as const,
  pricePerUnit: "89.50",
  description: "",
};

describe("createIngredient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "a@b.c" },
      expires: "2099-01-01",
    } as never);
    vi.mocked(getClientIp).mockResolvedValue("203.0.113.1");
    vi.mocked(consumeRateLimit).mockResolvedValue({ ok: true });
    vi.mocked(refundRateLimit).mockResolvedValue(undefined);
  });

  it("отклоняет неавторизованного пользователя", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await createIngredient(validInput);

    expect(result).toEqual({
      error: "Войдите, чтобы добавить ингредиент",
    });
    expect(prisma.ingredient.create).not.toHaveBeenCalled();
  });

  it("при rate-limit не пишет в БД", async () => {
    vi.mocked(consumeRateLimit).mockResolvedValue({
      ok: false,
      retryAfterSec: 42,
    });

    const result = await createIngredient(validInput);

    expect(result).toEqual({
      error: expect.stringMatching(/слишком много/i),
      retryAfterSec: 42,
    });
    expect(prisma.ingredient.create).not.toHaveBeenCalled();
  });

  it("создаёт ингредиент с userId и Decimal-ценой", async () => {
    vi.mocked(prisma.ingredient.create).mockResolvedValue({
      id: "ing-1",
      name: "Морковь",
      category: "VEGETABLES",
      unit: "KILOGRAMS",
      pricePerUnit: new Prisma.Decimal("89.50"),
      description: null,
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await createIngredient(validInput);

    expect(result).toMatchObject({
      success: true,
      ingredient: {
        id: "ing-1",
        name: "Морковь",
        pricePerUnit: "89.5",
      },
    });
    expect(prisma.ingredient.create).toHaveBeenCalledWith({
      data: {
        name: "Морковь",
        category: "VEGETABLES",
        unit: "KILOGRAMS",
        pricePerUnit: expect.any(Prisma.Decimal),
        description: null,
        userId: "user-1",
      },
    });
  });

  it("при P2002 возвращает понятную ошибку", async () => {
    vi.mocked(prisma.ingredient.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await createIngredient(validInput);

    expect(result).toEqual({
      error: "Ингредиент с таким названием уже есть",
    });
    expect(refundRateLimit).not.toHaveBeenCalled();
  });

  it("при ошибке БД (не P2002) откатывает rate-limit user и IP", async () => {
    vi.mocked(prisma.ingredient.create).mockRejectedValue(
      new Error("connection reset"),
    );

    const result = await createIngredient(validInput);

    expect(result).toEqual({
      error: "Ошибка при создании ингредиента",
    });
    expect(refundRateLimit).toHaveBeenCalledWith(
      "ingredient:create:user:user-1",
    );
    expect(refundRateLimit).toHaveBeenCalledWith(
      "ingredient:create:ip:203.0.113.1",
    );
  });

  it("отклоняет цену с тремя знаками после точки", async () => {
    const result = await createIngredient({
      ...validInput,
      pricePerUnit: "10.999",
    });

    expect(result.error).toBeTruthy();
    expect(prisma.ingredient.create).not.toHaveBeenCalled();
  });
});
