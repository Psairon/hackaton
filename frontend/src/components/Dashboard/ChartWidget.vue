<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart,
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'
import type { ChartData, ChartType } from '@/types'

Chart.register(
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
)

const props = defineProps<{
  title: string
  type: ChartType
  data: ChartData
  loading?: boolean
  height?: number
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

function buildChart() {
  if (!canvasRef.value) return
  chart?.destroy()
  chart = new Chart(canvasRef.value, {
    type: props.type,
    data: props.data as any,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12 } },
        tooltip: { mode: 'index', intersect: false },
      },
    },
  })
}

onMounted(buildChart)
watch(() => props.data, buildChart, { deep: true })
onUnmounted(() => chart?.destroy())
</script>

<template>
  <div class="chart-widget">
    <div class="widget-header">
      <span class="widget-title">{{ title }}</span>
    </div>
    <div v-if="loading" class="chart-skeleton" :style="{ height: `${height ?? 260}px` }" />
    <div v-else class="chart-body" :style="{ height: `${height ?? 260}px` }">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<style scoped>
.chart-widget {
  background: var(--surface-card, #fff);
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid var(--surface-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.widget-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color, #111827);
}

.chart-body { position: relative; }

.chart-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
