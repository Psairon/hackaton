export type UserRole = 'admin' | 'manager' | 'pm' | 'teamlead'
export type SprintStatus = 'planned' | 'active' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
export type TaskType = 'frontend' | 'backend' | 'qa' | 'devops' | 'analytics' | 'techwriter' | 'project' | 'other'
export type Department = TaskType

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  adminId: string
  createdAt: string
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  status: SprintStatus
  startDate?: string
  endDate?: string
  createdAt: string
}

export interface Task {
  id: string
  sprintId: string
  parentId?: string
  externalId?: string
  title: string
  description?: string
  type: TaskType
  status: TaskStatus
  assigneeId?: string
  estimatedHours?: number
  actualHours?: number
  children: Task[]
  createdAt: string
}

export interface Estimate {
  id: string
  sprintId: string
  title: string
  totalHours: number
  frontendHours: number
  backendHours: number
  qaHours: number
  devopsHours: number
  analyticsHours: number
  techwriterHours: number
  projectHours: number
  otherHours: number
  createdAt: string
}

export interface EstimateItem {
  id: string
  estimateId: string
  title: string
  estimatedHours: number
  department: Department
  linkedTaskId?: string
  createdAt: string
}

export interface SprintStats {
  tasks: {
    total: number
    done: number
    inProgress: number
    todo: number
    review: number
    blocked: number
    completionPercent: number
  }
  departments: {
    name: Department
    estimatedHours: number
    actualHours: number
  }[]
  estimates: {
    linked: number
    unlinked: number
    total: number
  }
}

export interface AuthTokens {
  accessToken: string
}

export interface ApiError {
  message: string
  statusCode: number
}
