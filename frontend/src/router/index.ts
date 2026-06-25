import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },

    { path: '/login', name: 'Login', component: () => import('@/pages/LoginPage.vue'), meta: { guest: true } },
    { path: '/register', name: 'Register', component: () => import('@/pages/RegisterPage.vue'), meta: { guest: true } },

    { path: '/employees', name: 'Employees', component: () => import('@/pages/EmployeesPage.vue'), meta: { auth: true } },
    { path: '/projects', name: 'Projects', component: () => import('@/pages/ProjectsPage.vue'), meta: { auth: true } },
    { path: '/projects/new', name: 'ProjectNew', component: () => import('@/pages/ProjectDetailPage.vue'), meta: { auth: true } },
    {
      path: '/projects/:id',
      name: 'ProjectDetail',
      component: () => import('@/pages/ProjectDetailPage.vue'),
      meta: { auth: true },
    },
    {
      path: '/projects/:id/sprints/:sprintId',
      component: () => import('@/pages/SprintDetailPage.vue'),
      meta: { auth: true },
      children: [
        { path: '', redirect: 'tasks' },
        { path: 'tasks', name: 'Tasks', component: () => import('@/pages/TasksPage.vue') },
        { path: 'kanban', name: 'Kanban', component: () => import('@/pages/KanbanPage.vue') },
        { path: 'estimates', name: 'Estimates', component: () => import('@/pages/EstimatesPage.vue') },
        { path: 'estimates/:estimateId', name: 'EstimateDetail', component: () => import('@/pages/EstimateDetailPage.vue') },
        { path: 'stats', name: 'Stats', component: () => import('@/pages/StatsPage.vue') },
        { path: 'ai', name: 'AI', component: () => import('@/pages/AiPage.vue') },
      ],
    },

    { path: '/control-objects/:id', name: 'ControlObject', component: () => import('@/pages/ControlObjectPage.vue'), meta: { auth: true } },
    { path: '/control-objects/:id/ai', name: 'AiAnalysis', component: () => import('@/pages/AiAnalysisPage.vue'), meta: { auth: true } },
    { path: '/control-objects/:id/data', name: 'DataSection', component: () => import('@/pages/DataPage.vue'), meta: { auth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/projects' },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken')
  if (to.meta.auth && !token) return { name: 'Login', query: { redirect: to.fullPath } }
  if (to.meta.guest && token) return { name: 'Projects' }
})

export default router
