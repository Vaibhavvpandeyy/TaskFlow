import type { FilterView, Task } from '../types'
import {
  DUE_STATUS_LABEL,
  formatDisplayDate,
  getDueStatus,
  toLocalDateString,
} from '../utils/dates'

interface TaskListProps {
  tasks: Task[]
  filter: FilterView
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const EMPTY_COPY: Record<FilterView, { title: string; hint: string }> = {
  all: {
    title: 'No tasks yet',
    hint: 'Add a title, category, and due date above to create your first task.',
  },
  today: {
    title: 'Nothing due today',
    hint: 'Tasks due today or overdue show up here. Add one with today’s date, or switch to All Tasks.',
  },
  upcoming: {
    title: 'No upcoming tasks',
    hint: 'Choose a future due date when you add a task to see it in this list.',
  },
  completed: {
    title: 'No completed tasks yet',
    hint: 'Check off a task to move it here. You can uncheck it anytime to send it back.',
  },
}

export function TaskList({ tasks, filter, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    const copy = EMPTY_COPY[filter]
    return (
      <div className="empty-state">
        <p className="empty-title">{copy.title}</p>
        <p className="empty-hint">{copy.hint}</p>
      </div>
    )
  }

  const today = toLocalDateString()

  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const status = getDueStatus(task, today)
        const itemClass = task.completed
          ? 'task-item done'
          : `task-item due-${status}`

        return (
          <li key={task.id} className={itemClass}>
            <label className="task-check">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
              />
              <span className="task-copy">
                <span className="task-title">{task.title}</span>
                <span className="task-meta">
                  <span className="category-chip">{task.category}</span>
                  <span className={`due-chip due-chip-${status}`}>
                    {DUE_STATUS_LABEL[status]}
                  </span>
                  <span>Due {formatDisplayDate(task.dueDate)}</span>
                </span>
              </span>
            </label>

            <button
              type="button"
              className="delete-btn"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </button>
          </li>
        )
      })}
    </ul>
  )
}
