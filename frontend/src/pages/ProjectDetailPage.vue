<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NPageHeader, NTabs, NTabPane, NDataTable, NTag, NButton,
  NSpin, NAlert, NModal, NForm, NFormItem, NInput, NSelect,
  NAvatar, NSpace, NEmpty,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useProjectsStore } from '@/stores/projects.store'
import { useSprintsStore } from '@/stores/sprints.store'
import type { Sprint } from '@/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectsStore()
const sprintStore = useSprintsStore()

const projectId = route.params.id as string
const showSprintModal = ref(false)
const showMemberModal = ref(false)
const newSprint = ref({ name: '', startDate: '', endDate: '' })
const selectedUserId = ref<string | null>(null)
const allUsers = ref<{ label: string; value: string }[]>([])

const statusMap: Record<string, { type: 'success' | 'info' | 'default'; label: string }> = {
  active: { type: 'success', label: 'Активный' },
  planned: { type: 'info', label: 'Запланирован' },
  archived: { type: 'default', label: 'Архив' },
}

const sprintColumns: DataTableColumns<Sprint> = [
  { title: 'Название', key: 'name' },
  {
    title: 'Статус', key: 'status',
    render: (row) => {
      const s = statusMap[row.status]
      return h(NTag, { type: s.type, size: 'small' }, { default: () => s.label })
    },
  },
  { title: 'Начало', key: 'startDate', render: r => r.startDate ? new Date(r.startDate).toLocaleDateString('ru') : '—' },
  { title: 'Конец', key: 'endDate', render: r => r.endDate ? new Date(r.endDate).toLocaleDateString('ru') : '—' },
]

function goToSprint(row: Sprint) {
  router.push(`/projects/${projectId}/sprints/${row.id}/tasks`)
}

onMounted(async () => {
  await Promise.all([projectStore.fetchOne(projectId), sprintStore.fetchByProject(projectId), projectStore.fetchMembers(projectId)])
  const users = await projectStore.fetchAllUsers()
  allUsers.value = users.map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))
})

async function createSprint() {
  if (!newSprint.value.name.trim()) return
  await sprintStore.create(projectId, newSprint.value)
  showSprintModal.value = false
  newSprint.value = { name: '', startDate: '', endDate: '' }
}

async function addMember() {
  if (!selectedUserId.value) return
  await projectStore.addMember(projectId, selectedUserId.value)
  showMemberModal.value = false
  selectedUserId.value = null
}

function initials(u: any) {
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
}

import { h } from 'vue'
</script>

<template>
  <AppLayout>
    <NSpin v-if="projectStore.loading" />
    <NAlert v-else-if="projectStore.error" type="error" :title="projectStore.error" />
    <template v-else-if="projectStore.current">
      <NPageHeader
        :title="projectStore.current.name"
        :subtitle="projectStore.current.description"
        @back="router.push('/projects')"
      />

      <NTabs type="line" animated style="margin-top: 20px">
        <NTabPane name="sprints" tab="Спринты">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px">
            <NButton type="primary" size="small" @click="showSprintModal = true">+ Добавить спринт</NButton>
          </div>
          <NDataTable
            :columns="sprintColumns"
            :data="sprintStore.sprints"
            :loading="sprintStore.loading"
            :bordered="false"
            row-class-name="clickable-row"
            @update:checked-row-keys="() => {}"
            :row-props="(row) => ({ onClick: () => goToSprint(row), style: 'cursor:pointer' })"
          />
          <NEmpty v-if="!sprintStore.sprints.length && !sprintStore.loading" description="Нет спринтов" style="padding: 40px 0" />
        </NTabPane>

        <NTabPane name="members" tab="Участники">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px">
            <NButton type="primary" size="small" @click="showMemberModal = true">+ Добавить</NButton>
          </div>
          <NEmpty v-if="!projectStore.members.length" description="Нет участников" style="padding: 40px 0" />
          <NSpace v-else vertical>
            <NSpace v-for="m in projectStore.members" :key="m.id" align="center">
              <NAvatar round :style="{ background: '#4f46e5' }">{{ initials(m) }}</NAvatar>
              <span>{{ m.firstName }} {{ m.lastName }}</span>
              <NTag size="small" type="info">{{ m.role }}</NTag>
            </NSpace>
          </NSpace>
        </NTabPane>
      </NTabs>
    </template>

    <!-- Sprint modal -->
    <NModal v-model:show="showSprintModal" preset="card" title="Новый спринт" style="max-width: 440px">
      <NForm label-placement="top">
        <NFormItem label="Название" required>
          <NInput v-model:value="newSprint.name" placeholder="Sprint 1" />
        </NFormItem>
        <NFormItem label="Дата начала">
          <NInput v-model:value="newSprint.startDate" type="text" placeholder="2024-06-01" />
        </NFormItem>
        <NFormItem label="Дата окончания">
          <NInput v-model:value="newSprint.endDate" type="text" placeholder="2024-06-14" />
        </NFormItem>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <NButton @click="showSprintModal = false">Отмена</NButton>
          <NButton type="primary" @click="createSprint">Создать</NButton>
        </div>
      </NForm>
    </NModal>

    <!-- Member modal -->
    <NModal v-model:show="showMemberModal" preset="card" title="Добавить участника" style="max-width: 380px">
      <NSelect v-model:value="selectedUserId" :options="allUsers" placeholder="Выберите пользователя" />
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px">
        <NButton @click="showMemberModal = false">Отмена</NButton>
        <NButton type="primary" @click="addMember">Добавить</NButton>
      </div>
    </NModal>
  </AppLayout>
</template>
