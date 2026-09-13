"use client";

import { create } from "zustand";
import { signIn, signOut } from "next-auth/react";

import { registerUser } from "@/actions/register";
import type { FormDataType } from "@/types/form-data";
import {
  authUnavailableMessage,
  isAuthUnavailableCode,
  parseRateLimitedCode,
  rateLimitedMessage,
} from "@/utils/auth-messages";

export type AuthModal = null | "login" | "signup";
export type AuthOp = "login" | "register" | "logout";
export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthState = {
  modal: AuthModal;
  /** Текущая операция; `null` — не выполняется. */
  op: AuthOp | null;
  /** Ошибка login / register (модалка). */
  error: string | null;
  /** Ошибка logout (header). */
  logoutError: string | null;
  /** Инвалидирует in-flight login/register при закрытии модалки. */
  requestSeq: number;
  /**
   * После logout игнорируем stale `authenticated` из Auth.js,
   * пока sync не подтвердит `unauthenticated`, либо пока не пройдёт
   * успешный login/register (тогда suppress снимаем сами).
   */
  suppressStaleSession: boolean;
  sessionUser: AuthSessionUser | null;
  sessionStatus: SessionStatus;
  setSession: (
    user: AuthSessionUser | null,
    status: SessionStatus,
  ) => void;
  openModal: (modal: Exclude<AuthModal, null>) => void;
  closeModal: () => void;
  clearError: () => void;
  clearLogoutError: () => void;
  login: (input: LoginInput) => Promise<boolean>;
  register: (input: FormDataType) => Promise<boolean>;
  logout: () => Promise<boolean>;
};

/** Событие для `AuthSessionSync`: обновить session + RSC после смены сессии. */
export const AUTH_SESSION_CHANGED_EVENT = "auth:session-changed";

type SessionUserInput = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Auth.js → зеркало store.
 * `authenticated` без `id` не считаем сессией — иначе UI гостя при «аутентифицирован».
 */
export function resolveSessionMirror(
  status: SessionStatus,
  user: SessionUserInput | null | undefined,
): {
  sessionUser: AuthSessionUser | null;
  sessionStatus: SessionStatus;
} {
  if (status === "authenticated") {
    const id = user?.id;
    if (typeof id === "string" && id.length > 0) {
      return {
        sessionUser: {
          id,
          name: user?.name,
          email: user?.email,
          image: user?.image,
        },
        sessionStatus: "authenticated",
      };
    }
    return { sessionUser: null, sessionStatus: "unauthenticated" };
  }

  return { sessionUser: null, sessionStatus: status };
}

function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function signInErrorMessage(code: string | undefined): string {
  if (isAuthUnavailableCode(code)) {
    return authUnavailableMessage();
  }
  const limited = parseRateLimitedCode(code);
  if (limited.limited) {
    return rateLimitedMessage(limited.retryAfterSec);
  }
  return "Неверный email или пароль";
}

function postRegisterSignInErrorMessage(code: string | undefined): string {
  if (isAuthUnavailableCode(code)) {
    return "Аккаунт создан, но вход временно недоступен. Войдите вручную чуть позже.";
  }
  const limited = parseRateLimitedCode(code);
  if (limited.limited) {
    return limited.retryAfterSec
      ? `Аккаунт создан, но слишком много попыток входа. Подождите ${limited.retryAfterSec} сек. и войдите вручную.`
      : "Аккаунт создан, но слишком много попыток входа. Войдите вручную чуть позже.";
  }
  return "Аккаунт создан, но войти не удалось. Попробуйте войти вручную.";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  modal: null,
  op: null,
  error: null,
  logoutError: null,
  requestSeq: 0,
  suppressStaleSession: false,
  sessionUser: null,
  sessionStatus: "loading",

  setSession: (user, status) => {
    const { op, suppressStaleSession } = get();

    if (status === "authenticated") {
      if (op === "logout" || suppressStaleSession) return;
      set({ sessionUser: user, sessionStatus: status });
      return;
    }

    if (suppressStaleSession) {
      // Не снимаем suppress на loading — иначе stale authenticated снова пролезет.
      if (status === "loading") return;
      set({
        sessionUser: null,
        sessionStatus: "unauthenticated",
        suppressStaleSession: false,
      });
      return;
    }

    set({ sessionUser: user, sessionStatus: status });
  },

  openModal: (modal) => {
    set({ modal, error: null });
  },

  closeModal: () => {
    const { op, requestSeq } = get();
    set({
      modal: null,
      error: null,
      op: op === "logout" ? "logout" : null,
      requestSeq:
        op === "login" || op === "register" ? requestSeq + 1 : requestSeq,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearLogoutError: () => {
    set({ logoutError: null });
  },

  login: async ({ email, password }) => {
    const seq = get().requestSeq + 1;
    set({ op: "login", error: null, requestSeq: seq });

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (get().requestSeq !== seq) return false;
        set({
          op: null,
          error: signInErrorMessage(result.code),
        });
        return false;
      }

      notifySessionChanged();
      // Сессия уже валидна — не держим suppress от предыдущего logout.
      if (get().requestSeq !== seq) {
        set({ suppressStaleSession: false });
        return false;
      }
      set({
        modal: null,
        op: null,
        error: null,
        suppressStaleSession: false,
      });
      return true;
    } catch {
      if (get().requestSeq !== seq) return false;
      set({ op: null, error: "Не удалось войти" });
      return false;
    }
  },

  register: async (input) => {
    const seq = get().requestSeq + 1;
    set({ op: "register", error: null, requestSeq: seq });
    let accountCreated = false;

    try {
      const result = await registerUser(input);

      if ("error" in result && result.error) {
        if (get().requestSeq !== seq) return false;
        set({ op: null, error: result.error });
        return false;
      }

      // Аккаунт уже создан — auto-signIn и сообщения об ошибке входа
      // не отменяем из‑за closeModal (пользователь должен узнать).
      accountCreated = true;
      const email =
        "user" in result && result.user?.email
          ? result.user.email
          : input.email;

      const signInResult = await signIn("credentials", {
        email,
        password: input.password,
        redirect: false,
      });

      if (signInResult?.error) {
        set({
          modal: "login",
          op: null,
          error: postRegisterSignInErrorMessage(signInResult.code),
        });
        return false;
      }

      notifySessionChanged();
      if (get().requestSeq !== seq) {
        set({ suppressStaleSession: false });
        return false;
      }
      set({
        modal: null,
        op: null,
        error: null,
        suppressStaleSession: false,
      });
      return true;
    } catch {
      if (accountCreated) {
        set({
          modal: "login",
          op: null,
          error:
            "Аккаунт создан, но войти не удалось. Попробуйте войти вручную.",
        });
        return false;
      }
      if (get().requestSeq !== seq) return false;
      set({ op: null, error: "Ошибка при регистрации" });
      return false;
    }
  },

  logout: async () => {
    set({ op: "logout", logoutError: null });

    try {
      await signOut({ redirect: false });
      set({
        op: null,
        logoutError: null,
        sessionUser: null,
        sessionStatus: "unauthenticated",
        suppressStaleSession: true,
      });
      notifySessionChanged();
      return true;
    } catch {
      set({ op: null, logoutError: "Не удалось выйти" });
      return false;
    }
  },
}));
