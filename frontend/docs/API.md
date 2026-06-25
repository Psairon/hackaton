# API Client

Путь: `src/api/`

## client.ts — apiClient (axios instance)
- baseURL: `/api` (проксируется Vite на `http://localhost:3000`)
- Авто-подстановка `Authorization: Bearer <token>` из localStorage
- Interceptor 401: чистит токен, редиректит на `/login`

## auth.ts — authApi
| Метод | URL | Тело | Ответ |
|-------|-----|------|-------|
| POST | `/auth/login` | `{ email, password }` | `{ accessToken }` |
| GET | `/auth/me` | — | `User` |
| POST | `/auth/logout` | — | — |

## Соглашения для новых доменов
1. Создать `src/api/<domain>.ts`
2. Экспортировать объект `<domain>Api` с методами
3. Вызывать только из Pinia сторов или composables
4. Типы ответов брать из `src/types/index.ts`

## Типы (src/types/index.ts)
- `User` — id, email, name, role
- `AuthTokens` — accessToken
- `KpiMetric` — id, label, value, unit, trend, trendDirection
- `ChartData / ChartDataset` — обёртки над Chart.js data
- `ChartType` — `'line' | 'bar' | 'doughnut' | 'pie'`
- `ApiError` — message, statusCode
