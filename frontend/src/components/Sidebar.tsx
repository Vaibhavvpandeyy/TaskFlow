import { FILTERS, type FilterView } from '../types'

interface SidebarProps {
  filter: FilterView
  filterCounts: Record<FilterView, number>
  onFilterChange: (filter: FilterView) => void
}

export function Sidebar({
  filter,
  filterCounts,
  onFilterChange,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">TF</span>
        <div>
          <p className="brand-name">TaskFlow</p>
          <p className="brand-tag">Stay on track</p>
        </div>
      </div>

      <nav className="nav" aria-label="Task filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onFilterChange(item.id)}
          >
            <span>{item.label}</span>
            <span className="nav-count">{filterCounts[item.id]}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
