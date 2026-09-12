import { UNKNOWN_IP } from "@/utils/client-ip";
import {
  consumeRateLimit,
  peekRateLimit,
  refundRateLimit,
  resetRateLimitBuckets,
  type RateLimitResult,
} from "@/utils/rate-limit";
import { getRateLimitStore } from "@/utils/rate-limit-store";
import { isBucketActive } from "@/utils/rate-limit-bucket";

type AuthRateLimitInput = {
  action: "login" | "register";
  ip: string;
  email: string;
  limit: number;
  windowMs: number;
};

function emailKey(action: string, email: string) {
  return `${action}:email:${email.trim().toLowerCase()}`;
}

function ipKey(action: string, ip: string) {
  return `${action}:ip:${ip}`;
}

function bypassKey(email: string) {
  return `bypass:login:${email.trim().toLowerCase()}`;
}

/**
 * Лимит по email всегда; по IP — только если IP известен
 * (иначе все клиенты делили бы бакет `unknown` — DoS).
 * Без IP остаётся только per-email защита; для IP-лимита нужен TRUST_PROXY.
 */
export async function peekAuthRateLimits(
  input: AuthRateLimitInput,
): Promise<RateLimitResult> {
  const byEmail = await peekRateLimit(
    emailKey(input.action, input.email),
    input.limit,
  );
  if (!byEmail.ok) return byEmail;

  if (input.ip === UNKNOWN_IP) {
    return { ok: true };
  }

  return peekRateLimit(ipKey(input.action, input.ip), input.limit);
}

/**
 * Расход лимита. Если IP-ключ блокирует — откатывает email.
 */
export async function consumeAuthRateLimits(
  input: AuthRateLimitInput,
): Promise<RateLimitResult> {
  const email = emailKey(input.action, input.email);
  const byEmail = await consumeRateLimit(email, input.limit, input.windowMs);
  if (!byEmail.ok) return byEmail;

  if (input.ip === UNKNOWN_IP) {
    return byEmail;
  }

  const byIp = await consumeRateLimit(
    ipKey(input.action, input.ip),
    input.limit,
    input.windowMs,
  );
  if (!byIp.ok) {
    await refundRateLimit(email);
    return byIp;
  }
  return byIp;
}

/** Откат reserve после успешного login. */
export async function refundAuthRateLimits(
  input: AuthRateLimitInput,
): Promise<void> {
  await refundRateLimit(emailKey(input.action, input.email));

  if (input.ip === UNKNOWN_IP) {
    return;
  }

  await refundRateLimit(ipKey(input.action, input.ip));
}

/**
 * Неудачный login без предварительного reserve (bypass-путь).
 * Возвращает результат consume — вызывающий обязан уважать `ok: false`.
 */
export async function recordAuthRateLimitFailure(
  input: AuthRateLimitInput,
): Promise<RateLimitResult> {
  return consumeAuthRateLimits(input);
}

export type BeginLoginRateLimitResult =
  | { ok: true; hasBypass: boolean; reserved: boolean }
  | { ok: false; retryAfterSec: number; hasBypass: boolean };

/**
 * Перед проверкой пароля.
 * Bypass разрешает один успешный login без reserve, но не снимает лимит
 * при уже исчерпанном бакете (peek) — иначе окно после регистрации
 * даёт неограниченные bcrypt-попытки.
 */
export async function beginLoginRateLimit(
  input: AuthRateLimitInput,
): Promise<BeginLoginRateLimitResult> {
  const hasBypass = await hasLoginRateLimitBypass(input.email);

  if (hasBypass) {
    const peek = await peekAuthRateLimits(input);
    if (!peek.ok) {
      return {
        ok: false,
        retryAfterSec: peek.retryAfterSec,
        hasBypass: true,
      };
    }
    return { ok: true, hasBypass: true, reserved: false };
  }

  const rate = await consumeAuthRateLimits(input);
  if (!rate.ok) {
    return {
      ok: false,
      retryAfterSec: rate.retryAfterSec,
      hasBypass: false,
    };
  }
  return { ok: true, hasBypass: false, reserved: true };
}

const LOGIN_BYPASS_TTL_MS = 60_000;

/** После успешной регистрации — один login без login-лимита. */
export async function grantLoginRateLimitBypass(
  email: string,
  ttlMs = LOGIN_BYPASS_TTL_MS,
) {
  const store = getRateLimitStore();
  await store.set(bypassKey(email), {
    count: 1,
    resetAt: Date.now() + ttlMs,
  });
}

/** Как grant, но ошибки store только логируются (регистрация уже прошла). */
export async function grantLoginRateLimitBypassSafe(email: string) {
  try {
    await grantLoginRateLimitBypass(email);
  } catch (error) {
    console.error(
      "Не удалось выдать login bypass после регистрации:",
      error,
    );
  }
}

export async function hasLoginRateLimitBypass(email: string): Promise<boolean> {
  const bucket = await getRateLimitStore().get(bypassKey(email));
  return isBucketActive(bucket, Date.now());
}

export async function takeLoginRateLimitBypass(email: string): Promise<boolean> {
  return getRateLimitStore().take(bypassKey(email));
}

/** Refund без throw — сбой store не должен ломать успешный login. */
export async function refundAuthRateLimitsSafe(
  input: AuthRateLimitInput,
): Promise<void> {
  try {
    await refundAuthRateLimits(input);
  } catch (error) {
    console.error("Не удалось откатить login rate-limit после успеха:", error);
  }
}

/** Take bypass без throw. */
export async function takeLoginRateLimitBypassSafe(
  email: string,
): Promise<boolean> {
  try {
    return await takeLoginRateLimitBypass(email);
  } catch (error) {
    console.error("Не удалось снять login bypass после успеха:", error);
    return false;
  }
}

/**
 * После успешной проверки пароля: take bypass или refund reserve.
 * Ошибки store только логируются — вход уже разрешён.
 */
export async function releaseLoginRateLimitsAfterSuccess(
  input: AuthRateLimitInput & { hasBypass: boolean; reserved: boolean },
): Promise<void> {
  if (input.hasBypass) {
    await takeLoginRateLimitBypassSafe(input.email);
    return;
  }
  if (input.reserved) {
    await refundAuthRateLimitsSafe(input);
  }
}

/** Только для unit-тестов. */
export async function __resetRateLimitBucketsForTests() {
  await resetRateLimitBuckets();
}
