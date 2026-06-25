import { apiClient } from './client'
import type { SprintStats } from '@/types'

export const statsApi = {
  sprint: (sprintId: string) => apiClient.get<SprintStats>(`/sprints/${sprintId}/stats`),
}
