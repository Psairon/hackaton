import { apiClient } from './client'
import type { Sprint } from '@/types'

export const sprintsApi = {
  list: (projectId: string) => apiClient.get<Sprint[]>(`/projects/${projectId}/sprints`),
  get: (id: string) => apiClient.get<Sprint>(`/sprints/${id}`),
  create: (projectId: string, data: { name: string; startDate?: string; endDate?: string }) =>
    apiClient.post<Sprint>(`/projects/${projectId}/sprints`, data),
  update: (id: string, data: Partial<Sprint>) => apiClient.patch<Sprint>(`/sprints/${id}`, data),
}
