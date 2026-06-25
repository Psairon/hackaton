<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

defineProps<{ title?: string }>()

const ui = useUiStore()
const auth = useAuthStore()
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="toggle-btn" @click="ui.toggleSidebar()">
        <i :class="ui.sidebarCollapsed ? 'pi pi-bars' : 'pi pi-times'" />
      </button>
      <h1 class="page-title">{{ title ?? 'Дашборд' }}</h1>
    </div>

    <div class="header-right">
      <button class="icon-btn" @click="ui.toggleTheme()">
        <i :class="ui.theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'" />
      </button>
      <div class="user-chip">
        <i class="pi pi-user" />
        <span>{{ auth.user?.name ?? 'Гость' }}</span>
        <span class="role-badge">{{ auth.user?.role ?? '' }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 60px;
  background: var(--surface-card, #ffffff);
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color, #111827);
}

.toggle-btn, .icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: var(--text-color-secondary, #6b7280);
  transition: background 0.15s;
}
.toggle-btn:hover, .icon-btn:hover { background: var(--surface-hover, #f3f4f6); }

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--surface-ground, #f9fafb);
  font-size: 0.85rem;
  color: var(--text-color, #111827);
}

.role-badge {
  background: #4f46e5;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  text-transform: uppercase;
}
</style>
