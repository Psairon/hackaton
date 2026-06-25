# Pages

Путь: `src/pages/`

## PresentationPage.vue — `/`
Публичная landing-страница для презентации проекта жюри.
- Тёмный фон, hero-секция с названием и кнопками
- 4 feature-карточки (KPI, метрики команды, AI, роли)
- Секция стека технологий (chips)
- Кнопки: «Войти» → `/login`, «Демо дашборд» → `/dashboard`
- Не требует авторизации (`meta.public: true`)

## LoginPage.vue — `/login`
Форма входа.
- Поля: email, password
- Вызывает `auth.login()` из Pinia стора
- При успехе редиректит на `redirect` query-param или `/dashboard`
- Показывает `auth.error` при неудаче
- Не требует авторизации (`meta.public: true`)

## DashboardPage.vue — `/dashboard`
Главный дашборд (пока с mock-данными).
- Требует авторизации (`meta.requiresAuth: true`)
- Layout: AppLayout
- Сетка: 4 KpiCard → 2 ChartWidget (line + doughnut) → TableWidget
- Mock данные встроены в компонент — заменить на Pinia стор после готовности API

## Заготовки (не реализованы, только маршруты)
- `/team` — метрики по участникам команды
- `/reports` — отчёты за период
- `/ai` — AI-анализ через Claude API
- `/settings` — настройки профиля и системы
