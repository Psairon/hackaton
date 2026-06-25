<script setup lang="ts">
defineProps<{
  title: string
  columns: { field: string; header: string; width?: string }[]
  rows: Record<string, any>[]
  loading?: boolean
}>()
</script>

<template>
  <div class="table-widget">
    <div class="widget-header">
      <span class="widget-title">{{ title }}</span>
    </div>

    <div v-if="loading" class="table-skeleton">
      <div v-for="i in 5" :key="i" class="skeleton-row" />
    </div>

    <div v-else-if="!rows.length" class="table-empty">
      <i class="pi pi-inbox" />
      <span>Нет данных</span>
    </div>

    <div v-else class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.field"
              :style="col.width ? { width: col.width } : {}"
            >
              {{ col.header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td v-for="col in columns" :key="col.field">
              {{ row[col.field] ?? '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-widget {
  background: var(--surface-card, #fff);
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid var(--surface-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.widget-header { display: flex; align-items: center; justify-content: space-between; }
.widget-title { font-size: 0.95rem; font-weight: 600; color: var(--text-color, #111827); }

.table-scroll { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--text-color-secondary, #6b7280);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid var(--surface-border, #e5e7eb);
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
  color: var(--text-color, #111827);
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--surface-hover, #f9fafb); }

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-color-secondary, #9ca3af);
  font-size: 0.9rem;
}
.table-empty .pi { font-size: 2rem; }

.skeleton-row {
  height: 40px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
