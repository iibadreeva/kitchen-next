# Zustand auth store — дизайн

Дата: 2026-09-13  
Область: `src/store/auth.store.ts`, `src/providers/*`, header auth UI, формы login/register

## Цель

Клиентский слой auth на Zustand:

- оркестрация login / register / logout (вызовы Auth.js и Server Action);
- состояние auth-модалок;
- зеркало session для UI.

## Вне scope

- Мобильное меню (`useState` в Header)
- Дублирование JWT / cookies
- Хранение полей форм и паролей в store
- Изменение server `registerUser`, authorize, rate-limit

## Источник правды

| Данные | Источник |
|--------|----------|
| Session / user | Auth.js (`SessionProvider` + JWT cookie) |
| UI session в компонентах | Zustand (синхронизация из Auth.js) |
| Модалка / операция / ошибка API | Zustand |

## API store

Файл: `src/store/auth.store.ts`

```ts
type AuthModal = null | "login" | "signup";
type AuthOp = "login" | "register" | "logout";
type SessionStatus = "loading" | "authenticated" | "unauthenticated";

{
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
   * После logout игнорировать stale authenticated из Auth.js,
   * пока sync не подтвердит unauthenticated или не пройдёт успешный login/register.
   */
  suppressStaleSession: boolean;
  sessionUser: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  sessionStatus: SessionStatus;

  setSession: (user, status) => void;
  openModal: (modal: "login" | "signup") => void;
  closeModal: () => void;
  clearError: () => void;
  clearLogoutError: () => void;
  login: (input: { email: string; password: string }) => Promise<boolean>;
  register: (input: FormDataType) => Promise<boolean>;
  logout: () => Promise<boolean>;
}
```

### Поведение

- `login` → `signIn("credentials", { redirect: false })` + маппинг `auth-messages`
- `register` → `registerUser` → при успехе auto `signIn` (как раньше в форме)
- `logout` → `signOut({ redirect: false })`; при успехе сразу `sessionUser: null`, `sessionStatus: "unauthenticated"`, `suppressStaleSession: true`, затем событие refresh
- успех login/register → закрытие модалки в store; событие `AUTH_SESSION_CHANGED_EVENT` → в `AuthSessionSync`: `update()` сессии Auth.js + `router.refresh()`
- login не выставляет `sessionUser` сам — ждёт sync из Auth.js
- успешный login/register снимает `suppressStaleSession` (иначе быстрый вход после logout может «залипнуть» на guest)
- `setSession`: при `op === "logout"` или `suppressStaleSession` игнорирует `authenticated`; `loading` при suppress не снимает флаг; `unauthenticated` снимает suppress
- `closeModal` во время login/register бампит `requestSeq` (stale-ответ не пишет error); после создания аккаунта ошибка auto-signIn не глотается

## Sync

`src/providers/auth-session-sync.tsx` внутри `SessionProvider`:

1. `useSession()` → `resolveSessionMirror` → `setSession`
2. слушатель `AUTH_SESSION_CHANGED_EVENT` → `update()` (клиентская session) → `router.refresh()` (RSC)

`resolveSessionMirror`: статус `authenticated` без непустого `user.id` мапится в `unauthenticated` + `sessionUser: null` (не показываем «гостевые» кнопки при битой сессии и наоборот).

## Потребители

- Header: `modal` / `openModal` / `closeModal`
- AuthActions: `sessionUser` / `sessionStatus` / `logout` / `openModal` / `logoutError`
- LoginForm / RegistrationForm: `login` / `register` / `error` / `op`; поля локально
- Модалки: `isOpen` / `onClose` из store (через Header)

## Соглашения

Папка `src/store/` (ед. число). Следующие домены — отдельные файлы, не общий `ui.store`.

## Критерии успеха

- Login / register / logout работают как раньше
- Модалки открываются/закрываются через store
- Session в UI совпадает с Auth.js после refresh; logout не держит имя и не откатывается из stale sync
- Мобильное меню по-прежнему локальный state
