# Components

## Layout
Путь: `src/components/Layout/`

### AppLayout.vue
Корневой layout для авторизованных страниц. Оборачивает весь контент.
- Props: `title?: string` — заголовок страницы в хедере
- Slots: `default` — контент страницы
- Использует: AppSidebar + AppHeader

### AppSidebar.vue
Левая навигационная панель.
- Состояние свёрнутости: `ui.sidebarCollapsed` (Pinia)
- Пункты меню: Dashboard, Team, Reports, AI Анализ, Settings
- Отображает имя пользователя из `auth.user.name`
- Кнопка выхода: вызывает `auth.logout()` и редиректит на `/login`

### AppHeader.vue
Шапка страницы (sticky top).
- Props: `title?: string`
- Кнопка коллапса сайдбара
- Переключатель темы (light/dark)
- Чип с именем и ролью пользователя

---

## Dashboard
Путь: `src/components/Dashboard/`

### KpiCard.vue
Карточка одного KPI-показателя.
- Props: `metric: KpiMetric`, `loading?: boolean`
- States: loading (shimmer), success
- Показывает: label, value, unit, trend (% + иконка стрелки)
- Тип `KpiMetric` → `src/types/index.ts`

### ChartWidget.vue
Обёртка над Chart.js. Рендерит любой из поддерживаемых типов.
- Props: `title: string`, `type: ChartType`, `data: ChartData`, `loading?: boolean`, `height?: number`
- Поддерживаемые типы: `line | bar | doughnut | pie`
- States: loading (shimmer), chart
- Chart.js регистрирует только нужные контроллеры (tree-shaking)
- Пересоздаёт график при изменении `data` (watcher)

### TableWidget.vue
Простая таблица данных без зависимости от PrimeVue DataTable.
- Props: `title: string`, `columns: { field, header, width? }[]`, `rows: Record<string, any>[]`, `loading?: boolean`
- States: loading (skeleton rows), empty (пусто), success
