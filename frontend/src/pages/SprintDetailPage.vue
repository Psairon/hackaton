<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { NTag, NSpin } from 'naive-ui'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useSprintsStore } from '@/stores/sprints.store'

const route = useRoute()
const router = useRouter()
const store = useSprintsStore()

const projectId = route.params.id as string
const sprintId = route.params.sprintId as string

const tabs = [
  { name: 'Tasks',   label: 'Задачи',      path: 'tasks' },
  { name: 'Kanban',  label: 'Канбан',      path: 'kanban' },
  { name: 'Estimates', label: 'Заявки',    path: 'estimates' },
  { name: 'Stats',   label: 'Статистика',  path: 'stats' },
  { name: 'AI',      label: '✦ AI',        path: 'ai' },
]

const activeTab = computed(() => route.name as string)

const statusConfig: Record<string, { color: string; label: string }> = {
  active:   { color: '#34d399', label: 'Активный' },
  planned:  { color: '#38bdf8', label: 'Запланирован' },
  archived: { color: '#64748b', label: 'Архив' },
}

onMounted(() => store.fetchOne(sprintId))
</script>

<template>
  <AppLayout>
    <NSpin v-if="store.loading" />
    <template v-else>
      <!-- Page header -->
      <div class="mb-5">
        <div class="flex items-center gap-2 mb-1">
          <NButton
            text
            size="tiny"
            style="color: #64748b; font-size: 12px"
            @click="router.push(`/projects/${projectId}`)"
          >
            ← Назад
          </NButton>
        </div>
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold text-slate-200">{{ store.current?.name ?? 'Спринт' }}</h1>
          <NTag
            v-if="store.current"
            size="small"
            :bordered="false"
            :style="{
              background: statusConfig[store.current.status].color + '20',
              color: statusConfig[store.current.status].color,
            }"
          >
            {{ statusConfig[store.current.status].label }}
          </NTag>
        </div>
        <p v-if="store.current?.startDate" class="text-xs text-slate-500 mt-0.5">
          {{ store.current.startDate }} — {{ store.current.endDate ?? '…' }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="sprint-tabs mb-5">
        <button
          v-for="t in tabs"
          :key="t.name"
          class="sprint-tab"
          :class="{ 'sprint-tab--active': activeTab === t.name }"
          @click="router.push(`/projects/${projectId}/sprints/${sprintId}/${t.path}`)"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Tab content -->
      <RouterView />
    </template>
  </AppLayout>
</template>

<style scoped>
.sprint-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #243049;
}

.sprint-tab {
  /* сброс браузерных дефолтов */
  appearance: none;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  /* стиль */
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 400;
  font-family: inherit;
  color: #64748b;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.sprint-tab:hover {
  color: #94a3b8;
}

.sprint-tab--active {
  color: #4f7cff;
  font-weight: 500;
  border-bottom-color: #4f7cff;
}
</style>
