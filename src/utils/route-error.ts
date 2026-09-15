/** Коды для `/error?code=` — только whitelist, без произвольного текста в URL. */
export const ROUTE_ERROR_UNAUTHORIZED = "unauthorized";
export const ROUTE_ERROR_AUTH_MISCONFIGURED = "auth_misconfigured";

const ROUTE_ERROR_MESSAGES: Record<string, string> = {
  [ROUTE_ERROR_UNAUTHORIZED]: "Требуется вход в аккаунт",
  [ROUTE_ERROR_AUTH_MISCONFIGURED]: "Ошибка конфигурации авторизации",
};

const FALLBACK_MESSAGE = "Неизвестная ошибка";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Возвращает текст только для известных кодов; иначе fallback. */
export function resolveRouteErrorMessage(
  code: string | string[] | undefined,
): string {
  const key = firstParam(code);
  if (!key) return FALLBACK_MESSAGE;
  return ROUTE_ERROR_MESSAGES[key] ?? FALLBACK_MESSAGE;
}
