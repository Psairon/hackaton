<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton, NSpin, NAlert, NCard, NTag, NCollapse, NCollapseItem, NSpace, useMessage,
} from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const id = route.params.id as string

const obj = ref<any>(null)
const analysis = ref<any>(null)
const loading = ref(true)
const generating = ref(false)

function riskType(level: string): 'error' | 'warning' | 'success' | 'default' {
  if (level === 'red') return 'error'
  if (level === 'yellow') return 'warning'
  if (level === 'green') return 'success'
  return 'default'
}

async function load() {
  loading.value = true
  try {
    const [objRes, aiRes] = await Promise.allSettled([
      controlObjectsApi.getById(id),
      controlObjectsApi.getAiAnalysis(id),
    ])
    if (objRes.status === 'fulfilled') obj.value = objRes.value.data
    if (aiRes.status === 'fulfilled') analysis.value = aiRes.value.data
  } finally {
    loading.value = false
  }
}

async function generate() {
  generating.value = true
  try {
    const { data } = await controlObjectsApi.generateAiAnalysis(id)
    analysis.value = data
    message.success('AI-анализ сформирован')
  } catch {
    message.error('Не удалось сформировать AI-анализ')
  } finally {
    generating.value = false
  }
}

function copySummary() {
  if (!analysis.value) return
  const text = [
    new Date(analysis.value.generatedAt).toLocaleString('ru'),
    obj.value?.name ?? '',
    '',
    analysis.value.summary ?? '',
    '',
    'Вопросы команде:',
    ...(analysis.value.questions ?? []).map((q: any, i: number) => `${i + 1}. ${q.text ?? q}`),
    '',
    'Рекомендации:',
    ...(analysis.value.recommendations ?? []).map((r: any) => `• ${r.description ?? r}`),
  ].join('\n')
  navigator.clipboard.writeText(text)
  message.success('Сводка скопирована в буфер обмена')
}

onMounted(load)
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #e2e8f0;">
          🤖 AI-анализ · {{ obj?.name ?? '...' }}
        </div>
        <div v-if="analysis" style="font-size: 12px; color: #64748b; margin-top: 2px;">
          Сформирован: {{ new Date(analysis.generatedAt).toLocaleString('ru') }}
        </div>
      </div>
      <NSpace>
        <NButton size="small" @click="router.push(`/control-objects/${id}`)">
          ← Dashboard
        </NButton>
        <NButton size="small" :disabled="!analysis" @click="copySummary">
          📋 Скопировать сводку
        </NButton>
        <NButton size="small" type="primary" :loading="generating" @click="generate">
          {{ analysis ? '🔄 Обновить анализ' : '▶ Сформировать анализ' }}
        </NButton>
      </NSpace>
    </div>

    <!-- Body -->
    <NSpin :show="loading || generating" style="flex: 1; overflow: hidden;">
      <div v-if="generating" style="display: flex; align-items: center; justify-content: center; height: 100%;">
        <div style="text-align: center; color: #94a3b8; font-size: 15px;">
          Анализ проекта выполняется…
        </div>
      </div>

      <div v-else-if="!loading && !analysis"
        style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px;">
        <div style="font-size: 40px;">🤖</div>
        <div style="font-size: 15px; color: #94a3b8;">Анализ ещё не сформирован</div>
        <NButton type="primary" @click="generate">Сформировать анализ</NButton>
      </div>

      <div v-else-if="analysis" style="overflow-y: auto; height: calc(100vh - 65px); padding: 20px 28px; display: flex; flex-direction: column; gap: 16px; max-width: 900px;">

        <!-- Summary -->
        <NCard size="small" title="Общая AI-сводка"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <div style="font-size: 14px; color: #cbd5e1; line-height: 1.7; white-space: pre-wrap;">{{ analysis.summary }}</div>
        </NCard>

        <!-- Deviations -->
        <NCard v-if="analysis.deviations?.length" size="small" title="Ключевые отклонения"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div v-for="(d, i) in analysis.deviations" :key="i"
              style="padding: 12px 14px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: flex-start; gap: 12px;">
              <NTag :type="riskType(d.riskLevel)" size="small" :bordered="false" style="flex-shrink: 0; margin-top: 1px;">
                {{ d.riskLevel?.toUpperCase() ?? '—' }}
              </NTag>
              <div>
                <div style="font-size: 13px; color: #e2e8f0; font-weight: 500; margin-bottom: 2px;">{{ d.object }}</div>
                <div style="font-size: 13px; color: #94a3b8;">{{ d.description }}</div>
                <div v-if="d.value != null" style="font-size: 12px; color: #64748b; margin-top: 2px;">{{ d.value }}</div>
              </div>
            </div>
          </div>
        </NCard>

        <!-- Risk Zones -->
        <NCard v-if="analysis.riskZones?.length" size="small" title="Основные зоны риска"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div v-for="(z, i) in analysis.riskZones" :key="i"
              style="padding: 12px 14px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <NTag :type="riskType(z.severity)" size="small" :bordered="false">{{ z.severity?.toUpperCase() ?? '—' }}</NTag>
                <span style="font-size: 13px; color: #e2e8f0; font-weight: 500;">{{ z.object }}</span>
              </div>
              <div style="font-size: 13px; color: #94a3b8;">{{ z.description }}</div>
            </div>
          </div>
        </NCard>

        <!-- Questions -->
        <NCard v-if="analysis.questions?.length" size="small" title="Вопросы для команды"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li v-for="(q, i) in analysis.questions" :key="i" style="font-size: 13px; color: #cbd5e1;">
              <span>{{ q.text ?? q }}</span>
              <span v-if="q.object" style="font-size: 12px; color: #64748b; margin-left: 6px;">({{ q.object }})</span>
            </li>
          </ol>
        </NCard>

        <!-- Recommendations -->
        <NCard v-if="analysis.recommendations?.length" size="small" title="Рекомендуемые действия"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div v-for="(r, i) in analysis.recommendations" :key="i"
              style="padding: 10px 14px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
              <div style="font-size: 13px; color: #e2e8f0; font-weight: 500; margin-bottom: 2px;">{{ r.description ?? r }}</div>
              <div v-if="r.reason" style="font-size: 12px; color: #64748b;">Причина: {{ r.reason }}</div>
              <div v-if="r.relatedObject" style="font-size: 12px; color: #64748b;">Объект: {{ r.relatedObject }}</div>
            </div>
          </div>
        </NCard>

        <!-- Explanations -->
        <NCard v-if="analysis.explanations?.length" size="small" title="Обоснование выводов"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <NCollapse>
            <NCollapseItem v-for="(e, i) in analysis.explanations" :key="i" :title="e.conclusion ?? `Вывод ${i + 1}`" :name="i">
              <div style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
                <div style="margin-bottom: 4px;"><b style="color: #64748b;">Основание:</b> {{ e.basis }}</div>
                <div v-if="e.metrics?.length"><b style="color: #64748b;">Показатели:</b> {{ e.metrics.join(', ') }}</div>
              </div>
            </NCollapseItem>
          </NCollapse>
        </NCard>

        <!-- Data Gaps -->
        <NAlert v-if="analysis.dataGaps?.length" type="warning" title="Ограничения анализа" style="border-radius: 10px;">
          <ul style="margin: 6px 0 0; padding-left: 18px; font-size: 13px; color: #94a3b8;">
            <li v-for="(g, i) in analysis.dataGaps" :key="i">{{ g }}</li>
          </ul>
        </NAlert>

      </div>
    </NSpin>
  </div>
</template>
