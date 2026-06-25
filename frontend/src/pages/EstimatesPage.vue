<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NDataTable, NButton, NSpin, NAlert, NEmpty, NUpload, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useEstimatesStore } from '@/stores/estimates.store'
import type { Estimate } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useEstimatesStore()
const sprintId = route.params.sprintId as string
const projectId = route.params.id as string

const columns: DataTableColumns<Estimate> = [
  { title: 'Название', key: 'title' },
  { title: 'Всего (ч)', key: 'totalHours', width: 100 },
  { title: 'Frontend', key: 'frontendHours', width: 100 },
  { title: 'Backend', key: 'backendHours', width: 100 },
  { title: 'QA', key: 'qaHours', width: 80 },
  { title: 'DevOps', key: 'devopsHours', width: 90 },
  { title: 'Дата', key: 'createdAt', render: r => new Date(r.createdAt).toLocaleDateString('ru') },
]

function goToEstimate(row: Estimate) {
  router.push(`/projects/${projectId}/sprints/${sprintId}/estimates/${row.id}`)
}

onMounted(() => store.fetchBySprint(sprintId))
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else>
    <NSpace style="margin-bottom: 12px; justify-content: flex-end">
      <NUpload :show-file-list="false" accept=".xlsx,.xls,.csv">
        <NButton>Импортировать заявку</NButton>
      </NUpload>
    </NSpace>
    <NEmpty v-if="!store.estimates.length" description="Нет заявок" style="padding: 40px 0" />
    <NDataTable
      v-else
      :columns="columns"
      :data="store.estimates"
      :bordered="false"
      :row-props="row => ({ onClick: () => goToEstimate(row), style: 'cursor:pointer' })"
    />
  </template>
</template>
