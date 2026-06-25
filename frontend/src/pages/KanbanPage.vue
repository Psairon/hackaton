<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NTag, NText, NSpace, NSelect, NSpin, NAlert, NBadge } from 'naive-ui'
import { useTasksStore } from '@/stores/tasks.store'
import { mockUsers } from '@/api/mocks'
import type { Task, TaskStatus, TaskType } from '@/types'

const route = useRoute()
const store = useTasksStore()
const sprintId = route.params.sprintId as string

const columns: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'Todo', color: '#6b7280' },
  { key: 'in_progress', label: 'In Progress', color: '#0ea5e9' },
  { key: 'review', label: 'Review', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#10b981' },
  { key: 'blocked', label: 'Blocked', color: '#ef4444' },
]

const typeColors: Record<TaskType, string> = {
  frontend: '#4f46e5', backend: '#0ea5e9', qa: '#10b981', devops: '#f59e0b',
  analytics: '#8b5cf6', techwriter: '#ec4899', project: '#14b8a6', other: '#6b7280',
}

const filterType = ref<TaskType[]>([])
const filterAssignee = ref<string | null>(null)
const typeOptions = ['frontend','backend','qa','devops','analytics','techwriter','project','other'].map(v => ({ label: v, value: v }))
const userOptions = mockUsers.map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))

function getUser(id?: string) {
  if (!id) return null
  return mockUsers.find(u => u.id === id)
}

function allTasks(list: Task[]): Task[] {
  return list.flatMap(t => [t, ...allTasks(t.children ?? [])])
}

const flat = computed(() => allTasks(store.tasks))

function colTasks(status: TaskStatus) {
  let list = flat.value.filter(t => t.status === status)
  if (filterType.value.length) list = list.filter(t => filterType.value.includes(t.type))
  if (filterAssignee.value) list = list.filter(t => t.assigneeId === filterAssignee.value)
  return list
}

let dragId = ''
function onDragStart(id: string) { dragId = id }
function onDrop(status: TaskStatus) {
  if (dragId) store.updateStatus(dragId, status)
  dragId = ''
}

onMounted(() => store.fetchBySprint(sprintId))
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else>
    <NSpace style="margin-bottom: 12px">
      <NSelect v-model:value="filterType" :options="typeOptions" placeholder="Тип" multiple clearable style="min-width: 160px" />
      <NSelect v-model:value="filterAssignee" :options="userOptions" placeholder="Исполнитель" clearable style="min-width: 160px" />
    </NSpace>

    <div class="kanban-board">
      <div
        v-for="col in columns"
        :key="col.key"
        class="kanban-col"
        @dragover.prevent
        @drop="onDrop(col.key)"
      >
        <div class="col-header">
          <span class="col-dot" :style="{ background: col.color }" />
          <NText strong>{{ col.label }}</NText>
          <NBadge :value="colTasks(col.key).length" :max="99" style="margin-left: auto" />
        </div>
        <div class="col-cards">
          <NCard
            v-for="task in colTasks(col.key)"
            :key="task.id"
            size="small"
            class="task-card"
            draggable="true"
            @dragstart="onDragStart(task.id)"
          >
            <NText style="font-size: 0.875rem; display: block; margin-bottom: 6px">{{ task.title }}</NText>
            <NSpace size="small">
              <NTag size="tiny" :style="{ background: typeColors[task.type], color: '#fff', border: 'none' }">{{ task.type }}</NTag>
              <NText v-if="getUser(task.assigneeId)" depth="3" style="font-size: 0.75rem">
                {{ getUser(task.assigneeId)?.firstName }}
              </NText>
            </NSpace>
          </NCard>
          <div v-if="!colTasks(col.key).length" class="col-empty">пусто</div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 12px;
  min-height: 400px;
}

.kanban-col {
  min-width: 220px;
  flex: 1;
  background: #18181c;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #2a2a30;
}

.col-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.col-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.col-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card {
  cursor: grab;
  background: #1e1e24 !important;
  border-color: #2a2a30 !important;
}
.task-card:active { cursor: grabbing; }

.col-empty {
  text-align: center;
  padding: 20px;
  color: #4a4a55;
  font-size: 0.85rem;
}
</style>
