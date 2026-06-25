<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NSpace, NCard, NText, NSpin, NAlert } from 'naive-ui'
import { apiClient } from '@/api/client'

const route = useRoute()
const sprintId = route.params.sprintId as string

type State = 'idle' | 'loading' | 'success' | 'error'

const summaryState = ref<State>('idle')
const risksState = ref<State>('idle')
const summaryText = ref('')
const risksText = ref('')
const summaryError = ref('')
const risksError = ref('')

async function fetchSummary() {
  summaryState.value = 'loading'
  summaryError.value = ''
  try {
    const { data } = await apiClient.post<{ result: string }>(`/ai/sprint/${sprintId}/summary`)
    summaryText.value = data.result
    summaryState.value = 'success'
  } catch (e: any) {
    summaryError.value = e.response?.data?.message ?? 'Ошибка генерации'
    summaryState.value = 'error'
  }
}

async function fetchRisks() {
  risksState.value = 'loading'
  risksError.value = ''
  try {
    const { data } = await apiClient.post<{ result: string }>(`/ai/sprint/${sprintId}/risks`)
    risksText.value = data.result
    risksState.value = 'success'
  } catch (e: any) {
    risksError.value = e.response?.data?.message ?? 'Ошибка анализа'
    risksState.value = 'error'
  }
}
</script>

<template>
  <div>
    <NText strong style="font-size: 1.1rem; display: block; margin-bottom: 20px">✨ AI Анализ спринта</NText>

    <NSpace :size="16" style="flex-wrap: wrap">
      <!-- Summary -->
      <NCard title="Саммари спринта" style="min-width: 340px; flex: 1">
        <template #header-extra>
          <NButton type="primary" size="small" :loading="summaryState === 'loading'" @click="fetchSummary">
            Сгенерировать
          </NButton>
        </template>

        <NSpin v-if="summaryState === 'loading'" />
        <NAlert v-else-if="summaryState === 'error'" type="error" :title="summaryError" />
        <NText v-else-if="summaryState === 'success'" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.7">
          {{ summaryText }}
        </NText>
        <NText v-else depth="3" style="font-size: 0.875rem">
          Нажмите кнопку — Claude проанализирует прогресс спринта и предоставит краткое резюме.
        </NText>
      </NCard>

      <!-- Risks -->
      <NCard title="Анализ рисков" style="min-width: 340px; flex: 1">
        <template #header-extra>
          <NButton type="warning" size="small" :loading="risksState === 'loading'" @click="fetchRisks">
            Анализировать
          </NButton>
        </template>

        <NSpin v-if="risksState === 'loading'" />
        <NAlert v-else-if="risksState === 'error'" type="error" :title="risksError" />
        <NText v-else-if="risksState === 'success'" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.7">
          {{ risksText }}
        </NText>
        <NText v-else depth="3" style="font-size: 0.875rem">
          Нажмите кнопку — Claude выявит риски и узкие места текущего спринта.
        </NText>
      </NCard>
    </NSpace>
  </div>
</template>
