<script setup lang="ts">
import AppLayout from '@/components/Layout/AppLayout.vue'
import KpiCard from '@/components/Dashboard/KpiCard.vue'
import ChartWidget from '@/components/Dashboard/ChartWidget.vue'
import TableWidget from '@/components/Dashboard/TableWidget.vue'
import type { KpiMetric, ChartData } from '@/types'

// --- Mock data (заменить на стор после готовности API) ---
const kpis: KpiMetric[] = [
  { id: 'velocity', label: 'Velocity', value: 42, unit: 'SP', trend: 12, trendDirection: 'up' },
  { id: 'bugs', label: 'Открытые баги', value: 7, trend: -30, trendDirection: 'down' },
  { id: 'cycle', label: 'Cycle Time', value: '3.2', unit: 'дн', trend: 5, trendDirection: 'up' },
  { id: 'done', label: 'Задач закрыто', value: 28, trend: 8, trendDirection: 'up' },
]

const velocityChart: ChartData = {
  labels: ['Спринт 1', 'Спринт 2', 'Спринт 3', 'Спринт 4', 'Спринт 5'],
  datasets: [
    {
      label: 'Velocity (SP)',
      data: [30, 35, 38, 40, 42],
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79,70,229,0.1)',
    },
  ],
}

const taskDistChart: ChartData = {
  labels: ['В работе', 'На ревью', 'Готово', 'Блокировано'],
  datasets: [
    {
      label: 'Задачи',
      data: [12, 5, 28, 2],
      backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'],
    },
  ],
}

const teamColumns = [
  { field: 'name', header: 'Участник' },
  { field: 'role', header: 'Роль' },
  { field: 'done', header: 'Задач' },
  { field: 'velocity', header: 'SP' },
  { field: 'status', header: 'Статус' },
]

const teamRows = [
  { name: 'Иван Петров', role: 'Frontend', done: 8, velocity: 14, status: '🟢 Активен' },
  { name: 'Мария Сидорова', role: 'Backend', done: 10, velocity: 18, status: '🟢 Активен' },
  { name: 'Алексей Козлов', role: 'QA', done: 6, velocity: 8, status: '🟡 Занят' },
  { name: 'Ольга Никитина', role: 'Design', done: 4, velocity: 6, status: '🟢 Активен' },
]
</script>

<template>
  <AppLayout title="Дашборд">
    <div class="dashboard-grid">
      <!-- KPI row -->
      <div class="kpi-row">
        <KpiCard v-for="m in kpis" :key="m.id" :metric="m" />
      </div>

      <!-- Charts row -->
      <div class="charts-row">
        <ChartWidget
          title="Velocity по спринтам"
          type="line"
          :data="velocityChart"
        />
        <ChartWidget
          title="Распределение задач"
          type="doughnut"
          :data="taskDistChart"
          :height="220"
        />
      </div>

      <!-- Table -->
      <TableWidget
        title="Метрики команды"
        :columns="teamColumns"
        :rows="teamRows"
      />
    </div>
  </AppLayout>
</template>

<style scoped>
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .charts-row { grid-template-columns: 1fr; }
}
</style>
