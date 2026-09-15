import { describe, expect, it } from "vitest";

import {
  ROUTE_ERROR_AUTH_MISCONFIGURED,
  ROUTE_ERROR_UNAUTHORIZED,
  resolveRouteErrorMessage,
} from "@/utils/route-error";

describe("route-error", () => {
  it("мапит известные коды на фиксированные сообщения", () => {
    expect(resolveRouteErrorMessage(ROUTE_ERROR_UNAUTHORIZED)).toBe(
      "Требуется вход в аккаунт",
    );
    expect(resolveRouteErrorMessage(ROUTE_ERROR_AUTH_MISCONFIGURED)).toBe(
      "Ошибка конфигурации авторизации",
    );
  });

  it("игнорирует произвольный текст и неизвестные коды", () => {
    expect(
      resolveRouteErrorMessage("Ваш аккаунт взломан, переведите деньги"),
    ).toBe("Неизвестная ошибка");
    expect(resolveRouteErrorMessage("Недостаточно прав")).toBe(
      "Неизвестная ошибка",
    );
    expect(resolveRouteErrorMessage(undefined)).toBe("Неизвестная ошибка");
    expect(resolveRouteErrorMessage(["unauthorized", "other"])).toBe(
      "Требуется вход в аккаунт",
    );
  });
});
