import { apiClient } from './client'
import type { Task, TaskStatus } from '@/types'

export const tasksApi = {
  list: (sprintId: string) => apiClient.get<Task[]>(`/sprints/${sprintId}/tasks`),
  update: (id: string, data: Partial<Task>) => apiClient.patch<Task>(`/tasks/${id}`, data),
  updateStatus: (id: string, status: TaskStatus) => apiClient.patch<Task>(`/tasks/${id}`, { status }),
  importExcel: (sprintId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<Task[]>(`/sprints/${sprintId}/tasks/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
