import { Sidebar } from './components/Sidebar'
import { SummaryCards } from './components/SummaryCards'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { FILTERS } from './types'
import { useTasks } from './hooks/useTasks'
import './App.css'

function App() {
  const {
    filter,
    setFilter,
    filteredTasks,
    filterCounts,
    stats,
    addTask,
    toggleTask,
    deleteTask,
  } = useTasks()

  const activeLabel =
    FILTERS.find((item) => item.id === filter)?.label ?? 'All Tasks'

  return (
    <div className="app-shell">
      <Sidebar
        filter={filter}
        filterCounts={filterCounts}
        onFilterChange={setFilter}
      />

      <main className="main">
        <header className="page-header">
          <h1>My Tasks</h1>
          <p className="page-subtitle">Showing {activeLabel.toLowerCase()}</p>
        </header>

        <SummaryCards
          total={stats.total}
          completed={stats.completed}
          pending={stats.pending}
          percent={stats.percent}
        />

        <section className="panel">
          <h2>Add a task</h2>
          <TaskForm onAdd={addTask} />
        </section>

        <section className="panel">
          <h2>{activeLabel}</h2>
          <TaskList
            tasks={filteredTasks}
            filter={filter}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        </section>
      </main>
    </div>
  )
}

export default App
