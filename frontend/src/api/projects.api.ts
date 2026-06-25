import { apiClient } from './client'
import type { Project, User } from '@/types'

export const projectsApi = {
  list: () => apiClient.get<Project[]>('/projects'),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => apiClient.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) => apiClient.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  members: (id: string) => apiClient.get<User[]>(`/projects/${id}/members`),
  addMember: (id: string, userId: string) => apiClient.post(`/projects/${id}/members`, { userId }),
  users: () => apiClient.get<User[]>('/users'),
}
