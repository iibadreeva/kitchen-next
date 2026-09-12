import type { RateLimitBucket } from "@/utils/rate-limit-store";

export type ConsumeApplyResult =
  | { ok: true; bucket: RateLimitBucket }
  | { ok: false; retryAfterSec: number };

/** Чистая логика инкремента бакета (memory и Lua должны совпадать). */
export function applyConsume(
  bucket: RateLimitBucket | undefined,
  limit: number,
  windowMs: number,
  now: number,
): ConsumeApplyResult {
  if (!bucket || now >= bucket.resetAt) {
    return { ok: true, bucket: { count: 1, resetAt: now + windowMs } };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    bucket: { count: bucket.count + 1, resetAt: bucket.resetAt },
  };
}

export function isBucketActive(
  bucket: RateLimitBucket | undefined,
  now: number,
): bucket is RateLimitBucket {
  return Boolean(bucket && now < bucket.resetAt);
}

/** Refund одного слота; `undefined` — бакет удалить. */
export function applyRefund(
  bucket: RateLimitBucket | undefined,
  now: number,
): RateLimitBucket | undefined {
  if (!isBucketActive(bucket, now)) return undefined;
  if (bucket.count <= 1) return undefined;
  return { count: bucket.count - 1, resetAt: bucket.resetAt };
}
