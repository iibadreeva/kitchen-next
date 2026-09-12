import { Redis } from "@upstash/redis";

import {
  applyConsume,
  applyRefund,
  isBucketActive,
} from "@/utils/rate-limit-bucket";

export type RateLimitBucket = { count: number; resetAt: number };

export type RateLimitConsumeResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export interface RateLimitStore {
  get(key: string): Promise<RateLimitBucket | undefined>;
  set(key: string, bucket: RateLimitBucket): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
  entries(): Promise<[string, RateLimitBucket][]>;
  /** Атомарный инкремент (без await между чтением и записью). */
  consume(
    key: string,
    limit: number,
    windowMs: number,
    now?: number,
  ): Promise<RateLimitConsumeResult>;
  /** Атомарный get+delete; true если бакет был и ещё не истёк. */
  take(key: string, now?: number): Promise<boolean>;
  /** Атомарный −1 к счётчику (или delete при count≤1). */
  refund(key: string, now?: number): Promise<void>;
}

export function createMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    async get(key) {
      return buckets.get(key);
    },
    async set(key, bucket) {
      buckets.set(key, bucket);
    },
    async delete(key) {
      buckets.delete(key);
    },
    async clear() {
      buckets.clear();
    },
    async size() {
      return buckets.size;
    },
    async entries() {
      return [...buckets.entries()];
    },
    async consume(key, limit, windowMs, now = Date.now()) {
      const applied = applyConsume(buckets.get(key), limit, windowMs, now);
      if (!applied.ok) {
        return { ok: false, retryAfterSec: applied.retryAfterSec };
      }
      buckets.set(key, applied.bucket);
      return { ok: true };
    },
    async take(key, now = Date.now()) {
      const bucket = buckets.get(key);
      buckets.delete(key);
      return isBucketActive(bucket, now);
    },
    async refund(key, now = Date.now()) {
      const next = applyRefund(buckets.get(key), now);
      if (!next) {
        buckets.delete(key);
        return;
      }
      buckets.set(key, next);
    },
  };
}

/**
 * Lua: атомарный consume. ARGV: limit, windowMs, now.
 * Возврат: {1, 0} ok | {0, retryAfterSec} blocked.
 */
const CONSUME_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local raw = redis.call('GET', key)
local count = 0
local resetAt = now + windowMs

if raw then
  local data = cjson.decode(raw)
  local existingReset = tonumber(data['resetAt'])
  local existingCount = tonumber(data['count'])
  if existingReset and existingReset > now then
    count = existingCount or 0
    resetAt = existingReset
    if count >= limit then
      local retry = math.max(1, math.ceil((resetAt - now) / 1000))
      return {0, retry}
    end
  end
end

count = count + 1
if count == 1 then
  resetAt = now + windowMs
end

local payload = cjson.encode({count = count, resetAt = resetAt})
local ttl = math.max(1, resetAt - now)
redis.call('SET', key, payload, 'PX', ttl)
return {1, 0}
`;

/** Lua: атомарный take. ARGV: now. Возврат: 1 | 0. */
const TAKE_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local raw = redis.call('GETDEL', key)
if not raw then
  return 0
end
local data = cjson.decode(raw)
local resetAt = tonumber(data['resetAt'])
if resetAt and resetAt > now then
  return 1
end
return 0
`;

/** Lua: атомарный refund. ARGV: now. */
const REFUND_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local raw = redis.call('GET', key)
if not raw then
  return 0
end
local data = cjson.decode(raw)
local resetAt = tonumber(data['resetAt'])
local count = tonumber(data['count']) or 0
if not resetAt or resetAt <= now then
  redis.call('DEL', key)
  return 0
end
if count <= 1 then
  redis.call('DEL', key)
  return 0
end
count = count - 1
local payload = cjson.encode({count = count, resetAt = resetAt})
local ttl = math.max(1, resetAt - now)
redis.call('SET', key, payload, 'PX', ttl)
return 1
`;

/** Upstash REST Redis — общий атомарный store между инстансами. */
export function createUpstashRateLimitStore(env = process.env): RateLimitStore {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const prefix = "rl:";

  return {
    async get(key) {
      const value = await redis.get<RateLimitBucket>(prefix + key);
      return value ?? undefined;
    },
    async set(key, bucket) {
      const ttlMs = Math.max(1, bucket.resetAt - Date.now());
      await redis.set(prefix + key, bucket, { px: ttlMs });
    },
    async delete(key) {
      await redis.del(prefix + key);
    },
    async clear() {
      // Ключи истекают по TTL; полный flush в shared Redis не делаем
    },
    async size() {
      return 0;
    },
    async entries() {
      return [];
    },
    async consume(key, limit, windowMs, now = Date.now()) {
      const result = await redis.eval<[number, number, number], [number, number]>(
        CONSUME_LUA,
        [prefix + key],
        [limit, windowMs, now],
      );
      const ok = Number(result?.[0]) === 1;
      if (ok) return { ok: true };
      return {
        ok: false,
        retryAfterSec: Math.max(1, Number(result?.[1]) || 1),
      };
    },
    async take(key, now = Date.now()) {
      const result = await redis.eval<[number], number>(
        TAKE_LUA,
        [prefix + key],
        [now],
      );
      return Number(result) === 1;
    },
    async refund(key, now = Date.now()) {
      await redis.eval<[number], number>(REFUND_LUA, [prefix + key], [now]);
    },
  };
}

let store: RateLimitStore | null = null;

export function hasUpstashEnv(env = process.env): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * In-memory в production запрещён (лимиты не шарятся между инстансами),
 * кроме явного ALLOW_IN_MEMORY_RATE_LIMIT=true (один процесс).
 */
export function isInMemoryRateLimitAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.ALLOW_IN_MEMORY_RATE_LIMIT === "true";
}

export function assertRateLimitStoreConfig(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (hasUpstashEnv(env)) return;
  if (isInMemoryRateLimitAllowed(env)) return;

  throw new Error(
    "[rate-limit] Production требует UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN (или ALLOW_IN_MEMORY_RATE_LIMIT=true только для одного инстанса).",
  );
}

export function getRateLimitStore(): RateLimitStore {
  if (!store) {
    assertRateLimitStoreConfig();
    store = hasUpstashEnv()
      ? createUpstashRateLimitStore()
      : createMemoryRateLimitStore();
  }
  return store;
}

/** Только для unit-тестов. */
export function __setRateLimitStoreForTests(next: RateLimitStore | null) {
  store = next;
}
