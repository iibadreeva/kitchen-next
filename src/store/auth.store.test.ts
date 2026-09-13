import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/actions/register", () => ({
  registerUser: vi.fn(),
}));

import { signIn, signOut } from "next-auth/react";
import { registerUser } from "@/actions/register";
import {
  AUTH_SESSION_CHANGED_EVENT,
  resolveSessionMirror,
  useAuthStore,
} from "@/store/auth.store";

const validLogin = { email: "a@b.ru", password: "Password1" };
const validRegister = {
  email: "a@b.ru",
  password: "Password1",
  confirmPassword: "Password1",
};

function stubWindowDispatch() {
  const dispatchEvent = vi.fn();
  vi.stubGlobal(
    "Event",
    class FakeEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  );
  vi.stubGlobal("window", { dispatchEvent });
  return dispatchEvent;
}

describe("resolveSessionMirror", () => {
  it("authenticated без id → unauthenticated и null user", () => {
    expect(
      resolveSessionMirror("authenticated", {
        id: undefined,
        name: "Анна",
        email: "a@b.ru",
      }),
    ).toEqual({
      sessionUser: null,
      sessionStatus: "unauthenticated",
    });
  });

  it("authenticated с id → зеркало пользователя", () => {
    expect(
      resolveSessionMirror("authenticated", {
        id: "1",
        name: "Анна",
        email: "a@b.ru",
        image: null,
      }),
    ).toEqual({
      sessionUser: {
        id: "1",
        name: "Анна",
        email: "a@b.ru",
        image: null,
      },
      sessionStatus: "authenticated",
    });
  });

  it("loading / unauthenticated → без user", () => {
    expect(resolveSessionMirror("loading", { id: "1" })).toEqual({
      sessionUser: null,
      sessionStatus: "loading",
    });
    expect(resolveSessionMirror("unauthenticated", undefined)).toEqual({
      sessionUser: null,
      sessionStatus: "unauthenticated",
    });
  });
});

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    useAuthStore.setState({
      modal: null,
      op: null,
      error: null,
      logoutError: null,
      requestSeq: 0,
      suppressStaleSession: false,
      sessionUser: null,
      sessionStatus: "loading",
    });
  });

  it("login: маппит неверный пароль", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      code: "credentials",
      status: 401,
      ok: false,
      url: null,
    });

    const ok = await useAuthStore.getState().login(validLogin);

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe("Неверный email или пароль");
    expect(useAuthStore.getState().op).toBeNull();
  });

  it("login: маппит rate_limited", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      code: "rate_limited:42",
      status: 401,
      ok: false,
      url: null,
    });

    await useAuthStore.getState().login(validLogin);

    expect(useAuthStore.getState().error).toBe(
      "Слишком много попыток. Подождите 42 сек. и попробуйте снова.",
    );
  });

  it("login: успех закрывает модалку и шлёт событие", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      code: undefined,
      status: 200,
      ok: true,
      url: null,
    } as Awaited<ReturnType<typeof signIn>>);

    const dispatchEvent = stubWindowDispatch();
    useAuthStore.getState().openModal("login");
    const ok = await useAuthStore.getState().login(validLogin);

    expect(ok).toBe(true);
    expect(useAuthStore.getState().modal).toBeNull();
    expect(useAuthStore.getState().op).toBeNull();
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: AUTH_SESSION_CHANGED_EVENT }),
    );
  });

  it("login: closeModal во время запроса игнорирует ошибку", async () => {
    let resolveSignIn!: (value: Awaited<ReturnType<typeof signIn>>) => void;
    vi.mocked(signIn).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );

    useAuthStore.getState().openModal("login");
    const pending = useAuthStore.getState().login(validLogin);
    expect(useAuthStore.getState().op).toBe("login");

    useAuthStore.getState().closeModal();
    expect(useAuthStore.getState().modal).toBeNull();
    expect(useAuthStore.getState().op).toBeNull();

    resolveSignIn({
      error: "CredentialsSignin",
      code: "credentials",
      status: 401,
      ok: false,
      url: null,
    });

    const ok = await pending;
    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("register: ошибка Server Action", async () => {
    vi.mocked(registerUser).mockResolvedValue({ error: "Занято" });

    const ok = await useAuthStore.getState().register(validRegister);

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBe("Занято");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("register: closeModal после создания аккаунта всё равно вызывает signIn", async () => {
    let resolveRegister!: (value: Awaited<ReturnType<typeof registerUser>>) => void;
    vi.mocked(registerUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    );
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      code: undefined,
      status: 200,
      ok: true,
      url: null,
    } as Awaited<ReturnType<typeof signIn>>);
    const dispatchEvent = stubWindowDispatch();

    useAuthStore.getState().openModal("signup");
    const pending = useAuthStore.getState().register(validRegister);

    useAuthStore.getState().closeModal();
    expect(useAuthStore.getState().modal).toBeNull();

    resolveRegister({
      ok: true,
      user: { id: "1", email: "a@b.ru" },
    });

    const ok = await pending;

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "a@b.ru",
      password: validRegister.password,
      redirect: false,
    });
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: AUTH_SESSION_CHANGED_EVENT }),
    );
    // UI уже закрыт пользователем — stale success не обязан возвращать true
    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it("register: частичный успех — аккаунт создан, signIn failed", async () => {
    vi.mocked(registerUser).mockResolvedValue({
      ok: true,
      user: { id: "1", email: "a@b.ru" },
    });
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      code: "auth_unavailable",
      status: 401,
      ok: false,
      url: null,
    });

    const ok = await useAuthStore.getState().register(validRegister);

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toMatch(/вход временно недоступен/i);
    expect(useAuthStore.getState().modal).toBe("login");
  });

  it("register: closeModal не глотает ошибку signIn после создания аккаунта", async () => {
    let resolveRegister!: (value: Awaited<ReturnType<typeof registerUser>>) => void;
    vi.mocked(registerUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    );
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      code: "auth_unavailable",
      status: 401,
      ok: false,
      url: null,
    });

    useAuthStore.getState().openModal("signup");
    const pending = useAuthStore.getState().register(validRegister);
    useAuthStore.getState().closeModal();

    resolveRegister({
      ok: true,
      user: { id: "1", email: "a@b.ru" },
    });

    const ok = await pending;

    expect(ok).toBe(false);
    expect(useAuthStore.getState().error).toMatch(/вход временно недоступен/i);
    expect(useAuthStore.getState().modal).toBe("login");
  });

  it("logout: пишет logoutError, не form error", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("network"));
    useAuthStore.setState({ error: "старая ошибка формы" });

    const ok = await useAuthStore.getState().logout();

    expect(ok).toBe(false);
    expect(useAuthStore.getState().logoutError).toBe("Не удалось выйти");
    expect(useAuthStore.getState().error).toBe("старая ошибка формы");
    expect(useAuthStore.getState().op).toBeNull();
  });

  it("logout: успех", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    const dispatchEvent = stubWindowDispatch();

    const ok = await useAuthStore.getState().logout();

    expect(ok).toBe(true);
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: AUTH_SESSION_CHANGED_EVENT }),
    );
  });

  it("logout: сразу сбрасывает зеркало сессии", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    stubWindowDispatch();
    useAuthStore.setState({
      sessionUser: { id: "1", email: "a@b.ru" },
      sessionStatus: "authenticated",
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().sessionUser).toBeNull();
    expect(useAuthStore.getState().sessionStatus).toBe("unauthenticated");
  });

  it("setSession: после logout игнорирует stale authenticated", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    stubWindowDispatch();
    useAuthStore.setState({
      sessionUser: { id: "1", email: "a@b.ru" },
      sessionStatus: "authenticated",
    });

    await useAuthStore.getState().logout();
    useAuthStore.getState().setSession(
      { id: "1", email: "a@b.ru" },
      "authenticated",
    );

    expect(useAuthStore.getState().sessionUser).toBeNull();
    expect(useAuthStore.getState().sessionStatus).toBe("unauthenticated");
    expect(useAuthStore.getState().suppressStaleSession).toBe(true);
  });

  it("login: после logout снимает suppress и принимает authenticated", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      code: undefined,
      status: 200,
      ok: true,
      url: null,
    } as Awaited<ReturnType<typeof signIn>>);
    stubWindowDispatch();

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().suppressStaleSession).toBe(true);

    const ok = await useAuthStore.getState().login(validLogin);
    expect(ok).toBe(true);
    expect(useAuthStore.getState().suppressStaleSession).toBe(false);

    useAuthStore.getState().setSession(
      { id: "2", email: "a@b.ru" },
      "authenticated",
    );
    expect(useAuthStore.getState().sessionUser).toEqual({
      id: "2",
      email: "a@b.ru",
    });
    expect(useAuthStore.getState().sessionStatus).toBe("authenticated");
  });

  it("register: после logout снимает suppress и принимает authenticated", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    vi.mocked(registerUser).mockResolvedValue({
      ok: true,
      user: { id: "2", email: "a@b.ru" },
    });
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      code: undefined,
      status: 200,
      ok: true,
      url: null,
    } as Awaited<ReturnType<typeof signIn>>);
    stubWindowDispatch();

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().suppressStaleSession).toBe(true);

    const ok = await useAuthStore.getState().register(validRegister);
    expect(ok).toBe(true);
    expect(useAuthStore.getState().suppressStaleSession).toBe(false);

    useAuthStore.getState().setSession(
      { id: "2", email: "a@b.ru" },
      "authenticated",
    );
    expect(useAuthStore.getState().sessionUser).toEqual({
      id: "2",
      email: "a@b.ru",
    });
  });

  it("setSession: loading после logout не снимает suppress", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    stubWindowDispatch();

    await useAuthStore.getState().logout();
    useAuthStore.getState().setSession(null, "loading");

    expect(useAuthStore.getState().suppressStaleSession).toBe(true);
    expect(useAuthStore.getState().sessionStatus).toBe("unauthenticated");

    useAuthStore.getState().setSession({ id: "1" }, "authenticated");
    expect(useAuthStore.getState().sessionUser).toBeNull();
  });

  it("setSession: unauthenticated после logout снимает suppress", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    stubWindowDispatch();

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().suppressStaleSession).toBe(true);

    useAuthStore.getState().setSession(null, "unauthenticated");

    expect(useAuthStore.getState().suppressStaleSession).toBe(false);

    useAuthStore.getState().setSession(
      { id: "2", email: "b@b.ru" },
      "authenticated",
    );
    expect(useAuthStore.getState().sessionUser).toEqual({
      id: "2",
      email: "b@b.ru",
    });
    expect(useAuthStore.getState().sessionStatus).toBe("authenticated");
  });

  it("setSession: во время logout игнорирует authenticated", async () => {
    let resolveSignOut!: () => void;
    vi.mocked(signOut).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignOut = () => resolve(undefined as never);
        }),
    );

    useAuthStore.setState({
      sessionUser: { id: "1" },
      sessionStatus: "authenticated",
    });
    const pending = useAuthStore.getState().logout();
    expect(useAuthStore.getState().op).toBe("logout");

    useAuthStore.getState().setSession({ id: "stale" }, "authenticated");
    expect(useAuthStore.getState().sessionUser).toEqual({ id: "1" });

    stubWindowDispatch();
    resolveSignOut();
    await pending;
  });
});
