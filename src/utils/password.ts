import bcryptjs from "bcryptjs";

/**
 * Фиксированный bcrypt-hash (cost 12) для сравнения, когда пользователя нет.
 * Выравнивает timing ответа authorize (нет раннего return без compare).
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$U3FqPbjjCn8YLv9pAIiBPefURS6qfOgIWmeg4JL1fAG1UwWvaa9lu";

/**
 * Хеширует пароль через bcrypt.
 * Salt генерирует сам bcrypt (параметр — число раундов, не «строка соли»).
 */
export async function saltAndHashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcryptjs.hash(password, saltRounds);
}
