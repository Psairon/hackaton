import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectsApi } from '@/api/projects.api'
import { mockProjects, mockUsers } from '@/api/mocks'
import type { Project, User } from '@/types'

const USE_MOCK = true

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const current = ref<Project | null>(null)
  const members = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) { projects.value = mockProjects; return }
      const { data } = await projectsApi.list()
      projects.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      if (USE_MOCK) { current.value = mockProjects.find(p => p.id === id) ?? null; return }
      const { data } = await projectsApi.get(id)
      current.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  async function create(data: { name: string; description?: string }) {
    if (USE_MOCK) {
      const p: Project = { id: `p${Date.now()}`, adminId: 'u1', createdAt: new Date().toISOString(), ...data }
      projects.value.unshift(p)
      return p
    }
    const { data: res } = await projectsApi.create(data)
    projects.value.unshift(res)
    return res
  }

  async function fetchMembers(id: string) {
    if (USE_MOCK) { members.value = mockUsers.slice(0, 3); return }
    const { data } = await projectsApi.members(id)
    members.value = data
  }

  async function addMember(projectId: string, userId: string) {
    if (USE_MOCK) {
      const u = mockUsers.find(u => u.id === userId)
      if (u && !members.value.find(m => m.id === userId)) members.value.push(u)
      return
    }
    await projectsApi.addMember(projectId, userId)
    await fetchMembers(projectId)
  }

  async function fetchAllUsers() {
    if (USE_MOCK) return mockUsers
    const { data } = await projectsApi.users()
    return data
  }

  return { projects, current, members, loading, error, fetchAll, fetchOne, create, fetchMembers, addMember, fetchAllUsers }
})
