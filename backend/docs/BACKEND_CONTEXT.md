# Backend Context — Hackaton Dashboard

## Стек
- NestJS 10, TypeScript, TypeORM, PostgreSQL
- JWT auth (passport-jwt), bcryptjs
- Anthropic SDK (claude-sonnet-4-6) — без streaming
- xlsx — парсинг Excel (пока заглушки)
- Swagger: GET /api/docs
- Global prefix: /api/v1

## Роли пользователей (UserRole enum)
- admin | manager | pm | teamlead

## JWT payload
```json
{ "sub": "uuid", "email": "...", "role": "teamlead" }
```
Expiry: 24h. Заголовок: `Authorization: Bearer <token>`

## Enums
| Enum | Значения |
|------|---------|
| UserRole | admin, manager, pm, teamlead |
| SprintStatus | planned, active, archived |
| TaskType / Department | frontend, backend, qa, devops, analytics, techwriter, project, other |
| TaskStatus | todo, in_progress, review, done, blocked |

## Env переменные (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=...
JWT_EXPIRES_IN=24h
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
```

## Endpoints по модулям

### auth (public)
| Method | Path | Описание |
|--------|------|---------|
| POST | /api/v1/auth/register | { email, password(8+), firstName, lastName, role } |
| POST | /api/v1/auth/login | { email, password } → { accessToken, user } |
| GET | /api/v1/auth/me | JWT required |

### users
| Method | Path |
|--------|------|
| GET | /api/v1/users |
| GET | /api/v1/users/:id |

### projects
| Method | Path | Ограничение |
|--------|------|------------|
| POST | /api/v1/projects | adminId = текущий user |
| GET | /api/v1/projects | только свои (admin или member) |
| GET | /api/v1/projects/:id | + members[] + sprints[] |
| PATCH | /api/v1/projects/:id | только adminId (403) |
| DELETE | /api/v1/projects/:id | только adminId (403) |
| POST | /api/v1/projects/:id/members | { userId }, только adminId |
| DELETE | /api/v1/projects/:id/members/:userId | только adminId |
| GET | /api/v1/projects/:id/members | |

### sprints
| Method | Path |
|--------|------|
| POST | /api/v1/projects/:projectId/sprints |
| GET | /api/v1/projects/:projectId/sprints |
| GET | /api/v1/sprints/:id |
| PATCH | /api/v1/sprints/:id |
| DELETE | /api/v1/sprints/:id |

### tasks
| Method | Path | Особенности |
|--------|------|------------|
| GET | /api/v1/sprints/:sprintId/tasks | дерево, фильтры: type, status, assigneeId |
| GET | /api/v1/tasks/:id | + children[] |
| PATCH | /api/v1/tasks/:id | status, assigneeId, estimatedHours, actualHours |
| DELETE | /api/v1/tasks/:id | каскад |
| POST | /api/v1/sprints/:sprintId/tasks/import | multipart xlsx, пока заглушка |

### estimates
| Method | Path |
|--------|------|
| POST | /api/v1/sprints/:sprintId/estimates/import | xlsx заглушка |
| GET | /api/v1/sprints/:sprintId/estimates |
| GET | /api/v1/estimates/:id | + items[] |
| POST | /api/v1/estimate-items/:itemId/link/:taskId | link task |
| DELETE | /api/v1/estimate-items/:itemId/link | unlink |

### stats
| Method | Path |
|--------|------|
| GET | /api/v1/sprints/:id/stats/tasks |
| GET | /api/v1/sprints/:id/stats/departments |
| GET | /api/v1/sprints/:id/stats/estimates |
| GET | /api/v1/projects/:id/stats/overview |

### ai
| Method | Path |
|--------|------|
| POST | /api/v1/ai/sprint/:id/summary | claude-sonnet-4-6 |
| POST | /api/v1/ai/sprint/:id/risks | claude-sonnet-4-6 |

## Структура src/
```
src/
├── app.module.ts
├── main.ts
├── config/env.validation.ts       (Joi)
├── database/database.module.ts    (TypeORM, synchronize:true)
├── common/
│   ├── decorators/  @CurrentUser, @Roles
│   ├── filters/     GlobalExceptionFilter → { statusCode, message, timestamp }
│   ├── guards/      JwtAuthGuard, RolesGuard
│   └── interceptors/ ResponseInterceptor → { data, message: 'success' }
└── modules/
    ├── auth/        register, login, /me, jwt.strategy
    ├── users/       User entity (id,email,passwordHash,firstName,lastName,role)
    ├── projects/    Project, ProjectMember entities
    ├── sprints/     Sprint entity
    ├── tasks/       Task entity (self-ref parent/children)
    ├── estimates/   Estimate, EstimateItem entities
    ├── stats/       агрегация напрямую через TypeORM
    └── ai/          Anthropic SDK, промпты для summary/risks
```

## Соглашения по коду
- Контроллеры — только HTTP-слой, никакой логики
- Сервисы — вся бизнес-логика
- Репозитории — только TypeORM, без raw SQL
- Никаких try/catch — GlobalExceptionFilter ловит всё
- Все DTO с `@ApiProperty` (Swagger) и декораторами class-validator

## Известные проблемы
- `ResponseInterceptor` определён, но **не подключён глобально** в main.ts — ответы идут без обёртки `{ data, message }`
- `authApi.logout()` на фронте вызывает `POST /auth/logout` — этого эндпоинта нет (тихо игнорируется в сторе)

## Статус реализации
- [x] Все entities + enums
- [x] auth (register, login, me)
- [x] users (findAll, findById)
- [x] projects (CRUD + members)
- [x] sprints (CRUD)
- [x] tasks (tree query, update, delete, import stub)
- [x] estimates (import stub, findAll, findById, link/unlink)
- [x] stats (tasks, departments, estimates, project overview)
- [x] ai (summary, risks via claude-sonnet-4-6)
- [ ] Реальный парсинг xlsx (ждём примеры файлов)
- [ ] Тесты
