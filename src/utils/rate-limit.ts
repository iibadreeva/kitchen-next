import {
  getRateLimitStore,
  type RateLimitBucket,
  __setRateLimitStoreForTests,
  createMemoryRateLimitStore,
} from "@/utils/rate-limit-store";

const MAX_BUCKETS = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanupAt = 0;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/** Сброс in-memory бакетов (unit-тесты). */
export async function resetRateLimitBuckets() {
  const memory = createMemoryRateLimitStore();
  __setRateLimitStoreForTests(memory);
  lastCleanupAt = 0;
  await memory.clear();
}

async function cleanupExpiredBuckets(now: number) {
  const store = getRateLimitStore();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;

  lastCleanupAt = now;

  const entries = await store.entries();
  if (entries.length === 0) return;

  for (const [key, bucket] of entries) {
    if (now >= bucket.resetAt) {
      await store.delete(key);
    }
  }

  const size = await store.size();
  if (size <= MAX_BUCKETS) return;

  const sortedEntries = [...(await store.entries())].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );

  const overflow = size - MAX_BUCKETS;
  for (const [key] of sortedEntries.slice(0, overflow)) {
    await store.delete(key);
  }
}

function retryAfterSec(bucket: RateLimitBucket, now: number) {
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

/**
 * Проверка без инкремента.
 *
 * In-memory и Upstash: consume/take/refund атомарны на уровне store.
 */
export async function peekRateLimit(
  key: string,
  limit: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  await cleanupExpiredBuckets(now);

  const store = getRateLimitStore();
  const bucket = await store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: retryAfterSec(bucket, now) };
  }

  return { ok: true };
}

/**
 * Атомарный инкремент счётчика (register / reserve login / неудачный login).
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  await cleanupExpiredBuckets(now);
  return getRateLimitStore().consume(key, limit, windowMs, now);
}

/** Откат одного слота (успешный login после reserve). */
export async function refundRateLimit(key: string): Promise<void> {
  const now = Date.now();
  await cleanupExpiredBuckets(now);
  await getRateLimitStore().refund(key, now);
}
