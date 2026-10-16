
import { useEffect, useMemo, useState } from 'react'
import type { FilterView, Task, TaskCategory } from '../types'
import { toLocalDateString } from '../utils/dates'
import {
  getTasks,
  createTask,
  updateTask,
  removeTask,
} from '../api/tasks'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<FilterView>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Backend se tasks load karo jab app open ho
  useEffect(() => {
    let active = true

    getTasks()
      .then((data) => {
        if (active) {
          setTasks(data)
          setError(null)
        }
      })
      .catch(() => {
        if (active) {
          setError('Tasks load nahi ho paaye. Backend check karo.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Naya task backend mein save karo
  const addTask = async (
    title: string,
    category: TaskCategory,
    dueDate: string,
  ) => {
    const trimmed = title.trim()
    if (!trimmed) return

    try {
      const newTask = await createTask(trimmed, category, dueDate)
      setTasks((current) => [newTask, ...current])
      setError(null)
    } catch {
      setError('Task save nahi hua. Backend check karke dobara try karo.')
    }
  }

  // Task ka completion status backend mein update karo
  const toggleTask = async (id: number) => {
    const task = tasks.find((item) => item.id === id)
    if (!task) return

    try {
      const updatedTask = await updateTask(id, !task.completed)
      setTasks((current) =>
        current.map((item) =>
          item.id === id ? updatedTask : item,
        ),
      )
      setError(null)
    } catch {
      setError('Task update nahi hua. Dobara try karo.')
    }
  }

  // Task backend se delete karo
  const deleteTask = async (id: number) => {
    try {
      await removeTask(id)
      setTasks((current) =>
        current.filter((task) => task.id !== id),
      )
      setError(null)
    } catch {
      setError('Task delete nahi hua. Dobara try karo.')
    }
  }

  const today = toLocalDateString()

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesFilter(task, filter, today)),
    [filter, tasks, today],
  )

  const filterCounts = useMemo(
    () => ({
      all: tasks.length,
      today: tasks.filter((task) =>
        matchesFilter(task, 'today', today),
      ).length,
      upcoming: tasks.filter((task) =>
        matchesFilter(task, 'upcoming', today),
      ).length,
      completed: tasks.filter((task) =>
        matchesFilter(task, 'completed', today),
      ).length,
    }),
    [tasks, today],
  )

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length
    const total = tasks.length

    return {
      total,
      completed,
      pending: total - completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    }
  }, [tasks])

  return {
    tasks,
    filter,
    setFilter,
    filteredTasks,
    filterCounts,
    stats,
    addTask,
    toggleTask,
    deleteTask,
    loading,
    error,
  }
}

function matchesFilter(
  task: Task,
  filter: FilterView,
  today: string,
): boolean {
  switch (filter) {
    case 'today':
      return !task.completed && task.dueDate <= today
    case 'upcoming':
      return !task.completed && task.dueDate > today
    case 'completed':
      return task.completed
    default:
      return true
  }
}
