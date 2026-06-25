# Router

Путь: `src/router/index.ts`

## Маршруты
| Path | Name | Component | Auth |
|------|------|-----------|------|
| `/` | Presentation | PresentationPage | public |
| `/login` | Login | LoginPage | public |
| `/dashboard` | Dashboard | DashboardPage | requiresAuth |
| `/team` | — | TeamPage (не создан) | requiresAuth |
| `/reports` | — | ReportsPage (не создан) | requiresAuth |
| `/ai` | — | AiPage (не создан) | requiresAuth |
| `/settings` | — | SettingsPage (не создан) | requiresAuth |

## Navigation Guard
```
beforeEach:
  1. Если токен в localStorage — вызвать auth.init() (fetchMe)
  2. Если маршрут requiresAuth и !isAuthenticated → редирект на /login?redirect=<path>
```

## Добавление новой страницы
1. Создать `src/pages/<Name>Page.vue`
2. Добавить маршрут в `routes[]`
3. Добавить пункт в `AppSidebar.vue → navItems`
4. Задокументировать в `docs/PAGES.md`
