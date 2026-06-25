<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NButton, NAlert, NGrid, NGridItem, NSelect } from 'naive-ui'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', password: '', firstName: '', lastName: '', role: 'manager' })
const formRef = ref()

const roleOptions = [
  { label: 'Менеджер', value: 'manager' },
  { label: 'Тимлид', value: 'teamlead' },
  { label: 'PM', value: 'pm' },
  { label: 'Администратор', value: 'admin' },
]

const rules = {
  firstName: [{ required: true, message: 'Введите имя', trigger: 'blur' }],
  lastName: [{ required: true, message: 'Введите фамилию', trigger: 'blur' }],
  email: [{ required: true, type: 'email' as const, message: 'Некорректный email', trigger: 'blur' }],
  password: [{ required: true, min: 8, message: 'Минимум 8 символов', trigger: 'blur' }],
  role: [{ required: true, message: 'Выберите роль', trigger: 'change' }],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await auth.register(form.value)
    router.push('/projects')
  } catch { /* error в auth.error */ }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6" style="background: #0c111c">
    <div class="w-full max-w-sm">

      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center rounded-xl mb-3"
             style="width:44px;height:44px;background:#4f7cff">
          <span class="text-white font-bold text-sm">TD</span>
        </div>
        <h1 class="text-xl font-semibold text-slate-200">Создать аккаунт</h1>
      </div>

      <div class="rounded-xl border border-edge bg-panel/50 p-6">
        <NAlert v-if="auth.error" type="error" :title="String(auth.error)" class="mb-4" />

        <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
          <NGrid :cols="2" :x-gap="12">
            <NGridItem>
              <NFormItem label="Имя" path="firstName">
                <NInput v-model:value="form.firstName" placeholder="Иван" />
              </NFormItem>
            </NGridItem>
            <NGridItem>
              <NFormItem label="Фамилия" path="lastName">
                <NInput v-model:value="form.lastName" placeholder="Петров" />
              </NFormItem>
            </NGridItem>
          </NGrid>
          <NFormItem label="Email" path="email">
            <NInput v-model:value="form.email" placeholder="you@company.com" />
          </NFormItem>
          <NFormItem label="Пароль" path="password">
            <NInput v-model:value="form.password" type="password"
                    show-password-on="click" placeholder="Минимум 8 символов" />
          </NFormItem>
          <NFormItem label="Роль" path="role">
            <NSelect v-model:value="form.role" :options="roleOptions" />
          </NFormItem>
          <NButton type="primary" block :loading="auth.loading" @click="handleSubmit">
            Создать аккаунт
          </NButton>
        </NForm>

        <div class="mt-4 text-center">
          <span class="text-xs text-slate-500">Уже есть аккаунт? </span>
          <NButton text size="tiny" @click="router.push('/login')"
                   style="color:#4f7cff; font-size:12px">
            Войти
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>
