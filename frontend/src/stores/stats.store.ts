import { defineStore } from 'pinia'
import { ref } from 'vue'
import { statsApi } from '@/api/stats.api'
import { mockStats } from '@/api/mocks'
import type { SprintStats } from '@/types'

const USE_MOCK = true

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<SprintStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBySprint(sprintId: string) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) { stats.value = mockStats; return }
      const { data } = await statsApi.sprint(sprintId)
      stats.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, error, fetchBySprint }
})
