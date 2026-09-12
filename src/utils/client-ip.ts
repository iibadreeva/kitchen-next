import { headers } from "next/headers";

export const UNKNOWN_IP = "unknown";

function isTrustedProxyEnabled(): boolean {
  return process.env.TRUST_PROXY === "true";
}

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;

  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

type HeaderReader = { get(name: string): string | null };

/**
 * Чистая логика IP (удобно тестировать без next/headers).
 *
 * В production не доверяем x-forwarded-for / x-real-ip по умолчанию.
 * Включайте TRUST_PROXY=true только за доверенным прокси,
 * который очищает и выставляет proxy-заголовки сам.
 * AUTH_TRUST_HOST на чтение IP не влияет.
 */
export function resolveClientIp(
  h: HeaderReader,
  trustedProxy: boolean,
): string {
  if (!trustedProxy) {
    return UNKNOWN_IP;
  }

  return (
    firstForwardedIp(h.get("x-forwarded-for")) ??
    h.get("x-real-ip")?.trim() ??
    UNKNOWN_IP
  );
}

/**
 * IP клиента.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return resolveClientIp(h, isTrustedProxyEnabled());
}
