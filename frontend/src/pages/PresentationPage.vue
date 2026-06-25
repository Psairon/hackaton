<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="presentation-page">
    <div class="hero">
      <div class="hero-badge">AI-powered · Hackathon 2026</div>
      <h1 class="hero-title">
        TeamDash
        <span class="gradient-text">Analytics</span>
      </h1>
      <p class="hero-subtitle">
        Дашборд для тимлидов и менеджеров — KPI команды,<br />
        метрики спринтов и AI-анализ в одном месте.
      </p>
      <div class="hero-actions">
        <button class="btn-primary" @click="router.push('/login')">
          <i class="pi pi-sign-in" /> Войти
        </button>
        <button class="btn-outline" @click="router.push('/dashboard')">
          <i class="pi pi-chart-bar" /> Демо дашборд
        </button>
      </div>
    </div>

    <div class="features">
      <div
        v-for="feat in features"
        :key="feat.title"
        class="feature-card"
      >
        <div class="feat-icon">
          <i :class="feat.icon" />
        </div>
        <h3>{{ feat.title }}</h3>
        <p>{{ feat.desc }}</p>
      </div>
    </div>

    <div class="stack-section">
      <h2>Стек технологий</h2>
      <div class="stack-chips">
        <span v-for="tech in stack" :key="tech" class="chip">{{ tech }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const features = [
  {
    icon: 'pi pi-chart-line',
    title: 'KPI в реальном времени',
    desc: 'Velocity, burn-down, cycle time — всё на одном экране без лишних кликов.',
  },
  {
    icon: 'pi pi-users',
    title: 'Метрики команды',
    desc: 'Нагрузка, производительность и тренды по каждому участнику.',
  },
  {
    icon: 'pi pi-sparkles',
    title: 'AI-анализ',
    desc: 'Claude Sonnet разбирает данные и даёт рекомендации менеджеру.',
  },
  {
    icon: 'pi pi-shield',
    title: 'Ролевая модель',
    desc: 'Admin / Manager / Teamlead — каждый видит только то, что нужно.',
  },
]

const stack = [
  'Vue 3', 'TypeScript', 'Pinia', 'PrimeVue',
  'NestJS', 'TypeORM', 'PostgreSQL',
  'Chart.js', 'Claude API', 'Vite',
]
</script>

<style scoped>
.presentation-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 60%, #16213e 100%);
  color: #fff;
  padding: 0 24px;
  font-family: inherit;
}

.hero {
  max-width: 800px;
  margin: 0 auto;
  padding: 100px 0 80px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.hero-badge {
  background: rgba(79,70,229,0.2);
  border: 1px solid rgba(79,70,229,0.5);
  color: #818cf8;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
}

.gradient-text {
  background: linear-gradient(135deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.7;
  margin: 0;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover { background: #4338ca; transform: translateY(-1px); }

.btn-outline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.6); }

.features {
  max-width: 1000px;
  margin: 0 auto 80px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.feature-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 28px 24px;
  transition: background 0.2s, transform 0.2s;
}
.feature-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }

.feat-icon {
  width: 48px;
  height: 48px;
  background: rgba(79,70,229,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.feat-icon .pi { font-size: 1.3rem; color: #818cf8; }

.feature-card h3 { margin: 0 0 8px; font-size: 1rem; font-weight: 600; }
.feature-card p { margin: 0; font-size: 0.875rem; color: rgba(255,255,255,0.6); line-height: 1.6; }

.stack-section {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 80px;
  text-align: center;
}
.stack-section h2 { font-size: 1.2rem; font-weight: 600; margin-bottom: 20px; color: rgba(255,255,255,0.8); }

.stack-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.chip {
  padding: 6px 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 20px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.8);
}
</style>
