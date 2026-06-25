import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await authApi.login(email, password)
      localStorage.setItem('accessToken', data.accessToken)
      await fetchMe()
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка входа'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    try {
      const { data } = await authApi.me()
      user.value = data
    } catch {
      user.value = null
    }
  }

  async function logout() {
    try { await authApi.logout() } catch { /* ignore */ }
    user.value = null
    localStorage.removeItem('accessToken')
  }

  async function init() {
    if (localStorage.getItem('accessToken')) await fetchMe()
  }

  return { user, loading, error, isAuthenticated, isAdmin, login, logout, init }
})
