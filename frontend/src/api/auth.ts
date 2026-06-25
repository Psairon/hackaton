import { apiClient } from './client'
import type { AuthTokens, User } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { email, password }),

  me: () =>
    apiClient.get<User>('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),
}
