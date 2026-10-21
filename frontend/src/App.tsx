import {
  // existing functions
} from './api/client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  clearToken,
  createJunior,
  createTask,
  deleteTask,
  getCurrentUser,
  getJuniors,
  getTasks,
  login,
  updateTask,
  type User,
  editTask,
} from './api/client'
import type { Task, TaskCategory } from './types'

const CATEGORIES: TaskCategory[] = ['Work', 'Personal', 'Study', 'Other']

function App(){  
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [juniors, setJuniors] = useState<User[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [juniorUsername, setJuniorUsername] = useState('')
  const [juniorPassword, setJuniorPassword] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [category, setCategory] = useState<TaskCategory>('Work')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [dueDate, setDueDate] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState<TaskCategory>('Work')
  const [editDueDate, setEditDueDate] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadDashboard(role: User['role']) {
    const taskData = await getTasks()
    setTasks(taskData)

    if (role === 'admin') {
      const juniorData = await getJuniors()
      setJuniors(juniorData)
    }
  }
  

  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        await loadDashboard(currentUser.role)
      } catch {
        clearToken()
      } finally {
        setLoading(false)
      }
    }

    void restoreSession()
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const result = await login(username.trim(), password)
      setUser(result.user)
      setPassword('')
      await loadDashboard(result.user.role)
    } catch (err) {
      clearToken()
      setUser(null)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  function handleLogout() {
    clearToken()
    setUser(null)
    setTasks([])
    setJuniors([])
    setUsername('')
    setPassword('')
    setError('')
    setNotice('')
  }

  async function handleCreateJunior(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    try {
      await createJunior(juniorUsername.trim(), juniorPassword)
      setJuniorUsername('')
      setJuniorPassword('')
      setJuniors(await getJuniors())
      setNotice('Junior account created successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!assignedTo) {
      setError('Please select a junior to assign this task.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await createTask(
        taskTitle.trim(),
        category,
        dueDate,
        Number(assignedTo),
        priority,
      ) 
      setTaskTitle('')
      setDueDate('')
      await loadDashboard('admin')
      setNotice('Task assigned successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign task')
    } finally {
      setBusy(false)
    }
  }

  
function handleEditClick(task: Task) {
  setEditingTaskId(task.id)
  setEditTitle(task.title)
  setEditCategory(task.category)
  setEditDueDate(task.dueDate)
  setEditAssignedTo(String(task.assignedTo ?? ''))
  setEditPriority(task.priority ?? 'Medium')
}

async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  if (editingTaskId === null) return

  if (!editAssignedTo) {
    setError('Please select a junior for this task.')
    return
  }

  setBusy(true)
  setError('')
  setNotice('')

  try {
    await editTask(
      editingTaskId,
      editTitle.trim(),
      editCategory,
      editDueDate,
      Number(editAssignedTo),
      editPriority,
    )

    setEditingTaskId(null)
    await loadDashboard('admin')
    setNotice('Task updated successfully.')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Could not update task')
  } finally {
    setBusy(false)
  }
}

  async function handleDeleteTask(taskId: number) {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await deleteTask(taskId)
      await loadDashboard('admin')
      setNotice('Task deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete task')
    } finally {
      setBusy(false)
    }
  }

  async function handleRefresh() {
    if (!user) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await loadDashboard(user.role)
      setNotice('Dashboard refreshed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh dashboard')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>Loading TaskFlow...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleLogin}>
          <h1>TaskFlow</h1>
          <p>Sign in to manage your tasks</p>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </main>
    )
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const pendingCount = tasks.length - completedCount
  const chartData = [
    { name: "Completed", value: completedCount },
    { name: "Pending", value: pendingCount },
  ];
  

  
const teamPerformanceData = juniors.map((junior) => {
  const juniorTasks = tasks.filter(
    (task) => task.assignedTo === junior.id
  );

  const completed = juniorTasks.filter(
    (task) => task.completed
  ).length;

  return {
    name: junior.username,
    Completed: completed,
    Pending: juniorTasks.length - completed,
  };
});


  return (
    <main className="team-page">
      <header className="team-header">
        <div className="header-user">
          <span className="avatar" aria-hidden="true">
            {user.username.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1>TaskFlow</h1>
            <p>
              Welcome, {user.username} · {user.role === 'admin' ? 'Admin' : 'Junior'}
            </p>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </header>

      <section className="team-content">
        <h2>{user.role === 'admin' ? 'Team Dashboard' : 'My Assigned Tasks'}</h2>

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="success-message">{notice}</p>}

        <div className="charts-grid"></div>          
        
<div className="charts-grid">
  {/* Task Status Donut Chart */}
  <div className="chart-panel">
    <h3>Task Status</h3>

    <div className="donut-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={4}
            stroke="none"
          >
            <Cell fill="#a78bfa" />
            <Cell fill="#45465c" />
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#1c1d2b",
              border: "1px solid #45465c",
              borderRadius: "10px",
              color: "#ffffff",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>

    <div className="chart-legend">
      <span>
        <i className="legend-completed" />
        Completed: {completedCount}
      </span>

      <span>
        <i className="legend-pending" />
        Pending: {pendingCount}
      </span>
    </div>
  </div>

  {/* Team Performance Bar Chart */}
  {user.role === "admin" && (
    <div className="chart-panel">
      <h3>Team Performance</h3>

      <div className="team-bar-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={teamPerformanceData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#45465c"
            />
            <XAxis dataKey="name" stroke="#c7c8d8" />
            <YAxis allowDecimals={false} stroke="#c7c8d8" />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1c1d2b",
                border: "1px solid #45465c",
                borderRadius: "10px",
                color: "#ffffff",
              }}
            />

            <Legend />

            <Bar
              dataKey="Completed"
              fill="#a78bfa"
              radius={[5, 5, 0, 0]}
            />

            <Bar
              dataKey="Pending"
              fill="#2dd4bf"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )}
</div>

{/* Existing task statistics cards — keep these separately */}
<div className="task-summary">
  <div>
    <strong>{tasks.length}</strong>
    <span>Total Tasks</span>
  </div>

  <div>
    <strong>{completedCount}</strong>
    <span>Completed</span>
  </div>

  <div>
    <strong>{pendingCount}</strong>
    <span>Pending</span>
  </div>

  <div>
    <strong>
      {tasks.length === 0
        ? 0
        : Math.round((completedCount / tasks.length) * 100)}%
    </strong>
    <span>Completion Rate</span>
  </div>
</div>


        {user.role === 'admin' && (
          <>
            <section className="dashboard-panel">
              <h3>Create Junior Account</h3>
              <form className="dashboard-form" onSubmit={handleCreateJunior}>
                <label htmlFor="junior-username">Junior username</label>
                <input
                  id="junior-username"
                  value={juniorUsername}
                  onChange={(event) => setJuniorUsername(event.target.value)}
                  minLength={3}
                  required
                />

                <label htmlFor="junior-password">Temporary password</label>
                <input
                  id="junior-password"
                  type="password"
                  value={juniorPassword}
                  onChange={(event) => setJuniorPassword(event.target.value)}
                  minLength={8}
                  required
                />

                <button type="submit" disabled={busy}>
                  Create Account
                </button>
              </form>
            </section>

            <section className="dashboard-panel">
              <h3>Assign New Task</h3>
              <form className="dashboard-form" onSubmit={handleCreateTask}>
                <label htmlFor="task-title">Task title</label>
                <input
                  id="task-title"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  required
                />

                <label htmlFor="task-category">Category</label>
                <select
                  id="task-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as TaskCategory)}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <label htmlFor="task-due-date">Due date</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
                
                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as 'Low' | 'Medium' | 'High')
                  }
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>


                <label htmlFor="assign-junior">Assign to junior</label>
                <select
                  id="assign-junior"
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  required
                >
                  <option value="">Select a junior</option>
                  {juniors.map((junior) => (
                    <option key={junior.id} value={junior.id}>
                      {junior.username}
                    </option>
                  ))}
                </select>

                <button type="submit" disabled={busy || juniors.length === 0}>
                  Assign Task
                </button>
                {juniors.length === 0 && <p>Create a junior account first.</p>}
              </form>
            </section>

            <section className="dashboard-panel">
              <h3>Team Members</h3>
              {juniors.length === 0 ? (
                <p>No junior accounts yet.</p>
              ) : (
                <ul className="junior-list">
                  {juniors.map((junior) => (
                    <li key={junior.id}>{junior.username}</li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <section className="dashboard-panel">
          <h3>{user.role === 'admin' ? 'All Team Tasks' : 'My Tasks'}</h3>

          <div className="team-task-list">
            {tasks.length === 0 ? (
              <p>No tasks available yet.</p>
            ) : (
              tasks.map((task) => (
                <article className="team-task" key={task.id}>
                  <div className="task-details">
                    <strong>{task.title}</strong>
                    <p>{task.category} · Due: {task.dueDate || 'No date'}</p>
                    
                    <p className={`priority priority-${task.priority.toLowerCase()}`}>
                      Priority: {task.priority}
                    </p>

                    {user.role === 'admin' && (
                      <p>Assigned to: {task.assignedUsername || 'Unknown junior'}</p>
                    )}
                  </div>

                  <div className="task-actions">
                  {user.role === 'junior' ? (
                  <select
                    value={task.status}
                    disabled={busy}
                    onChange={(event) =>
                      void updateTask(
                        task.id,
                        event.target.value as 'Pending' | 'In Progress' | 'Completed',
                      ).then(() => loadDashboard(user!.role))
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : 'Could not update task'),
                        )
                    }
                    aria-label={`Status for ${task.title}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (

                                                
                          <span
                            className={`status ${
                              task.status === 'Completed'
                                ? 'completed'
                                : task.status === 'In Progress'
                                  ? 'in-progress'
                                  : 'pending'
                            }`}
                          >
                            {task.status}
                          </span>

                    )}

                    
                  {user.role === 'admin' && (
                    <>
                      <button
                        type="button"
                        className="edit-task-button"
                        disabled={busy}
                        onClick={() => handleEditClick(task)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-task-button"
                        disabled={busy}
                        onClick={() => void handleDeleteTask(task.id)}
                      >
                        Delete  
                      </button>
                    </>
                  )}

                  </div>
                                  
                {user.role === 'admin' && editingTaskId === task.id && (
                  <form className="task-edit-form" onSubmit={handleSaveEdit}>
                    <label>
                      Task Title
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Category
                      <select
                        value={editCategory}
                        onChange={(event) =>
                          setEditCategory(event.target.value as TaskCategory)
                        }
                      >
                        <option value="Work">Work</option>
                        <option value="Personal">Personal</option>
                        <option value="Study">Study</option>
                      </select>
                    </label>

                    <label>
                      Due Date
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(event) => setEditDueDate(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Assign Junior
                      <select
                        value={editAssignedTo}
                        onChange={(event) => setEditAssignedTo(event.target.value)}
                        required
                      >
                        <option value="">Select Junior</option>
                        {juniors.map((junior) => (
                          <option key={junior.id} value={junior.id}>
                            {junior.username}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Priority
                      <select
                        value={editPriority}
                        onChange={(event) =>
                          setEditPriority(event.target.value as 'Low' | 'Medium' | 'High')
                        }
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </label>

                    <button type="submit" disabled={busy}>
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  </form>
                )}

                </article>
              ))
            )}
          </div>
        </section>

        <button
          type="button"
          className="refresh-button"
          disabled={busy}
          onClick={() => void handleRefresh()}
        >
          {busy ? 'Please wait...' : 'Refresh Dashboard'}
        </button>
      </section>
    </main>
  )
}

export default App