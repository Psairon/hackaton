import { apiClient } from './client'
import type { Estimate, EstimateItem } from '@/types'

export const estimatesApi = {
  list: (sprintId: string) => apiClient.get<Estimate[]>(`/sprints/${sprintId}/estimates`),
  get: (id: string) => apiClient.get<Estimate>(`/estimates/${id}`),
  items: (estimateId: string) => apiClient.get<EstimateItem[]>(`/estimates/${estimateId}/items`),
  linkTask: (itemId: string, taskId: string) =>
    apiClient.patch(`/estimate-items/${itemId}`, { linkedTaskId: taskId }),
  importFile: (sprintId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<Estimate>(`/sprints/${sprintId}/estimates/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
