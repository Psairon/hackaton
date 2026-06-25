<script setup lang="ts">
import { onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>

<template>
  <NConfigProvider :theme="darkTheme">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', system-ui, sans-serif; background: #101014; }
a { text-decoration: none; }
</style>
