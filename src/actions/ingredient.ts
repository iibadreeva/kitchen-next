"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth/auth";
import { ingredientCreateSchema } from "@/lib/zod";
import { prisma } from "@/lib/prisma";
import {
  authUnavailableMessage,
  rateLimitedMessage,
} from "@/utils/auth-messages";
import { callAuthRateLimitStore } from "@/utils/auth-store";
import { getClientIp, UNKNOWN_IP } from "@/utils/client-ip";
import { consumeRateLimit, refundRateLimit } from "@/utils/rate-limit";
import type { IngredientInput } from "@/types/ingredient";

const CREATE_LIMIT = 30;
const CREATE_WINDOW_MS = 60 * 60 * 1000;
/** Верхняя граница списка на странице (без пагинации). */
const INGREDIENTS_LIST_LIMIT = 200;

function userRateKey(userId: string) {
  return `ingredient:create:user:${userId}`;
}

function ipRateKey(ip: string) {
  return `ingredient:create:ip:${ip}`;
}

async function consumeIngredientCreateLimits(userId: string, ip: string) {
  const byUser = await consumeRateLimit(
    userRateKey(userId),
    CREATE_LIMIT,
    CREATE_WINDOW_MS,
  );
  if (!byUser.ok) return byUser;

  if (ip === UNKNOWN_IP) {
    return byUser;
  }

  const byIp = await consumeRateLimit(
    ipRateKey(ip),
    CREATE_LIMIT,
    CREATE_WINDOW_MS,
  );
  if (!byIp.ok) {
    await refundRateLimit(userRateKey(userId));
    return byIp;
  }

  return byIp;
}

async function refundIngredientCreateLimits(userId: string, ip: string) {
  await refundRateLimit(userRateKey(userId));
  if (ip !== UNKNOWN_IP) {
    await refundRateLimit(ipRateKey(ip));
  }
}

export async function createIngredient(data: IngredientInput) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "Войдите, чтобы добавить ингредиент" };
  }

  const parsed = ingredientCreateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  const ip = await getClientIp();

  let rate;
  try {
    rate = await callAuthRateLimitStore(() =>
      consumeIngredientCreateLimits(userId, ip),
    );
  } catch {
    return { error: authUnavailableMessage() };
  }

  if (!rate.ok) {
    return {
      error: rateLimitedMessage(rate.retryAfterSec),
      retryAfterSec: rate.retryAfterSec,
    };
  }

  try {
    // Явный unchecked-input: FK через userId (не XOR object-literal).
    const ingredient = await prisma.ingredient.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        unit: parsed.data.unit,
        pricePerUnit: new Prisma.Decimal(parsed.data.pricePerUnit),
        description: parsed.data.description || null,
        userId,
      } as Prisma.IngredientUncheckedCreateInput,
    });

    // После успешного create оно говорит фреймворку: кэш страницы /ingredients устарел, при следующем запросе её нужно пересобрать
    revalidatePath("/ingredients");

    return {
      success: true as const,
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        pricePerUnit: ingredient.pricePerUnit.toNumber(),
        description: ingredient.description,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Дубликат имени — слот остаётся (анти-абьюз перебора).
      return { error: "Ингредиент с таким названием уже есть" };
    }

    try {
      await refundIngredientCreateLimits(userId, ip);
    } catch (refundError) {
      console.error(
        "Не удалось откатить ingredient rate-limit после ошибки:",
        refundError,
      );
    }

    console.error("Ошибка при создании ингредиента", error);
    return { error: "Ошибка при создании ингредиента" };
  }
}

export async function getIngredients() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "Войдите, чтобы увидеть ингредиенты" };
  }

  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      take: INGREDIENTS_LIST_LIMIT,
    });

    return {
      success: true as const,
      ingredients: ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        pricePerUnit: ingredient.pricePerUnit.toNumber(),
        description: ingredient.description,
      })),
    };
  } catch (error) {
    console.error("Ошибка при получении ингредиентов", error);
    return { error: "Ошибка при получении ингредиентов" };
  }
}

export async function removeIngredient(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "Войдите, чтобы удалить ингредиент" };
  }

  const ingredientId = id.trim();
  if (!ingredientId) {
    return { error: "Некорректный идентификатор" };
  }

  try {
    const result = await prisma.ingredient.deleteMany({
      where: { id: ingredientId, userId },
    });

    if (result.count === 0) {
      return { error: "Ингредиент не найден" };
    }

    revalidatePath("/ingredients");

    return { success: true as const };
  } catch (error) {
    console.error("Ошибка при удалении ингредиента", error);
    return { error: "Ошибка при удалении ингредиента" };
  }
}
