# Pinia Stores

Путь: `src/stores/`

## auth.ts — useAuthStore
Управляет авторизацией пользователя.

### State
| Поле | Тип | Описание |
|------|-----|----------|
| `user` | `User \| null` | Текущий пользователь |
| `loading` | `boolean` | Флаг запроса |
| `error` | `string \| null` | Текст ошибки для UI |

### Getters
- `isAuthenticated` — `!!user`
- `isAdmin` — `user.role === 'admin'`

### Actions
- `login(email, password)` — POST `/api/auth/login`, сохраняет токен в localStorage
- `fetchMe()` — GET `/api/auth/me`, заполняет `user`
- `logout()` — POST `/api/auth/logout`, чистит токен и user
- `init()` — вызывается в router guard: восстанавливает сессию по токену из localStorage

---

## ui.ts — useUiStore
Управляет состоянием UI.

### State
| Поле | Тип | Описание |
|------|-----|----------|
| `sidebarCollapsed` | `boolean` | Свёрнут ли сайдбар |
| `theme` | `'light' \| 'dark'` | Текущая тема |

### Actions
- `toggleSidebar()` — переключает коллапс
- `toggleTheme()` — переключает тему + ставит `data-theme` на `<html>`
