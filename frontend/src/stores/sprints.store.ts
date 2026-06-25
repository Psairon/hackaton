import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sprintsApi } from '@/api/sprints.api'
import { mockSprints } from '@/api/mocks'
import type { Sprint } from '@/types'

const USE_MOCK = true

export const useSprintsStore = defineStore('sprints', () => {
  const sprints = ref<Sprint[]>([])
  const current = ref<Sprint | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchByProject(projectId: string) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) { sprints.value = mockSprints.filter(s => s.projectId === projectId); return }
      const { data } = await sprintsApi.list(projectId)
      sprints.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    try {
      if (USE_MOCK) { current.value = mockSprints.find(s => s.id === id) ?? null; return }
      const { data } = await sprintsApi.get(id)
      current.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function create(projectId: string, data: { name: string; startDate?: string; endDate?: string }) {
    if (USE_MOCK) {
      const s: Sprint = { id: `s${Date.now()}`, projectId, status: 'planned', createdAt: new Date().toISOString(), ...data }
      sprints.value.push(s)
      return s
    }
    const { data: res } = await sprintsApi.create(projectId, data)
    sprints.value.push(res)
    return res
  }

  return { sprints, current, loading, error, fetchByProject, fetchOne, create }
})
