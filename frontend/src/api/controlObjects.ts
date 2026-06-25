import { apiClient } from './client'

export const controlObjectsApi = {
  getByProject: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/control-objects`),

  getById: (id: string) =>
    apiClient.get(`/control-objects/${id}`),

  create: (projectId: string, data: { name: string; type: string; description?: string; startDate?: string; plannedEndDate?: string }) =>
    apiClient.post(`/projects/${projectId}/control-objects`, data),

  update: (id: string, data: any) =>
    apiClient.patch(`/control-objects/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/control-objects/${id}`),

  // Baseline
  importBaseline: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/control-objects/${id}/baseline/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getBaseline: (id: string) =>
    apiClient.get(`/control-objects/${id}/baseline`),

  getEstimateTasks: (id: string) =>
    apiClient.get(`/control-objects/${id}/estimate-tasks`),

  // Jira
  importJira: (id: string, structureFile: File, worklogFile: File, deliveryKey: string) => {
    const form = new FormData()
    form.append('structureFile', structureFile)
    form.append('worklogFile', worklogFile)
    form.append('deliveryKey', deliveryKey)
    return apiClient.post(`/control-objects/${id}/jira/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getEpics: (id: string) =>
    apiClient.get(`/control-objects/${id}/jira/epics`),

  getTasks: (id: string) =>
    apiClient.get(`/control-objects/${id}/jira/tasks`),

  // Analytics
  getDashboard: (id: string) =>
    apiClient.get(`/control-objects/${id}/dashboard`),

  getComparison: (id: string) =>
    apiClient.get(`/control-objects/${id}/comparison`),

  getRisks: (id: string) =>
    apiClient.get(`/control-objects/${id}/risks`),

  getDataQuality: (id: string) =>
    apiClient.get(`/control-objects/${id}/data-quality`),

  // Links
  linkEpic: (estimateTaskId: string, epicId: string) =>
    apiClient.post(`/estimate-tasks/${estimateTaskId}/epics/${epicId}/link`),

  unlinkEpic: (estimateTaskId: string, epicId: string) =>
    apiClient.delete(`/estimate-tasks/${estimateTaskId}/epics/${epicId}/link`),

  autoLink: (id: string) =>
    apiClient.post(`/control-objects/${id}/auto-link`),

  // Links
  getLinks: (id: string) =>
    apiClient.get(`/control-objects/${id}/links`),

  getUnlinkedEpics: (id: string) =>
    apiClient.get(`/control-objects/${id}/jira/epics/unlinked`),

  getUnlinkedEstimateTasks: (id: string) =>
    apiClient.get(`/control-objects/${id}/estimate-tasks/unlinked`),

  // AI Analysis (генерируется по запросу, не персистится)
  getAiAnalysis: (_id: string) => Promise.resolve({ data: null }),

  generateAiAnalysis: (id: string) =>
    apiClient.post(`/control-objects/${id}/ai/summary`),
}
