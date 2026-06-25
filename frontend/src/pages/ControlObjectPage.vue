<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton, NDataTable, NSpin, NTag, NSpace, NCard, NStatistic,
  NGrid, NGridItem, NAlert, NProgress, useMessage, NTooltip,
} from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const id = route.params.id as string

const obj = ref<any>(null)
const dashboard = ref<any>(null)
const comparison = ref<any>(null)
const risks = ref<any>(null)
const dataQuality = ref<any>(null)
const aiAnalysis = ref<any>(null)

const loading = ref(true)
const aiLoading = ref(false)

// ─── helpers ──────────────────────────────────────────────────────────────────

function riskColor(level: string): string {
  if (level === 'red') return '#ef4444'
  if (level === 'yellow') return '#f59e0b'
  if (level === 'green') return '#22c55e'
  return '#64748b'
}
function riskType(level: string): 'error' | 'warning' | 'success' | 'default' {
  if (level === 'red') return 'error'
  if (level === 'yellow') return 'warning'
  if (level === 'green') return 'success'
  return 'default'
}
function statusLabel(level: string) {
  if (level === 'red') return '🔴 Критический риск'
  if (level === 'yellow') return '🟡 Требует внимания'
  if (level === 'green') return '🟢 В управляемом состоянии'
  return '⚪ Недостаточно данных'
}
function statusBg(level: string) {
  if (level === 'red') return 'rgba(239,68,68,0.08)'
  if (level === 'yellow') return 'rgba(245,158,11,0.08)'
  if (level === 'green') return 'rgba(34,197,94,0.08)'
  return 'rgba(100,116,139,0.08)'
}
function statusBorder(level: string) {
  if (level === 'red') return '1px solid rgba(239,68,68,0.25)'
  if (level === 'yellow') return '1px solid rgba(245,158,11,0.25)'
  if (level === 'green') return '1px solid rgba(34,197,94,0.25)'
  return '1px solid rgba(100,116,139,0.25)'
}
function fmt(n: number | null | undefined, suffix = '') {
  if (n == null) return '—'
  return n.toLocaleString('ru') + suffix
}
function fmtPct(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toFixed(1) + '%'
}

// ─── data ─────────────────────────────────────────────────────────────────────

const hasData = computed(() => dashboard.value && (dashboard.value.baselineHours > 0 || dashboard.value.epicCount > 0))
const overallRisk = computed(() => dashboard.value?.overallRisk ?? 'grey')
const baselinePct = computed(() => Math.min(dashboard.value?.usagePercent ?? 0, 100))

async function loadAll() {
  loading.value = true
  try {
    const [objRes, dashRes, cmpRes, riskRes, dqRes] = await Promise.allSettled([
      controlObjectsApi.getById(id),
      controlObjectsApi.getDashboard(id),
      controlObjectsApi.getComparison(id),
      controlObjectsApi.getRisks(id),
      controlObjectsApi.getDataQuality(id),
    ])
    if (objRes.status === 'fulfilled') obj.value = objRes.value.data
    if (dashRes.status === 'fulfilled') dashboard.value = dashRes.value.data
    if (cmpRes.status === 'fulfilled') comparison.value = cmpRes.value.data
    if (riskRes.status === 'fulfilled') risks.value = riskRes.value.data
    if (dqRes.status === 'fulfilled') dataQuality.value = dqRes.value.data
  } finally {
    loading.value = false
  }
}

async function loadAi() {
  aiLoading.value = true
  try {
    const { data } = await controlObjectsApi.getAiAnalysis(id)
    aiAnalysis.value = data
  } catch {
    // AI not yet generated
  } finally {
    aiLoading.value = false
  }
}

async function generateAi() {
  aiLoading.value = true
  try {
    const { data } = await controlObjectsApi.generateAiAnalysis(id)
    aiAnalysis.value = data
    message.success('AI-анализ сформирован')
  } catch {
    message.error('Не удалось сформировать AI-анализ')
  } finally {
    aiLoading.value = false
  }
}

onMounted(async () => {
  await loadAll()
  await loadAi()
})

// ─── tables ───────────────────────────────────────────────────────────────────

const directionColumns = [
  { title: 'Направление', key: 'direction', ellipsis: true },
  { title: 'Baseline (ч)', key: 'baselineHours', width: 110, render: (r: any) => fmt(r.baselineHours) },
  { title: 'Факт (ч)', key: 'actualHours', width: 100, render: (r: any) => fmt(r.actualHours) },
  { title: 'Откл. (ч)', key: 'deviation', width: 100,
    render: (r: any) => {
      const v = r.deviation ?? 0
      const color = v > 0 ? '#ef4444' : v < 0 ? '#22c55e' : '#94a3b8'
      return h('span', { style: { color } }, (v > 0 ? '+' : '') + fmt(v))
    }
  },
  { title: 'Использ. %', key: 'usagePercent', width: 110, render: (r: any) => fmtPct(r.usagePercent) },
  {
    title: 'Риск', key: 'risk', width: 80,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

const roleColumns = [
  { title: 'Роль', key: 'role', ellipsis: true },
  { title: 'Напр.', key: 'direction', width: 100 },
  { title: 'Baseline (ч)', key: 'baselineHours', width: 110, render: (r: any) => fmt(r.baselineHours) },
  { title: 'Факт (ч)', key: 'actualHours', width: 100, render: (r: any) => fmt(r.actualHours) },
  { title: 'Использ. %', key: 'usagePercent', width: 110, render: (r: any) => fmtPct(r.usagePercent) },
  {
    title: 'Риск', key: 'risk', width: 80,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

const sortedDirections = computed(() => {
  const order: Record<string, number> = { red: 0, yellow: 1, grey: 2, green: 3 }
  return [...(comparison.value?.byDirection ?? [])].sort((a, b) => (order[a.risk] ?? 9) - (order[b.risk] ?? 9))
})
const sortedRoles = computed(() => {
  const order: Record<string, number> = { red: 0, yellow: 1, grey: 2, green: 3 }
  return [...(comparison.value?.byRole ?? [])].sort((a, b) => (order[a.risk] ?? 9) - (order[b.risk] ?? 9))
})
const topRisks = computed(() => (risks.value?.items ?? []).slice(0, 5))

const dqCount = computed(() => {
  if (!dataQuality.value) return 0
  return (dataQuality.value.unlinkedEstimateTasks?.length ?? 0) +
    (dataQuality.value.unlinkedEpics?.length ?? 0) +
    (dataQuality.value.tasksWithIssues?.length ?? 0)
})
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #e2e8f0;">
          {{ obj?.name ?? '...' }}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          {{ obj?.type }} · {{ obj?.startDate ?? '' }} — {{ obj?.plannedEndDate ?? '' }}
        </div>
      </div>
      <NSpace>
        <NButton size="small" @click="router.push(`/control-objects/${id}/data`)">
          📂 Данные
        </NButton>
        <NButton size="small" type="primary" @click="router.push(`/control-objects/${id}/ai`)">
          🤖 AI-анализ
        </NButton>
      </NSpace>
    </div>

    <!-- Body -->
    <NSpin :show="loading" style="flex: 1; overflow: hidden;">
      <div style="flex: 1; overflow-y: auto; height: calc(100vh - 65px); padding: 20px 28px;">

        <!-- Empty state -->
        <div v-if="!loading && !hasData" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; text-align: center;">
          <div style="font-size: 40px;">📊</div>
          <div style="font-size: 15px; color: #94a3b8;">Для формирования Dashboard необходимо загрузить Baseline и текущие данные Jira</div>
          <NSpace>
            <NButton type="primary" @click="router.push(`/control-objects/${id}/data?tab=baseline`)">
              📋 Загрузить Baseline
            </NButton>
            <NButton @click="router.push(`/control-objects/${id}/data?tab=jira`)">
              🔗 Загрузить Jira
            </NButton>
          </NSpace>
        </div>

        <!-- Main 2-column layout -->
        <div v-else style="display: flex; gap: 20px; align-items: flex-start;">

          <!-- ── Left column ── -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;">

            <!-- KPI Cards -->
            <NGrid :cols="5" :x-gap="12" :y-gap="12">
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Baseline (ч)" :value="dashboard?.baselineHours ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Факт (ч)" :value="dashboard?.actualHours ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Использ. Baseline" :value="fmtPct(dashboard?.usagePercent)" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Задач оценки" :value="dashboard?.estimateTaskCount ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Jira Epic" :value="dashboard?.epicCount ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Jira Task" :value="dashboard?.taskCount ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="В работе" :value="dashboard?.tasksInProgress ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                  <NStatistic label="Завершено" :value="dashboard?.tasksDone ?? 0" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard size="small"
                  style="cursor: pointer; background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);"
                  @click="router.push(`/control-objects/${id}/data?tab=review`)">
                  <NStatistic label="Требует проверки" :value="dqCount" />
                </NCard>
              </NGridItem>
            </NGrid>

            <!-- Project Status -->
            <div :style="{
              borderRadius: '10px',
              padding: '16px 20px',
              background: statusBg(overallRisk),
              border: statusBorder(overallRisk),
            }">
              <div style="font-size: 18px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px;">
                {{ statusLabel(overallRisk) }}
              </div>
              <div v-if="comparison?.project?.riskReasons?.length" style="font-size: 13px; color: #94a3b8;">
                {{ comparison.project.riskReasons[0] }}
              </div>
            </div>

            <!-- Baseline Usage Chart -->
            <NCard size="small" title="Использование Baseline"
              style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 2px;">
                  <span>Факт: {{ fmt(dashboard?.actualHours) }} ч</span>
                  <span>Baseline: {{ fmt(dashboard?.baselineHours) }} ч</span>
                  <span :style="{ color: (dashboard?.usagePercent ?? 0) > 100 ? '#ef4444' : '#22c55e', fontWeight: 600 }">
                    {{ fmtPct(dashboard?.usagePercent) }}
                  </span>
                </div>
                <NProgress
                  type="line"
                  :percentage="baselinePct"
                  :color="(dashboard?.usagePercent ?? 0) > 90 ? '#ef4444' : (dashboard?.usagePercent ?? 0) > 70 ? '#f59e0b' : '#22c55e'"
                  :rail-color="'rgba(255,255,255,0.08)'"
                  :height="12"
                  :border-radius="6"
                  :show-indicator="false"
                />
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
                  <span>0%</span>
                  <span>Отклонение: {{ dashboard?.deviation != null ? (dashboard.deviation > 0 ? '+' : '') + fmt(dashboard.deviation) + ' ч' : '—' }}</span>
                  <span>100%</span>
                </div>
              </div>
            </NCard>

            <!-- Plan / Fact by Direction -->
            <NCard size="small" title="План / Факт по направлениям"
              style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
              <NDataTable
                v-if="sortedDirections.length"
                :columns="directionColumns"
                :data="sortedDirections"
                size="small"
                :bordered="false"
                :pagination="false"
              />
              <NAlert v-else type="info" :show-icon="false" style="font-size: 13px;">
                Нет данных по направлениям
              </NAlert>
            </NCard>

            <!-- Plan / Fact by Role -->
            <NCard size="small" title="План / Факт по ролям"
              style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
              <NDataTable
                v-if="sortedRoles.length"
                :columns="roleColumns"
                :data="sortedRoles"
                size="small"
                :bordered="false"
                :pagination="false"
              />
              <NAlert v-else type="info" :show-icon="false" style="font-size: 13px;">
                Нет данных по ролям
              </NAlert>
            </NCard>

            <!-- Top Risks -->
            <NCard size="small" title="Основные риски"
              style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
              <div v-if="topRisks.length" style="display: flex; flex-direction: column; gap: 8px;">
                <div v-for="risk in topRisks" :key="risk.ref"
                  style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
                  <div style="flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; margin-top: 5px;"
                    :style="{ background: riskColor(risk.level) }" />
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; color: #e2e8f0; font-weight: 500; margin-bottom: 2px;">{{ risk.title }}</div>
                    <div style="font-size: 11px; color: #64748b;">
                      <NTag size="tiny" :type="riskType(risk.level)" :bordered="false" style="margin-right: 6px;">
                        {{ risk.kind === 'epic' ? 'Эпик' : 'Задача оценки' }}
                      </NTag>
                      {{ risk.reasons?.join(' · ') ?? '' }}
                    </div>
                  </div>
                </div>
              </div>
              <NAlert v-else type="success" :show-icon="false" style="font-size: 13px;">
                Критических рисков не обнаружено
              </NAlert>
              <div v-if="(risks?.items?.length ?? 0) > 5" style="margin-top: 10px;">
                <NButton text size="small" style="color: #4f7cff;"
                  @click="router.push(`/control-objects/${id}/data?tab=review`)">
                  Показать все риски →
                </NButton>
              </div>
            </NCard>

            <!-- Deadlines + Review row -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

              <!-- Deadlines -->
              <NCard size="small" title="Контроль сроков"
                style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #94a3b8; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Просроченных задач</span>
                    <span style="color: #ef4444; font-weight: 600;">{{ dashboard?.epicRisk?.red ?? 0 }}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>В зоне внимания</span>
                    <span style="color: #f59e0b; font-weight: 600;">{{ dashboard?.epicRisk?.yellow ?? 0 }}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>В норме</span>
                    <span style="color: #22c55e; font-weight: 600;">{{ dashboard?.epicRisk?.green ?? 0 }}</span>
                  </div>
                </div>
              </NCard>

              <!-- Needs Review -->
              <NCard size="small" title="Требует проверки"
                style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07); cursor: pointer;"
                @click="router.push(`/control-objects/${id}/data?tab=review`)">
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #94a3b8; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>EstimateTask без Epic</span>
                    <span style="font-weight: 600; color: #e2e8f0;">{{ dataQuality?.unlinkedEstimateTasks?.length ?? 0 }}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Epic без EstimateTask</span>
                    <span style="font-weight: 600; color: #e2e8f0;">{{ dataQuality?.unlinkedEpics?.length ?? 0 }}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Задачи с проблемами</span>
                    <span style="font-weight: 600; color: #e2e8f0;">{{ dataQuality?.tasksWithIssues?.length ?? 0 }}</span>
                  </div>
                </div>
                <NButton text size="small" style="color: #4f7cff;">Перейти →</NButton>
              </NCard>
            </div>

          </div><!-- /left -->

          <!-- ── Right column — AI Summary ── -->
          <div style="width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;">
            <NCard size="small"
              style="background: rgba(79,124,255,0.06); border-color: rgba(79,124,255,0.2); position: sticky; top: 0;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 13px; font-weight: 600; color: #e2e8f0;">🤖 AI Summary</span>
                <NButton size="tiny" :loading="aiLoading" @click="generateAi" style="font-size: 11px;">
                  {{ aiAnalysis ? 'Обновить' : 'Сформировать' }}
                </NButton>
              </div>

              <NSpin :show="aiLoading">
                <!-- No analysis yet -->
                <div v-if="!aiLoading && !aiAnalysis"
                  style="text-align: center; padding: 20px 0; color: #64748b; font-size: 13px;">
                  Анализ ещё не сформирован
                </div>

                <!-- Analysis content -->
                <div v-else-if="aiAnalysis">
                  <!-- Summary -->
                  <div style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 14px; white-space: pre-wrap;">
                    {{ aiAnalysis.summary }}
                  </div>

                  <!-- Top deviations -->
                  <div v-if="aiAnalysis.deviations?.length" style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px;">
                      Ключевые отклонения
                    </div>
                    <div v-for="(d, i) in aiAnalysis.deviations.slice(0,3)" :key="i"
                      style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                      <div style="width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;"
                        :style="{ background: riskColor(d.riskLevel ?? 'yellow') }" />
                      <span style="font-size: 12px; color: #cbd5e1;">{{ d.description }}</span>
                    </div>
                  </div>

                  <!-- Questions -->
                  <div v-if="aiAnalysis.questions?.length" style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px;">
                      Вопросы команде
                    </div>
                    <div v-for="(q, i) in aiAnalysis.questions.slice(0,3)" :key="i"
                      style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">
                      {{ i + 1 }}. {{ q.text ?? q }}
                    </div>
                  </div>

                  <!-- Recommendations -->
                  <div v-if="aiAnalysis.recommendations?.length" style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px;">
                      Рекомендации
                    </div>
                    <div v-for="(r, i) in aiAnalysis.recommendations.slice(0,3)" :key="i"
                      style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">
                      · {{ r.description ?? r }}
                    </div>
                  </div>

                  <!-- Generated at -->
                  <div style="font-size: 10px; color: #475569; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: 4px;">
                    {{ aiAnalysis.generatedAt ? new Date(aiAnalysis.generatedAt).toLocaleString('ru') : '' }}
                  </div>
                </div>
              </NSpin>

              <div style="display: flex; gap: 6px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <NButton size="tiny" style="flex: 1; font-size: 11px;" @click="router.push(`/control-objects/${id}/ai`)">
                  Открыть полностью
                </NButton>
              </div>
            </NCard>
          </div><!-- /right -->

        </div><!-- /main -->
      </div>
    </NSpin>
  </div>
</template>
