import { apiClient } from './client'
import type { User, AuthTokens } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post<AuthTokens>('/auth/register', data),

  me: () =>
    apiClient.get<User>('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),
}
