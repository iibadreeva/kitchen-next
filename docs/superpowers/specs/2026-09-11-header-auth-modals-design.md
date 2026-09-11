# Header auth-кнопки → модалки — дизайн

Дата: 2026-09-11  
Область: `src/components/UI/header/*`, `src/components/UI/modals/*`

## Цель

Подвесить «Войти» / «Регистрация» к `LoginModal` и `RegistrationModal` через React state, без URL.

## Вне scope

- Sync с query/hash или страницами `/login`, `/signup`
- Переключение login ↔ signup внутри форм
- Реальная auth API / сессии

## Подход

Вариант 2: action-based `AUTH_ITEMS` + колбэк `onAction` + один state `authModal` в `Header`.

## Состояние

```ts
type AuthModal = null | "login" | "signup";
const [authModal, setAuthModal] = useState<AuthModal>(null);
```

- `LoginModal`: `isOpen={authModal === "login"}`, `onClose={() => setAuthModal(null)}`
- `RegistrationModal`: `isOpen={authModal === "signup"}`, `onClose={() => setAuthModal(null)}`
- Mobile: закрыть меню, затем `setAuthModal(action)`

## Конфиг

`AuthItem`: `{ action: "login" | "signup"; label; kind }` — без `href`.

## AuthActions

- `onAction: (action: AuthAction) => void`
- `<button type="button">` вместо `<a>`
- Стили bar/menu без изменений по смыслу

## Заголовки модалок

- Login: «Войти»
- Registration: «Создать аккаунт»

## Критерии успеха

- Кнопки открывают нужную модалку; закрытие работает
- Mobile: меню закрывается перед модалкой
- URL не меняется; обе модалки не открыты сразу
