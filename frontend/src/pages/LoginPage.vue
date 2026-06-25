<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NAlert, NText } from 'naive-ui'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const formRef = ref()

const rules = {
  email: [{ required: true, message: 'Введите email', trigger: 'blur' }, { type: 'email', message: 'Некорректный email', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: 'Минимум 6 символов', trigger: 'blur' }],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/projects'
    router.push(redirect)
  } catch { /* ошибки в auth.error */ }
}
</script>

<template>
  <div class="auth-page">
    <NCard class="auth-card" title="Вход в систему">
      <template #header-extra>
        <NText depth="3" style="font-size: 0.85rem">TeamDash Analytics</NText>
      </template>

      <NAlert v-if="auth.error" type="error" :title="auth.error" style="margin-bottom: 16px" />

      <NForm ref="formRef" :model="{ email, password }" :rules="rules" label-placement="top">
        <NFormItem label="Email" path="email">
          <NInput v-model:value="email" type="text" placeholder="you@company.com" />
        </NFormItem>
        <NFormItem label="Пароль" path="password">
          <NInput v-model:value="password" type="password" placeholder="••••••••" show-password-on="click" />
        </NFormItem>
        <NButton type="primary" block :loading="auth.loading" @click="handleSubmit">
          Войти
        </NButton>
      </NForm>

      <div style="margin-top: 16px; text-align: center">
        <NText depth="3">Нет аккаунта? </NText>
        <NButton text type="primary" @click="router.push('/register')">Зарегистрироваться</NButton>
      </div>

      <div style="margin-top: 12px; text-align: center">
        <NText depth="3" style="font-size: 0.75rem">Демо: admin@team.ru / любой пароль</NText>
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
.auth-card { width: 100%; max-width: 420px; }
</style>
