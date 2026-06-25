<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton, NSpin, NAlert, NCard, NTag, NCollapse, NCollapseItem, NSpace, useMessage,
} from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const id = route.params.id as string

type Risk = 'red' | 'yellow' | 'green' | 'grey'
interface AiAnalysis {
  generatedAt: string
  controlObject: { id: string; name: string }
  state: string
  mainRisks: { ref: string; title: string; level: Risk; text: string }[]
  questions: { ref: string; text: string }[]
  recommendations: { ref: string; action: string; text: string }[]
  explanations: { ref: string; basis: string }[]
  dataGaps: string[]
  copyText: string
}

const obj = ref<any>(null)
const comparison = ref<any>(null)
const analysis = ref<AiAnalysis | null>(null)

const loading = ref(true)
const generating = ref(false)
const error = ref('')

const DIRECTION_LABELS: Record<string, string> = {
  backend: 'Бэкенд', frontend: 'Фронтенд', analytics: 'Аналитика', teamlead: 'Тимлид',
  qa: 'QA', devops: 'DevOps', design: 'Дизайнер', other: 'Прочее',
}

function riskType(level: string): 'error' | 'warning' | 'success' | 'default' {
  if (level === 'red') return 'error'
  if (level === 'yellow') return 'warning'
  if (level === 'green') return 'success'
  return 'default'
}
function fmt(n: number | null | undefined, suffix = '') {
  if (n == null) return '—'
  return n.toLocaleString('ru') + suffix
}
function pct(n: number | null | undefined) {
  return n == null ? '—' : n.toFixed(0) + '%'
}

// Ключевые отклонения — из расчётного слоя (Analytics), не из AI.
const keyDeviations = computed(() => {
  const byDir = comparison.value?.byDirection ?? []
  return [...byDir]
    .filter((d: any) => d.risk !== 'green' || Math.abs(d.deviation) > 0)
    .sort((a: any, b: any) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 8)
})

async function load() {
  loading.value = true
  try {
    const [objRes, cmpRes] = await Promise.allSettled([
      controlObjectsApi.getById(id),
      controlObjectsApi.getComparison(id),
    ])
    if (objRes.status === 'fulfilled') obj.value = objRes.value.data
    if (cmpRes.status === 'fulfilled') comparison.value = cmpRes.value.data
  } finally {
    loading.value = false
  }
}

async function generate() {
  generating.value = true
  error.value = ''
  try {
    const { data } = await controlObjectsApi.generateAiAnalysis(id)
    analysis.value = data
    message.success('AI-анализ сформирован')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Не удалось сформировать AI-анализ.'
  } finally {
    generating.value = false
  }
}

function copySummary() {
  const a = analysis.value
  if (!a) return
  const date = new Date(a.generatedAt).toLocaleString('ru')
  const lines: string[] = [
    `Сводка по объекту «${obj.value?.name ?? a.controlObject?.name ?? ''}» — ${date}`,
    '',
    a.state,
  ]
  if (a.mainRisks?.length) {
    lines.push('', 'Зоны риска:')
    a.mainRisks.forEach((r) => lines.push(`• [${r.ref}] ${r.title}: ${r.text}`))
  }
  if (a.questions?.length) {
    lines.push('', 'Вопросы команде:')
    a.questions.forEach((q, i) => lines.push(`${i + 1}. ${q.text}${q.ref ? ` (${q.ref})` : ''}`))
  }
  if (a.recommendations?.length) {
    lines.push('', 'Рекомендации:')
    a.recommendations.forEach((r) => lines.push(`• ${r.action}${r.ref ? ` [${r.ref}]` : ''}: ${r.text}`))
  }
  navigator.clipboard.writeText(lines.join('\n'))
  message.success('Сводка скопирована в буфер обмена')
}

onMounted(load)
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #e2e8f0;">
          🤖 AI-анализ · {{ obj?.name ?? '...' }}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          <span v-if="obj?.type">{{ obj.type }} · </span>
          <span v-if="analysis">сформирован {{ new Date(analysis.generatedAt).toLocaleString('ru') }} · </span>
          источник: расчётные данные Analytics
        </div>
      </div>
      <NSpace>
        <NButton size="small" @click="router.push(`/control-objects/${id}`)">← Dashboard</NButton>
        <NButton size="small" @click="router.push(`/control-objects/${id}/data`)">Данные</NButton>
        <NButton size="small" :disabled="!analysis" @click="copySummary">📋 Скопировать сводку</NButton>
        <NButton size="small" type="primary" :loading="generating" :disabled="loading" @click="generate">
          {{ analysis ? '🔄 Обновить анализ' : '▶ Сформировать анализ' }}
        </NButton>
      </NSpace>
    </div>

    <!-- Body -->
    <div style="flex: 1; overflow-y: auto;">
      <NSpin v-if="loading" :show="true" style="display: block; padding: 60px;" />

      <div v-else style="padding: 20px 28px; display: flex; flex-direction: column; gap: 16px; max-width: 920px;">

        <!-- Ключевые отклонения (Analytics, доступны без AI) -->
        <NCard v-if="keyDeviations.length" size="small" title="Ключевые отклонения"
          style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div v-for="(d, i) in keyDeviations" :key="i"
              style="padding: 10px 14px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px;">
              <NTag :type="riskType(d.risk)" size="small" :bordered="false" style="flex-shrink: 0;">
                {{ (d.risk ?? '—').toUpperCase() }}
              </NTag>
              <div style="font-size: 13px; color: #e2e8f0; font-weight: 500; min-width: 110px;">
                {{ DIRECTION_LABELS[d.direction] ?? d.direction }}
              </div>
              <div style="font-size: 12px; color: #94a3b8;">
                baseline {{ fmt(d.baselineHours, ' ч') }} · факт {{ fmt(d.actualHours, ' ч') }} ·
                <span :style="{ color: d.deviation > 0 ? '#f87171' : '#94a3b8' }">
                  откл. {{ d.deviation > 0 ? '+' : '' }}{{ fmt(d.deviation, ' ч') }}
                </span>
                · {{ pct(d.usagePercent) }}
              </div>
            </div>
          </div>
        </NCard>

        <!-- AI: generating -->
        <div v-if="generating" style="display: flex; align-items: center; justify-content: center; padding: 50px;">
          <div style="text-align: center; color: #94a3b8; font-size: 15px;">
            <NSpin /> <div style="margin-top: 12px;">Анализ проекта выполняется…</div>
          </div>
        </div>

        <!-- AI: error -->
        <NAlert v-else-if="error" type="error" title="Ошибка AI-анализа" style="border-radius: 10px;">
          <div style="margin-bottom: 10px;">{{ error }}</div>
          <NButton size="small" @click="generate">Повторить</NButton>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Остальные данные объекта остаются доступны.
          </div>
        </NAlert>

        <!-- AI: empty -->
        <div v-else-if="!analysis"
          style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px; gap: 14px;">
          <div style="font-size: 36px;">🤖</div>
          <div style="font-size: 15px; color: #94a3b8;">Анализ ещё не сформирован</div>
          <NButton type="primary" @click="generate">Сформировать анализ</NButton>
        </div>

        <!-- AI: result -->
        <template v-else>
          <!-- Общая сводка -->
          <NCard size="small" title="Общая AI-сводка"
            style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-size: 14px; color: #cbd5e1; line-height: 1.7; white-space: pre-wrap;">{{ analysis.state }}</div>
          </NCard>

          <!-- Основные зоны риска -->
          <NCard v-if="analysis.mainRisks?.length" size="small" title="Основные зоны риска"
            style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div v-for="(z, i) in analysis.mainRisks" :key="i"
                style="padding: 12px 14px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <NTag :type="riskType(z.level)" size="small" :bordered="false">{{ (z.level ?? '—').toUpperCase() }}</NTag>
                  <span style="font-size: 13px; color: #e2e8f0; font-weight: 500;">{{ z.title }}</span>
                  <NTag v-if="z.ref" size="tiny" :bordered="false" style="background: rgba(255,255,255,0.05); color: #94a3b8;">{{ z.ref }}</NTag>
                </div>
                <div style="font-size: 13px; color: #94a3b8;">{{ z.text }}</div>
              </div>
            </div>
          </NCard>

          <!-- Вопросы для команды -->
          <NCard v-if="analysis.questions?.length" size="small" title="Вопросы для команды"
            style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <ol style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
              <li v-for="(q, i) in analysis.questions" :key="i" style="font-size: 13px; color: #cbd5e1;">
                {{ q.text }}
                <NTag v-if="q.ref" size="tiny" :bordered="false" style="background: rgba(255,255,255,0.05); color: #64748b; margin-left: 6px;">{{ q.ref }}</NTag>
              </li>
            </ol>
          </NCard>

          <!-- Рекомендуемые действия -->
          <NCard v-if="analysis.recommendations?.length" size="small" title="Рекомендуемые действия"
            style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div v-for="(r, i) in analysis.recommendations" :key="i"
                style="padding: 10px 14px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                  <NTag type="info" size="small" :bordered="false">{{ r.action }}</NTag>
                  <NTag v-if="r.ref" size="tiny" :bordered="false" style="background: rgba(255,255,255,0.05); color: #94a3b8;">{{ r.ref }}</NTag>
                </div>
                <div style="font-size: 13px; color: #cbd5e1;">{{ r.text }}</div>
              </div>
            </div>
          </NCard>

          <!-- Обоснование выводов -->
          <NCard v-if="analysis.explanations?.length" size="small" title="Обоснование выводов"
            style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <NCollapse>
              <NCollapseItem v-for="(e, i) in analysis.explanations" :key="i" :title="e.ref || `Вывод ${i + 1}`" :name="i">
                <div style="font-size: 13px; color: #94a3b8; line-height: 1.6;">{{ e.basis }}</div>
              </NCollapseItem>
            </NCollapse>
          </NCard>

          <!-- Ограничения анализа -->
          <NAlert v-if="analysis.dataGaps?.length" type="warning" title="Ограничения анализа" style="border-radius: 10px;">
            <ul style="margin: 6px 0 0; padding-left: 18px; font-size: 13px; color: #94a3b8;">
              <li v-for="(g, i) in analysis.dataGaps" :key="i">{{ g }}</li>
            </ul>
          </NAlert>
        </template>

      </div>
    </div>
  </div>
</template>
