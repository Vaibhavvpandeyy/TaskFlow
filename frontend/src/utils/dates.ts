export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export type DueStatus = 'overdue' | 'today' | 'upcoming' | 'completed'

export function getDueStatus(
  task: { completed: boolean; dueDate: string },
  today: string,
): DueStatus {
  if (task.completed) return 'completed'
  if (task.dueDate < today) return 'overdue'
  if (task.dueDate === today) return 'today'
  return 'upcoming'
}

export const DUE_STATUS_LABEL: Record<DueStatus, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Upcoming',
  completed: 'Completed',
}
