import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tasksApi } from '@/api/tasks.api'
import { mockTasks } from '@/api/mocks'
import type { Task, TaskStatus } from '@/types'

const USE_MOCK = true

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBySprint(sprintId: string) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) { tasks.value = mockTasks.filter(t => t.sprintId === sprintId && !t.parentId); return }
      const { data } = await tasksApi.list(sprintId)
      tasks.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    if (USE_MOCK) {
      const update = (list: Task[]) => {
        for (const t of list) {
          if (t.id === id) { t.status = status; return }
          if (t.children?.length) update(t.children)
        }
      }
      update(tasks.value)
      return
    }
    await tasksApi.updateStatus(id, status)
    await fetchBySprint(tasks.value[0]?.sprintId ?? '')
  }

  async function importExcel(sprintId: string, file: File) {
    if (USE_MOCK) return
    loading.value = true
    try {
      const { data } = await tasksApi.importExcel(sprintId, file)
      tasks.value = data
    } finally {
      loading.value = false
    }
  }

  return { tasks, loading, error, fetchBySprint, updateStatus, importExcel }
})
