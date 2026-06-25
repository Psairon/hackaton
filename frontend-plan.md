# Frontend Implementation Plan — UI-01 / UI-08 / UI-09

## Архитектура фронта (новая)

### Маршруты

```
/login                              LoginPage
/register                           RegisterPage
/projects                           ProjectsPage
/projects/:id                       ProjectDetailPage
/employees                          EmployeesPage
/control-objects/:id                ControlObjectPage  ← Dashboard (UI-01)
/control-objects/:id/ai             AiAnalysisPage     ← NEW (UI-08)
/control-objects/:id/data           DataPage           ← NEW (UI-09)
  ?tab=baseline
  ?tab=jira
  ?tab=employees
  ?tab=links
  ?tab=review
```

### Структура страниц

```
src/
  pages/
    ControlObjectPage.vue      ← Dashboard (UI-01) — полный рефакторинг
    AiAnalysisPage.vue         ← NEW (UI-08)
    DataPage.vue               ← NEW (UI-09) с 5 вкладками
    EmployeesPage.vue          ← уже есть, доработка
  api/
    controlObjects.ts          ← добавить AI endpoints
    employees.ts               ← уже есть
  components/
    dashboard/
      KpiCard.vue              ← карточка KPI
      ProjectStatusCard.vue    ← цветовой статус проекта
      BaselineUsageChart.vue   ← горизонтальный chart
      DirectionTable.vue       ← план/факт по направлениям
      RoleTable.vue            ← план/факт по ролям
      RiskList.vue             ← топ рисков
      DeadlineCard.vue         ← контроль сроков
      ReviewCard.vue           ← требует проверки
      AiSummaryCard.vue        ← правая колонка AI
    ai/
      DeviationCard.vue
      RiskZoneCard.vue
      QuestionList.vue
      RecommendationList.vue
      ExplanationCollapse.vue
    data/
      BaselineTab.vue
      JiraTab.vue
      EmployeesTab.vue
      LinksTab.vue
      ReviewTab.vue
```

---

## Этапы реализации

### Этап 1. Роутинг и страницы-заглушки (1 ч)

- [ ] Добавить маршруты в `router/index.ts`:
  - `/control-objects/:id/ai` → `AiAnalysisPage`
  - `/control-objects/:id/data` → `DataPage`
- [ ] Создать `AiAnalysisPage.vue` (заглушка)
- [ ] Создать `DataPage.vue` (заглушка с вкладками)
- [ ] Добавить навигацию в sidebar/header

### Этап 2. Dashboard — UI-01 (4 ч)

Полный рефакторинг `ControlObjectPage.vue`:

**2.1 Двухколоночный layout:**
- Левая (≈75%): блоки KPI, статус, baseline, направления, роли, риски, сроки, проверка
- Правая (≈25%): AI Summary

**2.2 Блоки (сверху вниз):**

| # | Блок | Данные | Компонент |
|---|------|--------|-----------|
| 1 | Информация об объекте | `controlObject`, `lastJiraImport`, `lastCalculated` | Header card |
| 2 | KPI (9 карточек) | `dashboard.kpi` | `KpiCard` ×9 |
| 3 | Общий статус проекта | `dashboard.projectStatus` | `ProjectStatusCard` |
| 4 | Использование Baseline | `dashboard.baseline` | `BaselineUsageChart` |
| 5 | Plan/Fact по направлениям | `dashboard.byDirection[]` | `DirectionTable` |
| 6 | Plan/Fact по ролям | `dashboard.byRole[]` | `RoleTable` |
| 7 | Основные риски (Top N) | `GET /risks` | `RiskList` |
| 8 | Контроль сроков | `dashboard.deadlines` | `DeadlineCard` |
| 9 | Требует проверки | `GET /data-quality` | `ReviewCard` |
| R | AI Summary | `GET /ai-analysis` | `AiSummaryCard` |

**2.3 Навигация из Dashboard:**
- Клик "Загрузить Baseline" → `/control-objects/:id/data?tab=baseline`
- Клик "Загрузить Jira" → `/control-objects/:id/data?tab=jira`
- Клик риска → `/control-objects/:id/data?tab=review`
- Клик "Перейти к срокам" → (будущее)
- Клик "Открыть полностью" (AI) → `/control-objects/:id/ai`

**2.4 Empty State:**
- Нет baseline + Jira: показать две кнопки загрузки

**2.5 Error State:**
- Аналитика не рассчитана: кнопка "Пересчитать"

### Этап 3. AI Analysis — UI-08 (3 ч)

**`AiAnalysisPage.vue`:**

| # | Блок | Данные |
|---|------|--------|
| 1 | Заголовок | `controlObject.name`, `aiAnalysis.generatedAt` |
| 2 | Общая AI-сводка | `aiAnalysis.summary` |
| 3 | Ключевые отклонения | `aiAnalysis.deviations[]` |
| 4 | Зоны риска | `aiAnalysis.riskZones[]` |
| 5 | Вопросы для команды | `aiAnalysis.questions[]` |
| 6 | Рекомендуемые действия | `aiAnalysis.recommendations[]` |
| 7 | Обоснование выводов | `aiAnalysis.explanations[]` (collapsible) |
| 8 | Ограничения | `aiAnalysis.dataGaps[]` (скрыть если пусто) |

**Действия:**
- "Скопировать сводку" — copy to clipboard
- "Обновить анализ" → `POST /control-objects/:id/ai-analysis` (polling)
- Loading state: `"Анализ выполняется…"`, кнопки disabled
- Empty State: "Анализ еще не сформирован" + кнопка "Сформировать"
- Error State: "Не удалось сформировать AI-анализ" + "Повторить"

### Этап 4. Data Section — UI-09 (5 ч)

**`DataPage.vue` — верхняя панель:**
- Название объекта, статус готовности данных
- Дата последнего baseline, дата последней Jira
- Количество "требует проверки"
- Кнопка "Вернуться на Dashboard"

**Вкладка 1 — Baseline:**
- Drag & drop зона загрузки
- После загрузки: статистика (строк, распознано, пропущено)
- Таблица EstimateTask (из текущего `ControlObjectPage` переехать сюда)
- Переход на вкладку "Связки"

**Вкладка 2 — Jira:**
- Загрузка файла (один файл, по UI-09 — без разделения structure/worklog? Проверить с бэком)
- После загрузки: статистика (создано/обновлено Epic/Task, ошибки)
- Таблица Jira Epic (14 колонок по UI-09)
- Таблица Jira Task (15 колонок по UI-09)
- Кнопка "Авто-связка"

**Вкладка 3 — Сотрудники:**
- Перенести из `EmployeesPage.vue` + добавить:
  - Ручное добавление сотрудника
  - Редактирование роли/направления
  - Деактивация
  - Фильтры (поиск, направление, роль, active, unknown)

**Вкладка 4 — Связки:**
- Таблица EstimateTask ↔ Jira Epic
- Список несвязанных EstimateTask
- Список несвязанных Jira Epic
- Ручная связка через выпадающий список или drag
- Кнопка "Автосвязка"

**Вкладка 5 — Требует проверки:**
- Категории с количеством (11 категорий)
- Таблица с 8 колонками
- Ссылки на соответствующие вкладки

---

## Недостающие Backend Endpoints

### Нужно добавить

| Метод | URL | Назначение | Приоритет |
|-------|-----|-----------|-----------|
| GET | `/control-objects/:id/ai-analysis` | Получить последний AI-анализ | HIGH |
| POST | `/control-objects/:id/ai-analysis` | Запустить генерацию AI-анализа | HIGH |
| PATCH | `/employees/:id` | Обновить роль/направление/active | HIGH |
| POST | `/employees` | Добавить сотрудника вручную | MEDIUM |
| GET | `/control-objects/:id/links` | Список связок ET ↔ Epic | HIGH |
| GET | `/control-objects/:id/jira/epics/unlinked` | Несвязанные Epic | MEDIUM |
| GET | `/control-objects/:id/estimate-tasks/unlinked` | Несвязанные EstimateTask | MEDIUM |
| DELETE | `/employees/:id` | Деактивировать сотрудника | LOW |

### Уже есть (проверено)

| Метод | URL | Назначение |
|-------|-----|-----------|
| GET | `/control-objects/:id/dashboard` | KPI, статус, baseline usage |
| GET | `/control-objects/:id/comparison` | Plan/fact по направлениям и ролям |
| GET | `/control-objects/:id/risks` | Список рисков |
| GET | `/control-objects/:id/data-quality` | Требует проверки |
| POST | `/control-objects/:id/baseline/import` | Импорт baseline |
| GET | `/control-objects/:id/baseline` | Текущий baseline |
| GET | `/control-objects/:id/estimate-tasks` | Список задач оценки |
| POST | `/control-objects/:id/jira/import` | Импорт Jira |
| GET | `/control-objects/:id/jira/epics` | Список Epic |
| GET | `/control-objects/:id/jira/tasks` | Список Task |
| POST | `/estimate-tasks/:id/epics/:epicId/link` | Связать ET с Epic |
| DELETE | `/estimate-tasks/:id/epics/:epicId/link` | Удалить связь |
| POST | `/control-objects/:id/auto-link` | Автосвязка |
| GET | `/employees` | Список сотрудников |
| POST | `/employees/import` | Импорт из файла |

---

## Приоритет реализации для демо

1. **[MUST]** Dashboard (UI-01) — главный экран, смотрят в первую очередь
2. **[MUST]** Data Section — Baseline и Jira вкладки (UI-09 вкладки 1-2)
3. **[MUST]** AI Analysis page (UI-08) — ключевая фича
4. **[SHOULD]** Data Section — Связки вкладка (UI-09 вкладка 4)
5. **[SHOULD]** Data Section — Требует проверки (UI-09 вкладка 5)
6. **[NICE]** Сотрудники внутри Data Section (UI-09 вкладка 3)

---

## Структура данных от Backend (ожидаемое)

### GET /control-objects/:id/dashboard

```json
{
  "baselineHours": 480,
  "actualHours": 312,
  "currentEstimate": 520,
  "baselineUsagePercent": 65,
  "estimateTasksCount": 24,
  "epicsCount": 18,
  "tasksCount": 142,
  "activeRisksCount": 3,
  "needsReviewCount": 7,
  "projectStatus": "yellow",
  "projectStatusReason": "Backend превысил baseline на 18%",
  "byDirection": [
    { "name": "backend", "baseline": 160, "actual": 189, "currentEstimate": 195, "deviation": 29, "usagePercent": 118, "riskStatus": "red" }
  ],
  "byRole": [
    { "name": "backend_dev", "baseline": 160, "actual": 189, "currentEstimate": 195, "deviation": 29, "usagePercent": 118, "riskStatus": "red" }
  ],
  "deadlines": {
    "overdueCount": 2,
    "dueTodayCount": 1,
    "noMovementCount": 4
  },
  "lastJiraImport": "2025-06-20T10:00:00Z",
  "lastCalculated": "2025-06-20T11:00:00Z"
}
```

### GET /control-objects/:id/ai-analysis

```json
{
  "id": "uuid",
  "generatedAt": "2025-06-20T12:00:00Z",
  "summary": "Проект находится в управляемом состоянии...",
  "deviations": [
    { "object": "Backend", "objectType": "direction", "description": "Превысил baseline на 18%", "value": 18, "riskLevel": "red" }
  ],
  "riskZones": [
    { "type": "baseline_exceeded", "description": "...", "severity": "red", "object": "Backend" }
  ],
  "questions": [
    { "text": "Почему Backend превысил оценку?", "object": "Backend", "basis": "actual > baseline" }
  ],
  "recommendations": [
    { "description": "Уточнить остаток по Backend", "reason": "Превышение baseline", "relatedObject": "Backend" }
  ],
  "explanations": [
    { "conclusion": "Backend в зоне риска", "basis": "Actual=126ч, Baseline=103ч, Usage=122%", "metrics": ["actualHours", "baselineHours"] }
  ],
  "dataGaps": ["Не определена роль у 3 сотрудников"]
}
```
