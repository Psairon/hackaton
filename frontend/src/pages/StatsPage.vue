<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NGrid, NGridItem, NCard, NText, NSpin, NAlert, NStatistic } from 'naive-ui'
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController } from 'chart.js'
import { onUnmounted, ref, watch } from 'vue'
import { useStatsStore } from '@/stores/stats.store'

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController)

const route = useRoute()
const store = useStatsStore()
const sprintId = route.params.sprintId as string

const donutRef = ref<HTMLCanvasElement | null>(null)
const barRef = ref<HTMLCanvasElement | null>(null)
const estimateBarRef = ref<HTMLCanvasElement | null>(null)

let donutChart: Chart | null = null
let barChart: Chart | null = null
let estimateChart: Chart | null = null

const statusColors = ['#6b7280', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444']

function buildCharts() {
  if (!store.stats) return

  const { tasks, departments, estimates } = store.stats

  donutChart?.destroy()
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'],
        datasets: [{ data: [tasks.todo, tasks.inProgress, tasks.review, tasks.done, tasks.blocked], backgroundColor: statusColors }],
      },
      options: { plugins: { legend: { position: 'bottom', labels: { color: '#ccc', boxWidth: 12 } } } },
    })
  }

  barChart?.destroy()
  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: 'bar',
      data: {
        labels: departments.map(d => d.name),
        datasets: [
          { label: 'Оценка (ч)', data: departments.map(d => d.estimatedHours), backgroundColor: '#4f46e5' },
          { label: 'Факт (ч)', data: departments.map(d => d.actualHours), backgroundColor: '#10b981' },
        ],
      },
      options: { plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { ticks: { color: '#999' } }, y: { ticks: { color: '#999' } } } },
    })
  }

  estimateChart?.destroy()
  if (estimateBarRef.value) {
    estimateChart = new Chart(estimateBarRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Связаны с задачами', 'Без задач'],
        datasets: [{ data: [estimates.linked, estimates.unlinked], backgroundColor: ['#10b981', '#6b7280'] }],
      },
      options: { plugins: { legend: { position: 'bottom', labels: { color: '#ccc', boxWidth: 12 } } } },
    })
  }
}

onMounted(async () => {
  await store.fetchBySprint(sprintId)
  buildCharts()
})

watch(() => store.stats, buildCharts)
onUnmounted(() => { donutChart?.destroy(); barChart?.destroy(); estimateChart?.destroy() })
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else-if="store.stats">
    <!-- KPI -->
    <NGrid :cols="4" :x-gap="12" :y-gap="12" style="margin-bottom: 20px">
      <NGridItem>
        <NCard size="small">
          <NStatistic label="Всего задач" :value="store.stats.tasks.total" />
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard size="small">
          <NStatistic label="Завершено" :value="store.stats.tasks.done" />
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard size="small">
          <NStatistic label="% выполнения" :value="store.stats.tasks.completionPercent" suffix="%" />
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard size="small">
          <NStatistic label="В работе" :value="store.stats.tasks.inProgress" />
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- Charts -->
    <NGrid :cols="2" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="Задачи по статусам">
          <div style="height: 220px; position: relative">
            <canvas ref="donutRef" />
          </div>
        </NCard>
      </NGridItem>
      <NGridItem>
        <NCard title="Заявки vs Задачи">
          <div style="height: 220px; position: relative">
            <canvas ref="estimateBarRef" />
          </div>
        </NCard>
      </NGridItem>
      <NGridItem span="2">
        <NCard title="Часы по отделам (план vs факт)">
          <div style="height: 240px; position: relative">
            <canvas ref="barRef" />
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </template>
</template>
