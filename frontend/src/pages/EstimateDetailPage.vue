<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NPageHeader, NGrid, NGridItem, NCard, NText, NProgress,
  NDataTable, NButton, NModal, NSelect, NSpin, NAlert,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useEstimatesStore } from '@/stores/estimates.store'
import { useTasksStore } from '@/stores/tasks.store'
import type { EstimateItem } from '@/types'
import { h } from 'vue'

const route = useRoute()
const router = useRouter()
const store = useEstimatesStore()
const taskStore = useTasksStore()

const estimateId = route.params.estimateId as string
const sprintId = route.params.sprintId as string
const projectId = route.params.id as string

const showLinkModal = ref(false)
const linkingItemId = ref('')
const selectedTaskId = ref<string | null>(null)

const taskOptions = computed(() => taskStore.tasks.map(t => ({ label: t.title, value: t.id })))

const deptFields = ['frontend','backend','qa','devops','analytics','techwriter','project','other'] as const

const columns: DataTableColumns<EstimateItem> = [
  { title: 'Название', key: 'title' },
  { title: 'Отдел', key: 'department' },
  { title: 'Часы', key: 'estimatedHours', width: 80 },
  {
    title: 'Задача', key: 'linkedTaskId',
    render: r => r.linkedTaskId
      ? h(NText, { type: 'success', style: 'font-size:0.8rem' }, { default: () => taskStore.tasks.find(t => t.id === r.linkedTaskId)?.title ?? r.linkedTaskId })
      : h(NButton, { size: 'tiny', onClick: () => openLink(r.id) }, { default: () => 'Связать' }),
  },
]

function openLink(itemId: string) {
  linkingItemId.value = itemId
  showLinkModal.value = true
}

async function confirmLink() {
  if (!selectedTaskId.value) return
  await store.linkTask(linkingItemId.value, selectedTaskId.value)
  showLinkModal.value = false
  selectedTaskId.value = null
}

function pct(val: number) {
  if (!store.current) return 0
  return Math.round((val / store.current.totalHours) * 100)
}

onMounted(async () => {
  await Promise.all([store.fetchOne(estimateId), taskStore.fetchBySprint(sprintId)])
})

import { computed } from 'vue'
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else-if="store.current">
    <NPageHeader
      :title="store.current.title"
      :subtitle="`Всего: ${store.current.totalHours} ч`"
      @back="router.push(`/projects/${projectId}/sprints/${sprintId}/estimates`)"
    />

    <NGrid :cols="4" :x-gap="12" :y-gap="12" style="margin-top: 16px">
      <NGridItem v-for="dept in deptFields" :key="dept">
        <NCard size="small">
          <NText depth="3" style="font-size: 0.75rem; text-transform: uppercase">{{ dept }}</NText>
          <NText strong style="display: block; margin: 4px 0">{{ (store.current as any)[`${dept}Hours`] }} ч</NText>
          <NProgress
            type="line"
            :percentage="pct((store.current as any)[`${dept}Hours`])"
            :show-indicator="false"
            style="margin-top: 4px"
          />
        </NCard>
      </NGridItem>
    </NGrid>

    <div style="margin-top: 20px">
      <NDataTable :columns="columns" :data="store.items" :bordered="false" />
    </div>

    <NModal v-model:show="showLinkModal" preset="card" title="Связать задачу" style="max-width: 400px">
      <NSelect v-model:value="selectedTaskId" :options="taskOptions" filterable placeholder="Найти задачу..." />
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px">
        <NButton @click="showLinkModal = false">Отмена</NButton>
        <NButton type="primary" @click="confirmLink">Связать</NButton>
      </div>
    </NModal>
  </template>
</template>
