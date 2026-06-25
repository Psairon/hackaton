<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NDataTable, NButton, NSpace, NTag, NSelect, NAlert, NSpin, NEmpty, NUpload,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useTasksStore } from '@/stores/tasks.store'
import { mockUsers } from '@/api/mocks'
import type { Task, TaskStatus, TaskType } from '@/types'

const route = useRoute()
const store = useTasksStore()
const sprintId = route.params.sprintId as string

const filterType = ref<TaskType[]>([])
const filterStatus = ref<TaskStatus[]>([])
const filterAssignee = ref<string | null>(null)

const typeOptions = ['frontend','backend','qa','devops','analytics','techwriter','project','other'].map(v => ({ label: v, value: v }))
const statusOptions = ['todo','in_progress','review','done','blocked'].map(v => ({ label: v, value: v }))
const userOptions = mockUsers.map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))

const statusColors: Record<TaskStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  todo: 'default', in_progress: 'info', review: 'warning', done: 'success', blocked: 'error',
}

const typeColors: Record<TaskType, string> = {
  frontend: '#4f46e5', backend: '#0ea5e9', qa: '#10b981', devops: '#f59e0b',
  analytics: '#8b5cf6', techwriter: '#ec4899', project: '#14b8a6', other: '#6b7280',
}

function getUser(id?: string) {
  if (!id) return '—'
  const u = mockUsers.find(u => u.id === id)
  return u ? `${u.firstName} ${u.lastName}` : id
}

const columns: DataTableColumns<Task> = [
  { title: 'Название', key: 'title', ellipsis: true },
  {
    title: 'Тип', key: 'type', width: 120,
    render: r => h(NTag, { size: 'small', style: { background: typeColors[r.type], color: '#fff', border: 'none' } }, { default: () => r.type }),
  },
  {
    title: 'Статус', key: 'status', width: 130,
    render: r => h(NTag, { size: 'small', type: statusColors[r.status] }, { default: () => r.status }),
  },
  { title: 'Исполнитель', key: 'assigneeId', width: 160, render: r => getUser(r.assigneeId) },
  { title: 'Оценка (ч)', key: 'estimatedHours', width: 100, render: r => r.estimatedHours ?? '—' },
  { title: 'Факт (ч)', key: 'actualHours', width: 90, render: r => r.actualHours ?? '—' },
]

const filtered = computed(() => {
  let list = store.tasks
  if (filterType.value.length) list = list.filter(t => filterType.value.includes(t.type))
  if (filterStatus.value.length) list = list.filter(t => filterStatus.value.includes(t.status))
  if (filterAssignee.value) list = list.filter(t => t.assigneeId === filterAssignee.value)
  return list
})

function handleFileUpload({ file }: any) {
  store.importExcel(sprintId, file.file)
}

onMounted(() => store.fetchBySprint(sprintId))

import { h } from 'vue'
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else>
    <NSpace align="center" style="margin-bottom: 12px; flex-wrap: wrap">
      <NSelect v-model:value="filterType" :options="typeOptions" placeholder="Тип" multiple clearable style="min-width: 180px" />
      <NSelect v-model:value="filterStatus" :options="statusOptions" placeholder="Статус" multiple clearable style="min-width: 180px" />
      <NSelect v-model:value="filterAssignee" :options="userOptions" placeholder="Исполнитель" clearable style="min-width: 180px" />
      <NUpload :show-file-list="false" accept=".xlsx,.xls" @change="handleFileUpload">
        <NButton>Импортировать Excel</NButton>
      </NUpload>
    </NSpace>

    <NEmpty v-if="!filtered.length" description="Нет задач" style="padding: 40px 0" />
    <NDataTable
      v-else
      :columns="columns"
      :data="filtered"
      :bordered="false"
      :pagination="{ pageSize: 20 }"
      :row-key="(r: Task) => r.id"
    />
  </template>
</template>
