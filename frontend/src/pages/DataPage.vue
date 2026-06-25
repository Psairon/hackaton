<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NTabs, NTabPane, NButton, NDataTable, NUpload, NUploadDragger,
  NText, NSpin, NAlert, NTag, NSpace, NCard, NGrid, NGridItem,
  useMessage, NInput, NSelect, NModal, NForm, NFormItem, NSwitch,
} from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'
import { employeesApi } from '@/api/employees'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const id = route.params.id as string

// active tab from query param
const activeTab = ref((route.query.tab as string) || 'baseline')

const obj = ref<any>(null)

// ── Baseline ──────────────────────────────────────────────────────────────────
const baseline = ref<any>(null)
const estimateTasks = ref<any[]>([])
const baselineLoading = ref(false)
const baselineImporting = ref(false)

async function loadBaseline() {
  baselineLoading.value = true
  try {
    const [b, et] = await Promise.allSettled([
      controlObjectsApi.getBaseline(id),
      controlObjectsApi.getEstimateTasks(id),
    ])
    if (b.status === 'fulfilled') baseline.value = b.value.data
    if (et.status === 'fulfilled') estimateTasks.value = et.value.data
  } finally {
    baselineLoading.value = false }
}

async function importBaseline({ file }: any) {
  if (!file.file) return
  baselineImporting.value = true
  try {
    const { data } = await controlObjectsApi.importBaseline(id, file.file)
    message.success(`Baseline загружен: ${data.estimateTasksCount ?? 0} задач`)
    await loadBaseline()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта baseline')
  } finally { baselineImporting.value = false }
}

const etColumns = [
  { title: '#', key: 'rowNumber', width: 60 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Описание', key: 'description', ellipsis: true },
  { title: 'Plan (ч)', key: 'totalHours', width: 100, render: (r: any) => r.totalHours ?? '—' },
  {
    title: 'Связка с Epic', key: 'linkedEpic', width: 120,
    render: (r: any) => r.linkedEpicCount > 0
      ? h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => '✓ Связан' })
      : h(NTag, { type: 'default', size: 'small', bordered: false }, { default: () => 'Нет связи' }),
  },
]

// ── Jira ──────────────────────────────────────────────────────────────────────
const epics = ref<any[]>([])
const tasks = ref<any[]>([])
const jiraLoading = ref(false)
const jiraImporting = ref(false)
const structureFile = ref<File | null>(null)
const worklogFile = ref<File | null>(null)

async function loadJira() {
  jiraLoading.value = true
  try {
    const [e, t] = await Promise.allSettled([
      controlObjectsApi.getEpics(id),
      controlObjectsApi.getTasks(id),
    ])
    if (e.status === 'fulfilled') epics.value = e.value.data
    if (t.status === 'fulfilled') tasks.value = t.value.data
  } finally { jiraLoading.value = false }
}

async function importJira() {
  if (!structureFile.value || !worklogFile.value) {
    message.warning('Выберите оба файла')
    return
  }
  jiraImporting.value = true
  try {
    await controlObjectsApi.importJira(id, structureFile.value, worklogFile.value, '')
    message.success('Jira-выгрузка импортирована')
    await loadJira()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта Jira')
  } finally { jiraImporting.value = false }
}

async function autoLink() {
  try {
    const { data } = await controlObjectsApi.autoLink(id)
    message.success(`Авто-связка: ${data.linked ?? 0} эпиков`)
    await Promise.all([loadBaseline(), loadJira()])
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка авто-связки')
  }
}

function riskType(level: string): 'error' | 'warning' | 'success' | 'default' {
  if (level === 'red') return 'error'
  if (level === 'yellow') return 'warning'
  if (level === 'green') return 'success'
  return 'default'
}

const epicColumns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Статус', key: 'status', width: 110 },
  {
    title: 'EstimateTask', key: 'estimateTaskId', width: 120,
    render: (r: any) => r.estimateTaskId
      ? h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => '✓ Связан' })
      : h(NTag, { type: 'default', size: 'small', bordered: false }, { default: () => 'Нет' }),
  },
  { title: 'Факт (ч)', key: 'actualHours', width: 90, render: (r: any) => r.actualHours ?? '—' },
  { title: 'Due Date', key: 'dueDate', width: 110 },
  { title: 'Приоритет', key: 'priority', width: 100 },
  { title: 'Задач', key: 'taskCount', width: 70 },
]

const taskColumns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Тип', key: 'type', width: 90 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Epic', key: 'epicId', width: 120, render: (r: any) => r.epicId ?? '—' },
  { title: 'Исполнитель', key: 'assigneeRaw', width: 140 },
  { title: 'Роль', key: 'role', width: 100 },
  { title: 'Направление', key: 'direction', width: 110 },
  { title: 'Статус', key: 'status', width: 110 },
  { title: 'Факт (ч)', key: 'actualHours', width: 90, render: (r: any) => r.actualHours ?? '—' },
  { title: 'Оценка (ч)', key: 'currentEstimateHours', width: 100, render: (r: any) => r.currentEstimateHours ?? '—' },
  { title: 'Due Date', key: 'dueDate', width: 110 },
  {
    title: 'Проблемы', key: 'flags', width: 90,
    render: (r: any) => (r.dataQualityFlags ?? []).length
      ? h(NTag, { type: 'warning', size: 'small', bordered: false }, { default: () => `⚠ ${r.dataQualityFlags.length}` })
      : null,
  },
]

// ── Employees ─────────────────────────────────────────────────────────────────
const employees = ref<any[]>([])
const empLoading = ref(false)
const empImporting = ref(false)
const empSearch = ref('')

async function loadEmployees() {
  empLoading.value = true
  try {
    const { data } = await employeesApi.getAll()
    employees.value = data
  } catch { } finally { empLoading.value = false }
}

async function importEmployees({ file }: any) {
  if (!file.file) return
  empImporting.value = true
  try {
    const { data } = await employeesApi.import(file.file)
    message.success(`Импортировано: ${data.created} новых, обновлено: ${data.updated}`)
    await loadEmployees()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта')
  } finally { empImporting.value = false }
}

// Редактирование сотрудника
const editModal = ref(false)
const editTarget = ref<any>(null)
const editForm = ref({ direction: '', role: '', active: true })
const editSaving = ref(false)

const directionOptions = [
  { label: 'Бэкенд', value: 'backend' },
  { label: 'Фронтенд', value: 'frontend' },
  { label: 'Аналитика', value: 'analytics' },
  { label: 'Тимлид', value: 'teamlead' },
  { label: 'QA', value: 'qa' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Дизайнер', value: 'design' },
  { label: 'Прочее', value: 'other' },
]

const roleOptions = [
  { label: 'Бэкенд-разработчик', value: 'backend_dev' },
  { label: 'Фронтенд-разработчик', value: 'frontend_dev' },
  { label: 'Аналитик', value: 'analyst' },
  { label: 'Техписатель', value: 'techwriter' },
  { label: 'QA', value: 'qa' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Дизайнер', value: 'designer' },
  { label: 'Тимлид', value: 'teamlead' },
  { label: 'Прочее', value: 'other' },
]

function openEdit(emp: any) {
  editTarget.value = emp
  editForm.value = { direction: emp.direction ?? '', role: emp.role ?? '', active: emp.active ?? true }
  editModal.value = true
}

async function saveEdit() {
  if (!editTarget.value) return
  editSaving.value = true
  try {
    await employeesApi.update(editTarget.value.id, editForm.value)
    message.success('Сотрудник обновлён')
    editModal.value = false
    await loadEmployees()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка сохранения')
  } finally { editSaving.value = false }
}

const filteredEmployees = computed(() => {
  if (!empSearch.value) return employees.value
  const s = empSearch.value.toLowerCase()
  return employees.value.filter(e =>
    e.fullName?.toLowerCase().includes(s) ||
    e.jiraIdentity?.toLowerCase().includes(s) ||
    e.mail?.toLowerCase().includes(s)
  )
})

const empColumns = [
  { title: 'ФИО', key: 'fullName', sorter: 'default' },
  { title: 'Jira логин', key: 'jiraIdentity', render: (r: any) => r.jiraIdentity ?? '—' },
  { title: 'Направление', key: 'direction', render: (r: any) => h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => r.direction ?? '—' }) },
  { title: 'Роль', key: 'role', render: (r: any) => h(NTag, { size: 'small', type: 'success', bordered: false }, { default: () => r.role ?? '—' }) },
  {
    title: 'Статус', key: 'active', width: 90,
    render: (r: any) => h(NTag, { size: 'small', type: r.active ? 'success' : 'default', bordered: false }, { default: () => r.active ? 'Активен' : 'Неакт.' }),
  },
  {
    title: 'Проверка', key: 'needsReview', width: 90,
    render: (r: any) => r.needsReview ? h(NTag, { size: 'small', type: 'warning', bordered: false }, { default: () => '⚠' }) : null,
  },
  {
    title: '', key: 'actions', width: 80,
    render: (r: any) => h(NButton, { size: 'tiny', onClick: () => openEdit(r) }, { default: () => 'Изменить' }),
  },
]

// ── Links ─────────────────────────────────────────────────────────────────────
// selectedEpic[etId] = epicId выбранный в селекте для этой строки
const selectedEpic = ref<Record<string, string>>({})
const linkingId = ref<string | null>(null)
const unlinkingKey = ref<string | null>(null) // `${etId}:${epicId}`

const linksData = computed(() => {
  return estimateTasks.value.map(et => {
    const linkedEpics = epics.value.filter(e => e.estimateTaskId === et.id)
    return { ...et, linkedEpics, linkedEpicCount: linkedEpics.length }
  })
})

// Эпики без связи — доступны для выбора в селекте
const freeEpicsOptions = computed(() =>
  epics.value
    .filter(e => !e.estimateTaskId)
    .map(e => ({ label: `${e.jiraKey}: ${e.title ?? ''}`, value: e.id }))
)

async function manualLink(etId: string) {
  const epicId = selectedEpic.value[etId]
  if (!epicId) { message.warning('Выберите Epic'); return }
  linkingId.value = etId
  try {
    await controlObjectsApi.linkEpic(etId, epicId)
    message.success('Связка установлена')
    selectedEpic.value[etId] = ''
    await Promise.all([loadBaseline(), loadJira()])
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка привязки')
  } finally { linkingId.value = null }
}

async function manualUnlink(etId: string, epicId: string) {
  unlinkingKey.value = `${etId}:${epicId}`
  try {
    await controlObjectsApi.unlinkEpic(etId, epicId)
    message.success('Связка удалена')
    await Promise.all([loadBaseline(), loadJira()])
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка удаления связки')
  } finally { unlinkingKey.value = null }
}

// ── Review ────────────────────────────────────────────────────────────────────
const dataQuality = ref<any>(null)
const dqLoading = ref(false)

async function loadDataQuality() {
  dqLoading.value = true
  try {
    const { data } = await controlObjectsApi.getDataQuality(id)
    dataQuality.value = data
  } catch { } finally { dqLoading.value = false }
}

const reviewItems = computed(() => {
  if (!dataQuality.value) return []
  const items: any[] = []
  ;(dataQuality.value.unlinkedEstimateTasks ?? []).forEach((e: any) => {
    items.push({ category: 'EstimateTask без Epic', type: 'EstimateTask', id: e.id, title: e.title, reason: 'Не связан с Jira Epic', action: 'baseline' })
  })
  ;(dataQuality.value.unlinkedEpics ?? []).forEach((e: any) => {
    items.push({ category: 'Epic без EstimateTask', type: 'JiraEpic', id: e.jiraKey, title: e.title, reason: 'Не связан с EstimateTask', action: 'links' })
  })
  ;(dataQuality.value.tasksWithIssues ?? []).forEach((t: any) => {
    items.push({ category: 'Задачи с проблемами', type: 'JiraTask', id: t.jiraKey, title: t.title, reason: (t.flags ?? []).join(', '), action: 'jira' })
  })
  return items
})

const reviewColumns = [
  { title: 'Категория', key: 'category', width: 200 },
  { title: 'Тип', key: 'type', width: 120 },
  { title: 'ID', key: 'id', width: 130 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Причина', key: 'reason', ellipsis: true },
  {
    title: 'Действие', key: 'action', width: 110,
    render: (r: any) => h(NButton, { size: 'tiny', onClick: () => { activeTab.value = r.action } }, { default: () => 'Перейти →' }),
  },
]

// ── init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const [objRes] = await Promise.allSettled([controlObjectsApi.getById(id)])
  if (objRes.status === 'fulfilled') obj.value = objRes.value.data
  await Promise.all([loadBaseline(), loadJira(), loadEmployees(), loadDataQuality()])
})
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #e2e8f0;">
          📂 Данные · {{ obj?.name ?? '...' }}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px; display: flex; gap: 16px;">
          <span v-if="baseline">Baseline: {{ new Date(baseline.importedAt ?? baseline.createdAt).toLocaleDateString('ru') }}</span>
          <span v-if="epics.length">Jira: {{ epics.length }} эпиков</span>
          <span v-if="reviewItems.length" style="color: #f59e0b;">⚠ {{ reviewItems.length }} требует проверки</span>
        </div>
      </div>
      <NButton size="small" @click="router.push(`/control-objects/${id}`)">
        ← Dashboard
      </NButton>
    </div>

    <!-- Tabs -->
    <NTabs v-model:value="activeTab" type="line" animated
      style="flex: 1; overflow: hidden; padding: 0 28px;"
      pane-style="overflow-y: auto; height: calc(100vh - 110px); padding: 16px 0;">

      <!-- ── Baseline ── -->
      <NTabPane name="baseline" tab="📋 Baseline">
        <NSpin :show="baselineLoading">
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
            <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
              :custom-request="({ file, onFinish }) => { importBaseline({ file }); onFinish() }">
              <NButton type="primary" :loading="baselineImporting" size="medium">
                📂 {{ baseline ? 'Загрузить повторно' : 'Загрузить baseline' }}
              </NButton>
            </NUpload>
            <div v-if="baseline" style="font-size: 13px; color: #94a3b8;">
              <b style="color: #e2e8f0;">{{ baseline.sourceFileName }}</b> ·
              {{ baseline.totalHours ?? 0 }} ч ·
              {{ estimateTasks.length }} задач
            </div>
          </div>

          <div v-if="!baseline && !baselineLoading">
            <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
              :custom-request="({ file, onFinish }) => { importBaseline({ file }); onFinish() }">
              <NUploadDragger style="border-radius: 10px; margin-bottom: 16px;">
                <div style="padding: 32px; text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
                  <NText style="font-size: 14px; color: #cbd5e1;">Перетащите файл baseline сюда</NText>
                  <br />
                  <NText depth="3" style="font-size: 12px;">.xlsx, .xls, .csv</NText>
                </div>
              </NUploadDragger>
            </NUpload>
          </div>

          <!-- Summary cards -->
          <NGrid v-if="baseline" :cols="4" :x-gap="12" style="margin-bottom: 16px;">
            <NGridItem>
              <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Всего задач</div>
                <div style="font-size: 20px; font-weight: 700; color: #e2e8f0;">{{ estimateTasks.length }}</div>
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Плановых часов</div>
                <div style="font-size: 20px; font-weight: 700; color: #e2e8f0;">{{ baseline.totalHours ?? 0 }}</div>
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Связаны с Epic</div>
                <div style="font-size: 20px; font-weight: 700; color: #22c55e;">
                  {{ estimateTasks.filter(e => e.linkedEpicCount > 0).length }}
                </div>
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Без связи</div>
                <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">
                  {{ estimateTasks.filter(e => !e.linkedEpicCount).length }}
                </div>
              </NCard>
            </NGridItem>
          </NGrid>

          <NDataTable v-if="estimateTasks.length" :columns="etColumns" :data="estimateTasks"
            size="small" :pagination="{ pageSize: 20 }" />
        </NSpin>
      </NTabPane>

      <!-- ── Jira ── -->
      <NTabPane name="jira" tab="🔗 Jira">
        <NSpin :show="jiraLoading">
          <NCard size="small" style="margin-bottom: 16px; background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 12px;">Импорт Jira-выгрузки</div>
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px;">
              <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
                :custom-request="({ file, onFinish }) => { structureFile = file.file ?? null; onFinish() }">
                <NButton size="small" :type="structureFile ? 'success' : 'default'">
                  {{ structureFile ? '✓ ' + structureFile.name : '📂 Файл структуры' }}
                </NButton>
              </NUpload>
              <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
                :custom-request="({ file, onFinish }) => { worklogFile = file.file ?? null; onFinish() }">
                <NButton size="small" :type="worklogFile ? 'success' : 'default'">
                  {{ worklogFile ? '✓ ' + worklogFile.name : '📂 Файл трудозатрат' }}
                </NButton>
              </NUpload>
              <NButton type="primary" :loading="jiraImporting" size="small" @click="importJira">
                Импортировать
              </NButton>
            </div>

            <!-- Summary -->
            <div v-if="epics.length || tasks.length" style="display: flex; gap: 16px; font-size: 12px; color: #94a3b8;">
              <span>Эпиков: <b style="color: #e2e8f0;">{{ epics.length }}</b></span>
              <span>Задач: <b style="color: #e2e8f0;">{{ tasks.length }}</b></span>
              <span style="color: #22c55e;">Связаных эпиков: <b>{{ epics.filter(e => e.estimateTaskId).length }}</b></span>
              <span style="color: #f59e0b;">Без связи: <b>{{ epics.filter(e => !e.estimateTaskId).length }}</b></span>
            </div>
          </NCard>

          <div v-if="!epics.length && !jiraLoading">
            <NAlert type="info" style="margin-bottom: 16px;">
              Загрузите файлы Jira-выгрузки (структура + трудозатраты)
            </NAlert>
          </div>

          <div v-if="epics.length">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; color: #e2e8f0; font-size: 13px;">Эпики ({{ epics.length }})</span>
              <NButton size="small" @click="autoLink">⚡ Авто-связка по ключу</NButton>
            </div>
            <NDataTable :columns="epicColumns" :data="epics" size="small"
              :pagination="{ pageSize: 10 }" style="margin-bottom: 20px;" />
          </div>

          <div v-if="tasks.length">
            <div style="font-weight: 600; color: #e2e8f0; font-size: 13px; margin-bottom: 8px;">
              Задачи ({{ tasks.length }})
            </div>
            <NDataTable :columns="taskColumns" :data="tasks" size="small"
              :pagination="{ pageSize: 15 }" :max-height="400" virtual-scroll />
          </div>
        </NSpin>
      </NTabPane>

      <!-- ── Employees ── -->
      <NTabPane name="employees" tab="👥 Сотрудники">
        <NSpin :show="empLoading">
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
            <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
              :custom-request="({ file, onFinish }) => { importEmployees({ file }); onFinish() }">
              <NButton type="primary" :loading="empImporting" size="medium">
                📂 Импорт ADUsers.xlsx
              </NButton>
            </NUpload>
            <NInput v-model:value="empSearch" placeholder="Поиск по имени, логину, email"
              size="small" style="width: 260px;" clearable />
            <span v-if="employees.length" style="font-size: 12px; color: #64748b;">
              {{ filteredEmployees.length }} / {{ employees.length }} записей
            </span>
          </div>

          <div v-if="!employees.length && !empLoading">
            <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
              :custom-request="({ file, onFinish }) => { importEmployees({ file }); onFinish() }">
              <NUploadDragger style="border-radius: 10px; margin-bottom: 16px;">
                <div style="padding: 32px; text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
                  <NText style="font-size: 14px; color: #cbd5e1;">Перетащите ADUsers.xlsx сюда</NText>
                </div>
              </NUploadDragger>
            </NUpload>
          </div>

          <NDataTable v-if="filteredEmployees.length" :columns="empColumns" :data="filteredEmployees"
            size="small" :pagination="{ pageSize: 20 }" striped />
        </NSpin>
      </NTabPane>

      <!-- ── Links ── -->
      <NTabPane name="links" tab="🔗 Связки">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 13px; color: #94a3b8;">
            Связано: {{ estimateTasks.filter(e => e.linkedEpicCount > 0).length }} /
            {{ estimateTasks.length }} EstimateTask
          </div>
          <NButton size="small" type="primary" @click="autoLink">⚡ Авто-связка</NButton>
        </div>

        <NAlert v-if="!estimateTasks.length" type="info" style="margin-bottom: 16px;">
          Сначала загрузите Baseline и Jira
        </NAlert>

        <NAlert v-if="!estimateTasks.length" type="info" style="margin-bottom: 16px;">
          Сначала загрузите Baseline и Jira
        </NAlert>

        <!-- Карточки EstimateTask с привязкой -->
        <div v-for="et in linksData" :key="et.id"
          style="margin-bottom: 10px; padding: 14px 16px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);">

          <!-- Заголовок строки -->
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ et.title }}
              </div>
              <div style="font-size: 12px; color: #64748b;">
                Plan: {{ et.totalHours ?? '—' }} ч
              </div>
            </div>
            <NTag
              :type="et.linkedEpicCount > 0 ? 'success' : 'error'"
              size="small"
              :bordered="false"
              style="flex-shrink: 0;"
            >
              {{ et.linkedEpicCount > 0 ? `✓ ${et.linkedEpicCount} Epic` : 'Не связан' }}
            </NTag>
          </div>

          <!-- Привязанные эпики -->
          <div v-if="et.linkedEpics.length" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
            <div v-for="epic in et.linkedEpics" :key="epic.id"
              style="display: flex; align-items: center; gap: 6px; padding: 3px 8px 3px 10px; border-radius: 6px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);">
              <span style="font-size: 12px; color: #22c55e; font-weight: 500;">{{ epic.jiraKey }}</span>
              <span style="font-size: 12px; color: #94a3b8; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ epic.title }}</span>
              <NTag size="tiny" :bordered="false" style="background: rgba(255,255,255,0.05); font-size: 10px; color: #475569;">
                {{ epic.linkSource === 'auto' ? 'авто' : 'вручную' }}
              </NTag>
              <NButton
                size="tiny"
                quaternary
                :loading="unlinkingKey === `${et.id}:${epic.id}`"
                style="color: #ef4444; padding: 0 4px; min-width: 0;"
                @click="manualUnlink(et.id, epic.id)"
              >✕</NButton>
            </div>
          </div>

          <!-- Форма добавления связки -->
          <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center;">
            <NSelect
              v-model:value="selectedEpic[et.id]"
              :options="freeEpicsOptions"
              placeholder="Выберите Jira Epic для привязки"
              size="small"
              clearable
              filterable
              style="flex: 1;"
            />
            <NButton
              size="small"
              type="primary"
              :disabled="!selectedEpic[et.id]"
              :loading="linkingId === et.id"
              @click="manualLink(et.id)"
            >
              Связать
            </NButton>
          </div>
        </div>
      </NTabPane>

      <!-- ── Review ── -->
      <NTabPane name="review" tab="⚠ Требует проверки">
        <NSpin :show="dqLoading">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span style="font-size: 13px; color: #94a3b8;">
              Всего проблем: <b style="color: #f59e0b;">{{ reviewItems.length }}</b>
            </span>
            <NButton size="small" @click="loadDataQuality">🔄 Обновить</NButton>
          </div>

          <NAlert v-if="!reviewItems.length && !dqLoading" type="success" style="border-radius: 10px;">
            Нет элементов, требующих проверки
          </NAlert>

          <NDataTable v-if="reviewItems.length" :columns="reviewColumns" :data="reviewItems"
            size="small" :pagination="{ pageSize: 20 }" />
        </NSpin>
      </NTabPane>

    </NTabs>

    <!-- Edit Employee Modal -->
    <NModal v-model:show="editModal" preset="card" title="Редактировать сотрудника" style="max-width: 420px;">
      <NForm v-if="editTarget" label-placement="top">
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">{{ editTarget.fullName }}</div>
        <NFormItem label="Направление">
          <NSelect v-model:value="editForm.direction" :options="directionOptions" />
        </NFormItem>
        <NFormItem label="Роль">
          <NSelect v-model:value="editForm.role" :options="roleOptions" />
        </NFormItem>
        <NFormItem label="Активен">
          <NSwitch v-model:value="editForm.active" />
        </NFormItem>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
          <NButton size="small" @click="editModal = false">Отмена</NButton>
          <NButton size="small" type="primary" :loading="editSaving" @click="saveEdit">Сохранить</NButton>
        </div>
      </NForm>
    </NModal>
  </div>
</template>
