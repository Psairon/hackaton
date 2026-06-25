<script setup lang="ts">
import type { KpiMetric } from '@/types'

defineProps<{
  metric: KpiMetric
  loading?: boolean
}>()
</script>

<template>
  <div class="kpi-card">
    <template v-if="loading">
      <div class="kpi-skeleton" />
    </template>
    <template v-else>
      <div class="kpi-label">{{ metric.label }}</div>
      <div class="kpi-value">
        {{ metric.value }}
        <span v-if="metric.unit" class="kpi-unit">{{ metric.unit }}</span>
      </div>
      <div
        v-if="metric.trend !== undefined"
        class="kpi-trend"
        :class="{
          'trend-up': metric.trendDirection === 'up',
          'trend-down': metric.trendDirection === 'down',
        }"
      >
        <i
          :class="
            metric.trendDirection === 'up'
              ? 'pi pi-arrow-up'
              : metric.trendDirection === 'down'
              ? 'pi pi-arrow-down'
              : 'pi pi-minus'
          "
        />
        {{ Math.abs(metric.trend) }}%
      </div>
    </template>
  </div>
</template>

<style scoped>
.kpi-card {
  background: var(--surface-card, #fff);
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid var(--surface-border, #e5e7eb);
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary, #6b7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color, #111827);
  line-height: 1;
}

.kpi-unit {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-color-secondary, #6b7280);
  margin-left: 4px;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.trend-up { color: #10b981; }
.trend-down { color: #ef4444; }

.kpi-skeleton {
  flex: 1;
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
