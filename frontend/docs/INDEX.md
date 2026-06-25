# Frontend Docs Index

Читай этот файл первым в новой сессии — он даёт полный контекст.

## Документы
| Файл | Содержимое |
|------|-----------|
| [COMPONENTS.md](./COMPONENTS.md) | Layout компоненты |
| [PAGES.md](./PAGES.md) | Все страницы: статус, маршруты, зависимости |
| [STORES.md](./STORES.md) | Pinia сторы: state, actions, USE_MOCK флаг |
| [API.md](./API.md) | API клиент, все api-файлы, контракты |
| [ROUTER.md](./ROUTER.md) | Маршруты, guard, вложенные роуты |

## Стек
- Vue 3 + `<script setup lang="ts">`
- **Naive UI** (замена PrimeVue — важно!)
- Pinia, Vue Router 4, Axios, Chart.js 4, @vueuse/core

## USE_MOCK флаг
Во всех сторах есть `const USE_MOCK = true`.
При `true` — данные берутся из `src/api/mocks.ts`, API не вызывается.
Переключить на `false` когда бэкенд готов.

## Статус реализации
| Блок | Статус |
|------|--------|
| Типы (`src/types/index.ts`) | ✅ |
| API клиент + все api файлы | ✅ |
| Mock данные (`src/api/mocks.ts`) | ✅ |
| Все Pinia сторы | ✅ |
| Router + auth guard | ✅ |
| AppLayout + AppSidebar | ✅ |
| LoginPage + RegisterPage | ✅ |
| ProjectsPage | ✅ |
| ProjectDetailPage (спринты + участники) | ✅ |
| SprintDetailPage (табы) | ✅ |
| TasksPage (фильтры + импорт) | ✅ |
| KanbanPage (drag & drop) | ✅ |
| EstimatesPage | ✅ |
| EstimateDetailPage (связка задач) | ✅ |
| StatsPage (Chart.js) | ✅ |
| AiPage | ✅ |

## Соглашения
- API вызовы только в сторах — НИКОГДА в компонентах
- Каждый компонент: loading / error / empty / success
- Naive UI для всего UI — никаких inline стилей
- Новая страница → `src/pages/` + роутер + этот docs/INDEX.md
