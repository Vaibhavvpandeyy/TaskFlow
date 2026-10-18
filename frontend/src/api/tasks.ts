
import type { Task, TaskCategory } from '../types'

const API_URL = import.meta.env.VITE_API_URL

interface ApiTask {
  id: number
  title: string
  category: TaskCategory
  completed: boolean
  due_date: string | null
}

function toTask(task: ApiTask): Task {  
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    completed: task.completed,
    dueDate: task.due_date ?? '',
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getTasks(): Promise<Task[]> {
  const tasks = await request<ApiTask[]>('/tasks')
  return tasks.map(toTask)
}

export async function createTask(
  title: string,
  category: TaskCategory,
  dueDate: string,
): Promise<Task> {
  const task = await request<ApiTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title,
      category,
      due_date: dueDate,
    }),
  })

  return toTask(task)
}

export async function updateTask(
  id: number,
  completed: boolean,
): Promise<Task> {
  const task = await request<ApiTask>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  })

  return toTask(task)
}

export async function removeTask(id: number): Promise<void> {
  await request<{ message: string }>(`/tasks/${id}`, {
    method: 'DELETE',
  })
}
    