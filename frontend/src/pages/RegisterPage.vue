<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NAlert, NText, NGrid, NGridItem } from 'naive-ui'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', password: '', firstName: '', lastName: '' })
const formRef = ref()

const rules = {
  firstName: [{ required: true, message: 'Введите имя', trigger: 'blur' }],
  lastName: [{ required: true, message: 'Введите фамилию', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: 'Некорректный email', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: 'Минимум 6 символов', trigger: 'blur' }],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await auth.register(form.value)
    router.push('/projects')
  } catch { /* ошибки в auth.error */ }
}
</script>

<template>
  <div class="auth-page">
    <NCard class="auth-card" title="Регистрация">
      <NAlert v-if="auth.error" type="error" :title="auth.error" style="margin-bottom: 16px" />

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
          <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="••••••••" />
        </NFormItem>
        <NButton type="primary" block :loading="auth.loading" @click="handleSubmit">
          Создать аккаунт
        </NButton>
      </NForm>

      <div style="margin-top: 16px; text-align: center">
        <NText depth="3">Уже есть аккаунт? </NText>
        <NButton text type="primary" @click="router.push('/login')">Войти</NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 24px;
}
.auth-card { width: 100%; max-width: 440px; }
</style>
