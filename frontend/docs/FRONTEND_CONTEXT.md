# Frontend Context — Hackaton Dashboard

> Актуальное состояние кодовой базы. Обновляется по мере разработки.

---

## Стек

| Пакет | Версия | Назначение |
|-------|--------|------------|
| Vue 3 | ^3.4 | фреймворк (Composition API, `<script setup>` only) |
| Vite | ^5.3 | сборщик |
| TypeScript | ^5.3 | типизация |
| Vue Router 4 | ^4.3 | маршрутизация |
| Pinia | ^2.1 | state management |
| Naive UI | ^2.40 | UI-компоненты (тёмная тема по умолчанию) |
| Axios | ^1.7 | HTTP-клиент |
| Chart.js | ^4.4 | графики (используется через Naive UI или напрямую) |

> ⚠️ В промпте архитектора был указан PrimeVue — по факту используется **Naive UI**.
> Все UI-компоненты берём только из Naive UI (префикс `N`).

---

## Запуск

```bash
cd frontend
cp .env.example .env   # при необходимости изменить VITE_API_URL
npm install
npm run dev            # http://localhost:5173
```

---

## Переменные окружения

Файл: `frontend/.env`

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `VITE_API_URL` | ❌ | URL бэкенда, default `http://localhost:3000/api/v1` |

---

## Структура src/

```
src/
├── App.vue                    # корень: NConfigProvider(darkTheme) + auth.init()
├── main.ts                    # createApp, Pinia, Router
├── router/
│   └── index.ts               # маршруты + navigation guard
├── stores/
│   ├── auth.ts                # useAuthStore — логин, fetchMe, logout, init
│   └── ui.ts                  # useUiStore — sidebar, theme toggle
├── api/
│   ├── client.ts              # axios instance, JWT interceptor, 401 → /login
│   └── auth.ts                # authApi.login, authApi.me, authApi.logout
├── types/
│   └── index.ts               # все TypeScript интерфейсы и типы
├── pages/                     # route-level компоненты
│   ├── LoginPage.vue
│   ├── RegisterPage.vue
│   ├── ProjectsPage.vue
│   ├── ProjectDetailPage.vue
│   ├── SprintDetailPage.vue   # родитель с табами
│   ├── TasksPage.vue
│   ├── KanbanPage.vue
│   ├── EstimatesPage.vue
│   ├── EstimateDetailPage.vue
│   ├── StatsPage.vue
│   ├── AiPage.vue
│   ├── DashboardPage.vue
│   └── PresentationPage.vue
└── components/
    ├── Layout/
    │   ├── AppLayout.vue
    │   ├── AppSidebar.vue
    │   └── AppHeader.vue
    └── Dashboard/
        ├── KpiCard.vue
        ├── ChartWidget.vue
        └── TableWidget.vue
```

---

## Маршруты (router/index.ts)

| Путь | Компонент | Meta | Описание |
|------|-----------|------|----------|
| `/` | — | — | redirect → `/projects` |
| `/login` | LoginPage | `guest` | гости только |
| `/register` | RegisterPage | `guest` | гости только |
| `/projects` | ProjectsPage | `auth` | список проектов |
| `/projects/new` | ProjectDetailPage | `auth` | создание проекта |
| `/projects/:id` | ProjectDetailPage | `auth` | детали проекта |
| `/projects/:id/sprints/:sprintId` | SprintDetailPage | `auth` | спринт + дочерние роуты |
| `…/tasks` | TasksPage | — | дерево задач |
| `…/kanban` | KanbanPage | — | канбан доска |
| `…/estimates` | EstimatesPage | — | список заявок |
| `…/estimates/:estimateId` | EstimateDetailPage | — | детали заявки |
| `…/stats` | StatsPage | — | дашборд/статистика |
| `…/ai` | AiPage | — | AI саммари и риски |
| `/:pathMatch(.*)` | — | — | redirect → `/projects` |

**Navigation guard:** нет `accessToken` в localStorage + `meta.auth` → редирект на `/login` (с `query.redirect`). Есть токен + `meta.guest` → редирект на `/projects`.

---

## API клиент (api/client.ts)

```ts
baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
```

- **Request interceptor:** добавляет `Authorization: Bearer <token>` из `localStorage`
- **Response interceptor:** при `401` — чистит `accessToken`, редиректит на `/login`

---

## Auth store (stores/auth.ts)

```ts
// state
user: User | null
loading: boolean
error: string | null

// computed
isAuthenticated: boolean   // !!user
isAdmin: boolean           // user.role === 'admin'

// actions
login(email, password)     // POST /auth/login → сохраняет accessToken → fetchMe()
fetchMe()                  // GET /auth/me → user
logout()                   // POST /auth/logout (может 404) → чистит user + token
init()                     // вызывается в App.vue onMounted — восстанавливает сессию
```

> ⚠️ `logout()` вызывает `POST /auth/logout` — этого эндпоинта нет на бэкенде.
> Ошибка тихо игнорируется (`catch {}`), токен всё равно удаляется. Работает корректно.

---

## TypeScript типы (types/index.ts)

```ts
UserRole     = 'admin' | 'manager' | 'pm' | 'teamlead'
SprintStatus = 'planned' | 'active' | 'archived'
TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
TaskType     = 'frontend' | 'backend' | 'qa' | 'devops' | 'analytics' | 'techwriter' | 'project' | 'other'
Department   = TaskType

User, Project, Sprint, Task, Estimate, EstimateItem  // основные сущности
SprintStats                                           // для дашборда
AuthTokens, ApiError                                  // утилиты
```

---

## Соглашения по коду

- `<script setup lang="ts">` на каждом компоненте — Options API запрещён
- `defineProps<{}>()` — полная типизация пропсов
- API вызовы только в Pinia сторах или composables, **никогда** внутри компонентов
- Каждый компонент обрабатывает состояния: `loading` / `error` / `empty` / `success`
- Все UI-компоненты из Naive UI, никакого кастомного CSS там где Naive UI справляется
- Никаких inline стилей

---

## Статус реализации

- [x] Инициализация (Vite, Vue 3, Pinia, Router, Naive UI)
- [x] Auth store + API клиент
- [x] Router + navigation guard
- [x] AppLayout, AppSidebar, AppHeader
- [x] Dashboard компоненты (KpiCard, ChartWidget, TableWidget)
- [x] LoginPage, RegisterPage
- [ ] ProjectsPage, ProjectDetailPage
- [ ] SprintDetailPage + все дочерние страницы
- [ ] Stores для Projects, Sprints, Tasks, Estimates, Stats
- [ ] API клиенты для всех доменов

---

## Известные проблемы / TODO

- [ ] `authApi.logout` вызывает несуществующий эндпоинт (безвредно, см. выше)
- [ ] Naive UI тема: сейчас хардкод `darkTheme` в App.vue — `useUiStore.theme` не подключён к провайдеру
- [ ] `authApi.me()` ожидает `User` напрямую — если бэкенд включит ResponseInterceptor, сломается (нужен `data.data`)
