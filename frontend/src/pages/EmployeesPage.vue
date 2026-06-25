<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import {
  NButton, NDataTable, NUpload, NUploadDragger,
  NText, NSpin, NTag, useMessage, NSpace,
  NModal, NForm, NFormItem, NInput, NSelect, NSwitch, NInputGroup,
} from 'naive-ui'
import type { UploadFileInfo, FormInst } from 'naive-ui'
import { employeesApi } from '@/api/employees'

const message = useMessage()
const employees = ref<any[]>([])
const loading = ref(false)
const importing = ref(false)
const search = ref('')

// ─── Modal state ──────────────────────────────────────────────────────────────

const modalVisible = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInst | null>(null)

const emptyForm = () => ({
  fullName: '',
  jiraIdentity: '',
  mail: '',
  direction: null as string | null,
  role: null as string | null,
  active: true,
})

const form = ref(emptyForm())

const rules = {
  fullName: { required: true, message: 'Укажите ФИО', trigger: 'blur' },
  direction: { required: true, message: 'Выберите направление', trigger: 'change' },
  role: { required: true, message: 'Выберите роль', trigger: 'change' },
}

// ─── Options ──────────────────────────────────────────────────────────────────

const directionOptions = [
  { label: 'Бэкенд', value: 'backend' },
  { label: 'Фронтенд', value: 'frontend' },
  { label: 'Аналитика', value: 'analytics' },
  { label: 'Тимлид', value: 'teamlead' },
  { label: 'QA', value: 'qa' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Дизайн', value: 'design' },
  { label: 'Прочее', value: 'other' },
]

const roleOptions = [
  { label: 'Бэкенд-разработчик', value: 'backend_dev' },
  { label: 'Frontend-разработчик', value: 'frontend_dev' },
  { label: 'Аналитик', value: 'analyst' },
  { label: 'Техпис', value: 'techwriter' },
  { label: 'QA', value: 'qa' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Дизайнер', value: 'designer' },
  { label: 'Тимлид', value: 'teamlead' },
  { label: 'Прочее', value: 'other' },
]

// ─── Table ────────────────────────────────────────────────────────────────────

const filteredEmployees = computed(() => {
  if (!search.value.trim()) return employees.value
  const q = search.value.toLowerCase()
  return employees.value.filter(e =>
    e.fullName?.toLowerCase().includes(q) ||
    e.jiraIdentity?.toLowerCase().includes(q) ||
    e.mail?.toLowerCase().includes(q) ||
    e.direction?.toLowerCase().includes(q) ||
    e.role?.toLowerCase().includes(q)
  )
})

const columns = [
  { title: 'ФИО', key: 'fullName', sorter: 'default', ellipsis: true },
  { title: 'Логин (Jira)', key: 'jiraIdentity', width: 140, render: (r: any) => r.jiraIdentity ?? '—' },
  { title: 'Email', key: 'mail', ellipsis: true, render: (r: any) => r.mail ?? '—' },
  {
    title: 'Направление', key: 'direction', width: 130,
    render: (r: any) => h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => r.direction ?? '—' }),
  },
  {
    title: 'Роль', key: 'role', width: 160,
    render: (r: any) => h(NTag, { size: 'small', type: 'success', bordered: false }, { default: () => r.role ?? '—' }),
  },
  {
    title: 'Статус', key: 'active', width: 100,
    render: (r: any) => h(NTag, { size: 'small', type: r.active ? 'success' : 'default', bordered: false }, {
      default: () => r.active ? 'Активен' : 'Неактивен',
    }),
  },
  {
    title: 'Проверка', key: 'needsReview', width: 110,
    render: (r: any) => r.needsReview
      ? h(NTag, { size: 'small', type: 'warning', bordered: false }, { default: () => '⚠ Проверить' })
      : null,
  },
  {
    title: '', key: 'actions', width: 90,
    render: (r: any) => h(NButton, {
      size: 'small', quaternary: true, type: 'primary',
      onClick: () => openEdit(r),
    }, { default: () => 'Изменить' }),
  },
]

// ─── Actions ──────────────────────────────────────────────────────────────────

function openCreate() {
  modalMode.value = 'create'
  editingId.value = null
  form.value = emptyForm()
  modalVisible.value = true
}

function openEdit(employee: any) {
  modalMode.value = 'edit'
  editingId.value = employee.id
  form.value = {
    fullName: employee.fullName ?? '',
    jiraIdentity: employee.jiraIdentity ?? '',
    mail: employee.mail ?? '',
    direction: employee.direction ?? null,
    role: employee.role ?? null,
    active: employee.active ?? true,
  }
  modalVisible.value = true
}

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const payload: any = {
      direction: form.value.direction,
      role: form.value.role,
      active: form.value.active,
    }
    if (form.value.jiraIdentity.trim()) payload.jiraIdentity = form.value.jiraIdentity.trim()
    if (form.value.mail.trim()) payload.mail = form.value.mail.trim()

    if (modalMode.value === 'create') {
      payload.fullName = form.value.fullName.trim()
      await employeesApi.create(payload)
      message.success('Сотрудник создан')
    } else {
      await employeesApi.update(editingId.value!, payload)
      message.success('Изменения сохранены')
    }
    modalVisible.value = false
    await load()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await employeesApi.getAll()
    employees.value = data
  } catch {
    message.error('Не удалось загрузить справочник')
  } finally {
    loading.value = false
  }
}

async function handleImport({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  importing.value = true
  try {
    const { data } = await employeesApi.import(file.file)
    message.success(`Импортировано: ${data.created} новых, обновлено: ${data.updated}`)
    if (data.warnings?.length) {
      data.warnings.forEach((w: string) => message.warning(w))
    }
    await load()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта')
  } finally {
    importing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 20px 28px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div>
          <div style="font-size: 18px; font-weight: 600; color: #e2e8f0;">Справочник сотрудников</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
            Импорт из ADUsers.xlsx · Матчинг исполнителей Jira
            <span v-if="employees.length" style="margin-left: 8px; color: #94a3b8;">
              {{ employees.length }} записей
            </span>
          </div>
        </div>

        <NSpace>
          <NInput
            v-model:value="search"
            placeholder="Поиск..."
            size="medium"
            clearable
            style="width: 220px;"
          />
          <NButton type="default" size="medium" @click="openCreate">
            + Добавить
          </NButton>
          <NUpload
            accept=".xlsx,.xls,.csv"
            :max="1"
            :show-file-list="false"
            :custom-request="({ file }) => handleImport({ file })"
          >
            <NButton type="primary" :loading="importing" size="medium">
              📂 Импорт ADUsers.xlsx
            </NButton>
          </NUpload>
        </NSpace>
      </div>
    </div>

    <!-- Drop zone (when empty) -->
    <div v-if="!loading && employees.length === 0" style="padding: 28px; flex-shrink: 0;">
      <NUpload
        accept=".xlsx,.xls,.csv"
        :max="1"
        :show-file-list="false"
        :custom-request="({ file }) => handleImport({ file })"
      >
        <NUploadDragger style="border-radius: 10px;">
          <div style="padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 40px;">📂</span>
            <NText style="font-size: 15px; color: #cbd5e1; font-weight: 500;">
              Перетащите ADUsers.xlsx сюда
            </NText>
            <NText depth="3" style="font-size: 12px;">
              Поддерживаются .xlsx, .xls, .csv
            </NText>
          </div>
        </NUploadDragger>
      </NUpload>
    </div>

    <!-- Table -->
    <div style="flex: 1; overflow: hidden; padding: 0 28px 28px;">
      <NSpin :show="loading" style="height: 100%;">
        <NDataTable
          v-if="employees.length > 0"
          :columns="columns"
          :data="filteredEmployees"
          :pagination="{ pageSize: 25 }"
          :max-height="'calc(100vh - 140px)'"
          size="small"
          striped
          virtual-scroll
        />
      </NSpin>
    </div>

    <!-- Modal: create / edit -->
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="modalMode === 'create' ? 'Новый сотрудник' : 'Редактировать сотрудника'"
      style="width: 480px;"
      :mask-closable="false"
    >
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" label-width="auto">

        <NFormItem label="ФИО" path="fullName">
          <NInput
            v-model:value="form.fullName"
            placeholder="Иванов Иван Иванович"
            :disabled="modalMode === 'edit'"
          />
        </NFormItem>

        <NFormItem label="Логин (Jira / sAMAccountName)" path="jiraIdentity">
          <NInput v-model:value="form.jiraIdentity" placeholder="ivanov_i" />
        </NFormItem>

        <NFormItem label="Email" path="mail">
          <NInput v-model:value="form.mail" placeholder="ivanov@company.ru" />
        </NFormItem>

        <NFormItem label="Направление" path="direction">
          <NSelect
            v-model:value="form.direction"
            :options="directionOptions"
            placeholder="Выберите направление"
          />
        </NFormItem>

        <NFormItem label="Роль" path="role">
          <NSelect
            v-model:value="form.role"
            :options="roleOptions"
            placeholder="Выберите роль"
          />
        </NFormItem>

        <NFormItem label="Активен">
          <NSwitch v-model:value="form.active" />
        </NFormItem>

      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="modalVisible = false">Отмена</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">
            {{ modalMode === 'create' ? 'Создать' : 'Сохранить' }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>
