/** Формат `code` для CredentialsSignin — должен совпадать с parseRateLimitedCode. */
export function rateLimitedAuthCode(retryAfterSec: number): string {
  return `rate_limited:${retryAfterSec}`;
}

/** Сбой rate-limit store / инфраструктуры auth — не путать с неверным паролем. */
export const AUTH_UNAVAILABLE_CODE = "auth_unavailable";

export function isAuthUnavailableCode(code: string | undefined): boolean {
  return code === AUTH_UNAVAILABLE_CODE;
}

export function authUnavailableMessage(): string {
  return "Вход временно недоступен. Попробуйте позже.";
}

/** Парсит code Auth.js вида `rate_limited` или `rate_limited:42`. */
export function parseRateLimitedCode(
  code: string | undefined,
): { limited: true; retryAfterSec: number | null } | { limited: false } {
  if (!code?.startsWith("rate_limited")) {
    return { limited: false };
  }

  const secPart = code.includes(":") ? code.slice("rate_limited:".length) : "";
  const sec = Number(secPart);
  return {
    limited: true,
    retryAfterSec: Number.isFinite(sec) && sec > 0 ? sec : null,
  };
}

export function rateLimitedMessage(retryAfterSec?: number | null): string {
  if (retryAfterSec && retryAfterSec > 0) {
    return `Слишком много попыток. Подождите ${retryAfterSec} сек. и попробуйте снова.`;
  }
  return "Слишком много попыток. Подождите немного и попробуйте снова.";
}
