import { email, enum as zodEnum, object, pipe, string } from "zod";

import { CATEGORY_VALUES, UNIT_VALUES } from "@/constants/select-options";

/** Сообщение первой ошибки Zod для HeroUI Field.validate. */
export function zodFieldError(
  result:
    | { success: true }
    | { success: false; error: { issues: { message: string }[] } },
): string | null {
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Некорректное значение";
}

/** Общие правила пароля — и форма, и server action должны совпадать. */
/** Верхняя граница совпадает с pragmatic-лимитом bcrypt (~72 байта). */
export const PASSWORD_MAX_LENGTH = 72;

export const passwordSchema = string({ error: "Укажите пароль" })
  .min(8, "Пароль должен содержать не менее 8 символов")
  .max(
    PASSWORD_MAX_LENGTH,
    `Пароль должен быть не длиннее ${PASSWORD_MAX_LENGTH} символов`,
  )
  .regex(/[A-Z]/, "Пароль должен содержать как минимум одну заглавную букву")
  .regex(/[0-9]/, "Пароль должен содержать как минимум одну цифру");

export const emailSchema = pipe(
  string({ error: "Укажите email" }).trim().toLowerCase().min(1, "Укажите email"),
  email("Некорректный email"),
);

/** Пароль на входе: длина без правил сложности (старые аккаунты). */
export const signInPasswordSchema = string({ error: "Укажите пароль" })
  .min(8, "Пароль должен быть не короче 8 символов")
  .max(
    PASSWORD_MAX_LENGTH,
    `Пароль должен быть не длиннее ${PASSWORD_MAX_LENGTH} символов`,
  );

export const signInSchema = object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export const registerSchema = object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: string({ error: "Подтвердите пароль" }).min(
    1,
    "Пароль для подтверждения обязателен",
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export const ingredientNameSchema = string({ error: "Укажите название" })
  .trim()
  .min(1, "Укажите название")
  .min(2, "Название слишком короткое")
  .max(100, "Название слишком длинное");

export const ingredientCategorySchema = zodEnum(CATEGORY_VALUES, {
  error: "Выберите категорию",
});

export const ingredientUnitSchema = zodEnum(UNIT_VALUES, {
  error: "Выберите единицу измерения",
});

/** Цена строкой под Decimal(10,2): не больше двух знаков после точки. */
export const ingredientPriceSchema = string({ error: "Укажите цену" })
  .trim()
  .min(1, "Укажите цену")
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "Цена — число с не более чем 2 знаками после точки",
  )
  .refine((value) => Number(value) >= 0, "Цена не может быть отрицательной")
  .refine((value) => Number(value) <= 1_000_000, "Слишком большая цена");

/** Необязательное; пустая строка допустима. */
export const ingredientDescriptionSchema = string()
  .trim()
  .max(500, "Описание слишком длинное");

export const ingredientSchema = object({
  name: ingredientNameSchema,
  category: ingredientCategorySchema,
  unit: ingredientUnitSchema,
  pricePerUnit: ingredientPriceSchema,
  description: ingredientDescriptionSchema,
});

/** Create: тот же контракт, что и форма (цена — строка для Prisma.Decimal). */
export const ingredientCreateSchema = ingredientSchema;
