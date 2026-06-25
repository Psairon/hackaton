<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton, NCard, NGrid, NGridItem, NText, NSpin, NAlert,
  NEmpty, NModal, NForm, NFormItem, NInput, NPageHeader,
} from 'naive-ui'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useProjectsStore } from '@/stores/projects.store'

const router = useRouter()
const store = useProjectsStore()

const showModal = ref(false)
const newProject = ref({ name: '', description: '' })
const submitting = ref(false)

onMounted(() => store.fetchAll())

async function createProject() {
  if (!newProject.value.name.trim()) return
  submitting.value = true
  try {
    await store.create({ ...newProject.value })
    showModal.value = false
    newProject.value = { name: '', description: '' }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppLayout>
    <NPageHeader title="Проекты" subtitle="Все ваши проекты">
      <template #extra>
        <NButton type="primary" @click="showModal = true">+ Создать проект</NButton>
      </template>
    </NPageHeader>

    <div style="margin-top: 20px">
      <NSpin v-if="store.loading" />
      <NAlert v-else-if="store.error" type="error" :title="store.error" />
      <NEmpty v-else-if="!store.projects.length" description="Нет проектов" style="padding: 60px 0" />
      <NGrid v-else :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
        <NGridItem v-for="p in store.projects" :key="p.id" span="3 m:1">
          <NCard
            hoverable
            style="cursor: pointer; height: 140px"
            @click="router.push(`/projects/${p.id}`)"
          >
            <NText strong style="font-size: 1rem; display: block; margin-bottom: 8px">{{ p.name }}</NText>
            <NText depth="3" style="font-size: 0.875rem">{{ p.description ?? 'Без описания' }}</NText>
            <template #footer>
              <NText depth="3" style="font-size: 0.75rem">{{ new Date(p.createdAt).toLocaleDateString('ru') }}</NText>
            </template>
          </NCard>
        </NGridItem>
      </NGrid>
    </div>

    <NModal v-model:show="showModal" preset="card" title="Новый проект" style="max-width: 440px">
      <NForm label-placement="top">
        <NFormItem label="Название" required>
          <NInput v-model:value="newProject.name" placeholder="Название проекта" />
        </NFormItem>
        <NFormItem label="Описание">
          <NInput v-model:value="newProject.description" type="textarea" :rows="3" placeholder="Краткое описание" />
        </NFormItem>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <NButton @click="showModal = false">Отмена</NButton>
          <NButton type="primary" :loading="submitting" @click="createProject">Создать</NButton>
        </div>
      </NForm>
    </NModal>
  </AppLayout>
</template>
