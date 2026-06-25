import { apiClient } from './client'

export const employeesApi = {
  getAll: () => apiClient.get('/employees'),

  create: (data: { fullName: string; jiraIdentity?: string; mail?: string; direction: string; role: string; active?: boolean }) =>
    apiClient.post('/employees', data),

  update: (id: string, data: { direction?: string; role?: string; active?: boolean; jiraIdentity?: string; mail?: string }) =>
    apiClient.patch(`/employees/${id}`, data),

  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/employees/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
