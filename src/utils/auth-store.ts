import {
  AUTH_UNAVAILABLE_CODE,
  authUnavailableMessage,
} from "@/utils/auth-messages";

/** Ошибка доступа к rate-limit store — маппится в auth_unavailable на клиенте. */
export class AuthStoreUnavailableError extends Error {
  readonly code = AUTH_UNAVAILABLE_CODE;

  constructor(cause?: unknown) {
    super(authUnavailableMessage());
    this.name = "AuthStoreUnavailableError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Вызов rate-limit store: любой неожиданный throw → AuthStoreUnavailableError.
 * Не глотать как «неверный пароль» и не продолжать без лимита.
 */
export async function callAuthRateLimitStore<T>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthStoreUnavailableError) {
      throw error;
    }
    console.error("Rate-limit store недоступен:", error);
    throw new AuthStoreUnavailableError(error);
  }
}
