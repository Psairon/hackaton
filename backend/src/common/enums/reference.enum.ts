/**
 * Захардкоженные справочники направлений и ролей.
 * Выведены из реальных файлов: «Шаблон плановой оценки.xlsx» + «ADUsers.xlsx».
 * Значения из входных файлов матчатся на эти enum через alias-маппинг (см. baseline.parser.ts).
 * См. architecture.md → «Маппинг входных файлов».
 */

export enum Direction {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  ANALYTICS = 'analytics',
  TEAMLEAD = 'teamlead',
  QA = 'qa',
  DEVOPS = 'devops',
  DESIGN = 'design',
  OTHER = 'other',
}

export enum Role {
  BACKEND_DEV = 'backend_dev',
  FRONTEND_DEV = 'frontend_dev',
  ANALYST = 'analyst',
  TECHWRITER = 'techwriter',
  QA = 'qa',
  DEVOPS = 'devops',
  DESIGNER = 'designer',
  TEAMLEAD = 'teamlead',
  OTHER = 'other',
}
