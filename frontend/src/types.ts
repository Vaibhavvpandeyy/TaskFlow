export type FilterView = 'all' | 'today' | 'upcoming' | 'completed'

export type TaskCategory = 'Work' | 'Personal' | 'Study' | 'Other'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  completed: boolean
  dueDate: string
  createdAt: string
}

export const TASK_CATEGORIES: TaskCategory[] = [
  'Work',
  'Personal',
  'Study',
  'Other',
]

export const FILTERS: { id: FilterView; label: string }[] = [
  { id: 'all', label: 'All Tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
]
