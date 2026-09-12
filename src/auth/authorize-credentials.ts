import { CredentialsSignin } from "next-auth";
import { ZodError } from "zod";
import bcryptjs from "bcryptjs";

import { signInSchema } from "@/lib/zod";
import {
  AUTH_UNAVAILABLE_CODE,
  rateLimitedAuthCode,
} from "@/utils/auth-messages";
import {
  AuthStoreUnavailableError,
  callAuthRateLimitStore,
} from "@/utils/auth-store";
import {
  beginLoginRateLimit,
  recordAuthRateLimitFailure,
  releaseLoginRateLimitsAfterSuccess,
} from "@/utils/auth-rate-limit";
import { getClientIp, UNKNOWN_IP } from "@/utils/client-ip";
import { DUMMY_PASSWORD_HASH } from "@/utils/password";
import { getUserFromDb } from "@/utils/user";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Кастомный code для клиента: rate_limited:<sec>, без утечки «email существует». */
export class RateLimitedSignIn extends CredentialsSignin {
  code: string;

  constructor(retryAfterSec: number) {
    super();
    this.code = rateLimitedAuthCode(retryAfterSec);
  }
}

/** Rate-limit store недоступен — не маскировать под неверный пароль. */
export class AuthUnavailableSignIn extends CredentialsSignin {
  code = AUTH_UNAVAILABLE_CODE;
}

/**
 * Credentials authorize: rate-limit → проверка пароля → JWT user.
 * При уже исчерпанном лимите не делаем DB/bcrypt (ответ и так rate_limited).
 */
export async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>> | undefined,
) {
  try {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    const { email, password } = await signInSchema.parseAsync(credentials);

    let ip = UNKNOWN_IP;
    try {
      ip = await getClientIp();
    } catch (error) {
      // headers() вне request context — ожидаемо; лимит только по email.
      console.error(
        "getClientIp недоступен в authorize, IP-лимит пропущен:",
        error,
      );
    }

    const rateInput = {
      action: "login" as const,
      ip,
      email,
      limit: LOGIN_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    };

    // Bypass: peek (не жжёт слот); иначе атомарный reserve.
    // Сбой store → auth_unavailable (не «неверный пароль» и не bcrypt без лимита).
    const began = await callAuthRateLimitStore(() =>
      beginLoginRateLimit(rateInput),
    );
    if (!began.ok) {
      // Лимит уже исчерпан — клиент получает rate_limited; bcrypt/DB не нужны
      // и открывали бы CPU DoS после блокировки.
      throw new RateLimitedSignIn(began.retryAfterSec);
    }

    const { hasBypass, reserved } = began;

    const user = await getUserFromDb(email);
    const hash = user?.password ?? DUMMY_PASSWORD_HASH;
    const isPasswordValid = await bcryptjs.compare(password, hash);

    if (!user?.password || !isPasswordValid) {
      // Reserve уже учёл неудачу; при bypass — считаем отдельно.
      if (hasBypass) {
        const recorded = await callAuthRateLimitStore(() =>
          recordAuthRateLimitFailure(rateInput),
        );
        if (!recorded.ok) {
          throw new RateLimitedSignIn(recorded.retryAfterSec);
        }
      }
      return null;
    }

    await releaseLoginRateLimitsAfterSuccess({
      ...rateInput,
      hasBypass,
      reserved,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      throw error;
    }
    if (error instanceof AuthStoreUnavailableError) {
      throw new AuthUnavailableSignIn();
    }
    if (!(error instanceof ZodError)) {
      console.error("Ошибка authorize:", error);
    }
    return null;
  }
}
