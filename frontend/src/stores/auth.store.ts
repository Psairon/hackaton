import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { mockUsers } from '@/api/mocks'
import type { User } from '@/types'

const USE_MOCK = false

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) {
        const found = mockUsers.find(u => u.email === email)
        if (!found) throw new Error('Пользователь не найден')
        token.value = 'mock-token'
        localStorage.setItem('accessToken', 'mock-token')
        user.value = found
        return
      }
      const { data } = await authApi.login(email, password)
      token.value = data.accessToken
      localStorage.setItem('accessToken', data.accessToken)
      await fetchMe()
    } catch (e: any) {
      error.value = e.response?.data?.message ?? e.message ?? 'Ошибка входа'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string }) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) {
        token.value = 'mock-token'
        localStorage.setItem('accessToken', 'mock-token')
        user.value = { id: 'u-new', role: 'manager', createdAt: new Date().toISOString(), ...data }
        return
      }
      const { data: res } = await authApi.register(data)
      token.value = res.accessToken
      localStorage.setItem('accessToken', res.accessToken)
      await fetchMe()
    } catch (e: any) {
      error.value = e.response?.data?.message ?? e.message ?? 'Ошибка регистрации'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (USE_MOCK) {
      user.value = mockUsers[0]
      return
    }
    try {
      const { data } = await authApi.me()
      user.value = data
    } catch {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('accessToken')
    if (!USE_MOCK) authApi.logout().catch(() => {})
  }

  async function init() {
    if (token.value) await fetchMe()
  }

  return { user, token, loading, error, isAuthenticated, login, register, logout, fetchMe, init }
})
