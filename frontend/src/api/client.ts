import type { Task, TaskCategory } from '../types'

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'taskflow_token'

export interface User {
  id: number
  username: string
  role: 'admin' | 'junior'
}


interface ApiTask {
  id: number
  title: string
  category: TaskCategory
  completed: boolean
  status?: 'Pending' | 'In Progress' | 'Completed'
  priority?: 'Low' | 'Medium' | 'High'
  due_date: string | null
  assigned_to: number
  assigned_by: number
  assigned_username?: string | null
}



function toTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    completed: task.completed,
    status: task.status ?? (task.completed ? 'Completed' : 'Pending'),
    priority: task.priority ?? 'Medium',
    dueDate: task.due_date ?? '',
    assignedTo: task.assigned_to,
    assignedBy: task.assigned_by,
    assignedUsername: task.assigned_username ?? null,
  }
}


export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.detail ?? `API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function login(
  username: string,
  password: string,
): Promise<{ access_token: string; user: User }> {
  const result = await request<{
    access_token: string
    user: User
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

  saveToken(result.access_token)
  return result
}

export async function getCurrentUser(): Promise<User> {
  return request<User>('/auth/me')
}

export async function getJuniors(): Promise<User[]> {
  return request<User[]>('/users/juniors')
}

export async function createJunior(
  username: string,
  password: string,
): Promise<User> {
  return request<User>('/users/juniors', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function getTasks(): Promise<Task[]> {
  const tasks = await request<ApiTask[]>('/tasks')
  return tasks.map(toTask)
}

export async function createTask(
  title: string,
  category: TaskCategory,
  dueDate: string,
  assignedTo: number,
  priority: 'Low' | 'Medium' | 'High' = 'Medium',
): Promise<Task> {
  const task = await request<ApiTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title,
      category,
      due_date: dueDate,
      assigned_to: assignedTo,
      priority,
    }),
  })

  return toTask(task)
}


export async function updateTask(
  id: number,
  status: 'Pending' | 'In Progress' | 'Completed',
): Promise<Task> {
  const task = await request<ApiTask>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

  return toTask(task)
}


export async function editTask(
  id: number,
  title: string,
  category: TaskCategory,
  dueDate: string,
  assignedTo: number,
  priority: 'Low' | 'Medium' | 'High',
): Promise<Task> {
  const task = await request<ApiTask>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title,
      category,
      due_date: dueDate,
      assigned_to: assignedTo,
      priority,
    }),
  })

  return toTask(task)
}


export async function deleteTask(id: number): Promise<void> {
  await request<{ message: string }>(`/tasks/${id}`, {
    method: 'DELETE',
  })
}