<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NMenu, NAvatar, NText, NButton, NDivider } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { h } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menuOptions: MenuOption[] = [
  { label: 'Проекты', key: '/projects', icon: () => h('i', { class: 'pi pi-folder' }) },
]

const activeKey = computed(() => '/' + route.path.split('/')[1])

function handleSelect(key: string) {
  router.push(key)
}

function logout() {
  auth.logout()
  router.push('/login')
}

const initials = computed(() => {
  if (!auth.user) return '?'
  return `${auth.user.firstName[0]}${auth.user.lastName[0]}`.toUpperCase()
})
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-icon">TD</span>
      <span class="logo-text">TeamDash</span>
    </div>

    <NMenu
      :options="menuOptions"
      :value="activeKey"
      :indent="16"
      @update:value="handleSelect"
    />

    <div class="sidebar-footer">
      <NDivider style="margin: 8px 0" />
      <div class="user-row">
        <NAvatar round size="small" style="background: #4f46e5">{{ initials }}</NAvatar>
        <div class="user-info">
          <NText strong style="font-size: 0.85rem">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</NText>
          <NText depth="3" style="font-size: 0.75rem; text-transform: uppercase">{{ auth.user?.role }}</NText>
        </div>
        <NButton quaternary circle size="small" @click="logout">
          <template #icon><i class="pi pi-sign-out" /></template>
        </NButton>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #18181c;
  border-right: 1px solid #2a2a30;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid #2a2a30;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #4f46e5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: #fff;
}

.logo-text {
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
}

.sidebar-footer {
  margin-top: auto;
  padding: 0 12px 16px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
</style>
