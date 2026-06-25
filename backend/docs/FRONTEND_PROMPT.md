# Промпт для фронтенда

## Контекст API

Ты фронтенд-разработчик. Бэкенд — NestJS REST API.

**Base URL:** `http://localhost:3000/api/v1`
**Swagger:** `http://localhost:3000/api/docs`
**Auth:** Bearer JWT в заголовке `Authorization: Bearer <token>`
**Ответ всегда обёрнут:** `{ data: T, message: "success" }`
**Ошибки:** `{ statusCode, message, timestamp }`

---

## Auth

### POST /auth/register
```json
Body: { "email": "string", "password": "string (8+)", "firstName": "string", "lastName": "string", "role": "admin|manager|pm|teamlead" }
Response: { data: { accessToken: "jwt", user: { id, email, firstName, lastName, role, createdAt } } }
Errors: 409 если email занят, 400 если валидация не прошла
```

### POST /auth/login
```json
Body: { "email": "string", "password": "string" }
Response: { data: { accessToken: "jwt", user: { id, email, firstName, lastName, role, createdAt } } }
Errors: 401 если неверные credentials
```

### GET /auth/me  — требует Bearer token
```json
Response: { data: { id, email, firstName, lastName, role, createdAt } }
```

---

## Сессия на фронте

Сохраняй `accessToken` в `localStorage`. При каждом запросе добавляй:
```
Authorization: Bearer <accessToken>
```
Если пришёл 401 — редирект на /login.

---

## Ключевые эндпоинты

| Метод | Путь | Описание |
|-------|------|---------|
| GET | /users | Список всех пользователей |
| POST | /projects | Создать проект |
| GET | /projects | Мои проекты (admin или member) |
| GET | /projects/:id | Проект + members + sprints |
| POST | /projects/:id/members | Добавить участника { userId } |
| POST | /projects/:projectId/sprints | Создать спринт |
| GET | /projects/:projectId/sprints | Спринты проекта |
| GET | /sprints/:sprintId/tasks | Дерево задач (query: type, status, assigneeId) |
| PATCH | /tasks/:id | Обновить задачу (status, assigneeId, estimatedHours, actualHours) |
| GET | /sprints/:id/stats/tasks | Статистика задач спринта |
| GET | /sprints/:id/stats/departments | Статистика по отделам |
| GET | /projects/:id/stats/overview | Обзор проекта |
| POST | /ai/sprint/:id/summary | AI саммари спринта → { data: { summary: string } } |
| POST | /ai/sprint/:id/risks | AI риски спринта → { data: { summary: string } } |

---

## Роли и доступ

- Роль хранится в JWT payload: `{ sub, email, role }`
- Декодируй токен на фронте (jwt-decode) для получения роли
- Роли: `admin`, `manager`, `pm`, `teamlead`

---

## Enums (используй эти строки в запросах)

```ts
UserRole:    "admin" | "manager" | "pm" | "teamlead"
SprintStatus:"planned" | "active" | "archived"
TaskType:    "frontend" | "backend" | "qa" | "devops" | "analytics" | "techwriter" | "project" | "other"
TaskStatus:  "todo" | "in_progress" | "review" | "done" | "blocked"
```
