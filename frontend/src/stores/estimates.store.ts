import { defineStore } from 'pinia'
import { ref } from 'vue'
import { estimatesApi } from '@/api/estimates.api'
import { mockEstimates, mockEstimateItems } from '@/api/mocks'
import type { Estimate, EstimateItem } from '@/types'

const USE_MOCK = true

export const useEstimatesStore = defineStore('estimates', () => {
  const estimates = ref<Estimate[]>([])
  const current = ref<Estimate | null>(null)
  const items = ref<EstimateItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBySprint(sprintId: string) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) { estimates.value = mockEstimates.filter(e => e.sprintId === sprintId); return }
      const { data } = await estimatesApi.list(sprintId)
      estimates.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    try {
      if (USE_MOCK) {
        current.value = mockEstimates.find(e => e.id === id) ?? null
        items.value = mockEstimateItems.filter(i => i.estimateId === id)
        return
      }
      const [est, its] = await Promise.all([estimatesApi.get(id), estimatesApi.items(id)])
      current.value = est.data
      items.value = its.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function linkTask(itemId: string, taskId: string) {
    if (USE_MOCK) {
      const item = items.value.find(i => i.id === itemId)
      if (item) item.linkedTaskId = taskId
      return
    }
    await estimatesApi.linkTask(itemId, taskId)
  }

  return { estimates, current, items, loading, error, fetchBySprint, fetchOne, linkTask }
})
