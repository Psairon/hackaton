<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { NPageHeader, NTabs, NTabPane, NTag, NSpin } from 'naive-ui'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useSprintsStore } from '@/stores/sprints.store'

const route = useRoute()
const router = useRouter()
const store = useSprintsStore()

const projectId = route.params.id as string
const sprintId = route.params.sprintId as string

const tabs = [
  { name: 'tasks', label: 'Задачи', path: 'tasks' },
  { name: 'kanban', label: 'Канбан', path: 'kanban' },
  { name: 'estimates', label: 'Заявки', path: 'estimates' },
  { name: 'stats', label: 'Статистика', path: 'stats' },
  { name: 'ai', label: '✨ AI', path: 'ai' },
]

const activeTab = computed(() => route.name as string)

function onTabChange(name: string | number) {
  router.push(`/projects/${projectId}/sprints/${sprintId}/${name}`)
}

const statusMap: Record<string, { type: 'success' | 'info' | 'default'; label: string }> = {
  active: { type: 'success', label: 'Активный' },
  planned: { type: 'info', label: 'Запланирован' },
  archived: { type: 'default', label: 'Архив' },
}

onMounted(() => store.fetchOne(sprintId))
</script>

<template>
  <AppLayout>
    <NSpin v-if="store.loading" />
    <template v-else>
      <NPageHeader
        :title="store.current?.name ?? 'Спринт'"
        @back="router.push(`/projects/${projectId}`)"
      >
        <template #extra>
          <NTag v-if="store.current" :type="statusMap[store.current.status].type" size="small">
            {{ statusMap[store.current.status].label }}
          </NTag>
        </template>
      </NPageHeader>

      <NTabs
        type="line"
        :value="activeTab"
        style="margin-top: 16px"
        @update:value="onTabChange"
      >
        <NTabPane v-for="t in tabs" :key="t.name" :name="t.name" :tab="t.label" display-directive="show" />
      </NTabs>

      <div style="margin-top: 16px">
        <RouterView />
      </div>
    </template>
  </AppLayout>
</template>
