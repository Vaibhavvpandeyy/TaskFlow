export type FilterView = 'all' | 'today' | 'upcoming' | 'completed'

export type TaskCategory = 'Work' | 'Personal' | 'Study' | 'Other'


export interface Task {
  id: number
  title: string
  category: TaskCategory
  completed: boolean
  status: 'Pending' | 'In Progress' | 'Completed'
  priority: 'Low' | 'Medium' | 'High'
  dueDate: string
  createdAt?: string
  assignedTo?: number
  assignedBy?: number
  assignedUsername?: string | null
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
