<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import { RouterView } from 'vue-router'

defineProps<{ title?: string }>()
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="layout-main">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #101014;
}

.layout-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px;
}
</style>
