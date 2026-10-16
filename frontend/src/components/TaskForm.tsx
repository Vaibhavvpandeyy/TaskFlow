import { useState, type FormEvent } from 'react'
import { TASK_CATEGORIES, type TaskCategory } from '../types'
import { toLocalDateString } from '../utils/dates'

interface TaskFormProps {
  onAdd: (title: string, category: TaskCategory, dueDate: string) => void
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('Work')
  const [dueDate, setDueDate] = useState(toLocalDateString)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAdd(title, category, dueDate)
    setTitle('')
    setCategory('Work')
    setDueDate(toLocalDateString())
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Title</span>
        <input
          type="text"
          name="title"
          placeholder="Add a new task"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Category</span>
        <select
          name="category"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as TaskCategory)
          }
        >
          {TASK_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Due date</span>
        <input
          type="date"
          name="dueDate"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          required
        />
      </label>

      <button type="submit" className="primary-btn">
        Add Task
      </button>
    </form>
  )
}
