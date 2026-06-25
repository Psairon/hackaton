import type { User, Project, Sprint, Task, Estimate, EstimateItem, SprintStats } from '@/types'

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@team.ru', firstName: 'Иван', lastName: 'Петров', role: 'admin', createdAt: '2024-01-01' },
  { id: 'u2', email: 'lead@team.ru', firstName: 'Мария', lastName: 'Сидорова', role: 'teamlead', createdAt: '2024-01-02' },
  { id: 'u3', email: 'dev@team.ru', firstName: 'Алексей', lastName: 'Козлов', role: 'pm', createdAt: '2024-01-03' },
  { id: 'u4', email: 'mgr@team.ru', firstName: 'Ольга', lastName: 'Никитина', role: 'manager', createdAt: '2024-01-04' },
]

export const mockProjects: Project[] = [
  { id: 'p1', name: 'TeamDash', description: 'Дашборд аналитики для команд', adminId: 'u1', createdAt: '2024-01-10' },
  { id: 'p2', name: 'CRM Portal', description: 'Портал управления клиентами', adminId: 'u1', createdAt: '2024-02-01' },
  { id: 'p3', name: 'Mobile App', description: 'Мобильное приложение', adminId: 'u2', createdAt: '2024-03-01' },
]

export const mockSprints: Sprint[] = [
  { id: 's1', projectId: 'p1', name: 'Sprint 1', status: 'active', startDate: '2024-06-01', endDate: '2024-06-14', createdAt: '2024-06-01' },
  { id: 's2', projectId: 'p1', name: 'Sprint 2', status: 'planned', startDate: '2024-06-15', endDate: '2024-06-28', createdAt: '2024-06-01' },
  { id: 's3', projectId: 'p2', name: 'Sprint 1', status: 'archived', startDate: '2024-05-01', endDate: '2024-05-14', createdAt: '2024-05-01' },
]

export const mockTasks: Task[] = [
  {
    id: 't1', sprintId: 's1', title: 'Настройка CI/CD', type: 'devops', status: 'done',
    assigneeId: 'u1', estimatedHours: 8, actualHours: 6, children: [], createdAt: '2024-06-01',
  },
  {
    id: 't2', sprintId: 's1', title: 'Auth модуль', type: 'backend', status: 'in_progress',
    assigneeId: 'u2', estimatedHours: 16, actualHours: 10, createdAt: '2024-06-01',
    children: [
      { id: 't2a', sprintId: 's1', parentId: 't2', title: 'JWT стратегия', type: 'backend', status: 'done', estimatedHours: 4, actualHours: 3, children: [], createdAt: '2024-06-01' },
      { id: 't2b', sprintId: 's1', parentId: 't2', title: 'Refresh токены', type: 'backend', status: 'in_progress', estimatedHours: 4, actualHours: 2, children: [], createdAt: '2024-06-01' },
    ],
  },
  {
    id: 't3', sprintId: 's1', title: 'UI компоненты', type: 'frontend', status: 'todo',
    assigneeId: 'u3', estimatedHours: 24, actualHours: 0, children: [], createdAt: '2024-06-02',
  },
  {
    id: 't4', sprintId: 's1', title: 'Написание тест-кейсов', type: 'qa', status: 'review',
    assigneeId: 'u4', estimatedHours: 8, actualHours: 7, children: [], createdAt: '2024-06-03',
  },
  {
    id: 't5', sprintId: 's1', title: 'Блокировка внешним API', type: 'backend', status: 'blocked',
    estimatedHours: 12, actualHours: 0, children: [], createdAt: '2024-06-04',
  },
]

export const mockEstimates: Estimate[] = [
  {
    id: 'e1', sprintId: 's1', title: 'Заявка Sprint 1', totalHours: 80,
    frontendHours: 24, backendHours: 28, qaHours: 8, devopsHours: 8,
    analyticsHours: 4, techwriterHours: 4, projectHours: 4, otherHours: 0,
    createdAt: '2024-06-01',
  },
]

export const mockEstimateItems: EstimateItem[] = [
  { id: 'ei1', estimateId: 'e1', title: 'UI компоненты', estimatedHours: 24, department: 'frontend', linkedTaskId: 't3', createdAt: '2024-06-01' },
  { id: 'ei2', estimateId: 'e1', title: 'Auth модуль', estimatedHours: 16, department: 'backend', linkedTaskId: 't2', createdAt: '2024-06-01' },
  { id: 'ei3', estimateId: 'e1', title: 'CI/CD настройка', estimatedHours: 8, department: 'devops', linkedTaskId: 't1', createdAt: '2024-06-01' },
  { id: 'ei4', estimateId: 'e1', title: 'Тест-план', estimatedHours: 8, department: 'qa', linkedTaskId: 't4', createdAt: '2024-06-01' },
  { id: 'ei5', estimateId: 'e1', title: 'Интеграция платёжки', estimatedHours: 12, department: 'backend', createdAt: '2024-06-01' },
]

export const mockStats: SprintStats = {
  tasks: { total: 5, done: 1, inProgress: 1, todo: 1, review: 1, blocked: 1, completionPercent: 20 },
  departments: [
    { name: 'frontend', estimatedHours: 24, actualHours: 0 },
    { name: 'backend', estimatedHours: 28, actualHours: 15 },
    { name: 'qa', estimatedHours: 8, actualHours: 7 },
    { name: 'devops', estimatedHours: 8, actualHours: 6 },
    { name: 'analytics', estimatedHours: 4, actualHours: 0 },
    { name: 'techwriter', estimatedHours: 4, actualHours: 0 },
  ],
  estimates: { linked: 4, unlinked: 1, total: 5 },
}
