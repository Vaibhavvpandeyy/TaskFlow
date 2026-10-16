interface SummaryCardsProps {
  total: number
  completed: number
  pending: number
  percent: number
}

export function SummaryCards({
  total,
  completed,
  pending,
  percent,
}: SummaryCardsProps) {
  return (
    <section className="summary-section" aria-label="Task summary">
      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-label">Total Tasks</p>
          <p className="summary-value">{total}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Completed Tasks</p>
          <p className="summary-value">{completed}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Pending Tasks</p>
          <p className="summary-value">{pending}</p>
        </article>
      </div>

      <article className="progress-card">
        <div className="progress-header">
          <p className="summary-label">Completion</p>
          <p className="progress-percent">{percent}%</p>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Task completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="progress-hint">
          {total === 0
            ? 'Add a task to start tracking progress.'
            : `${completed} of ${total} tasks completed`}
        </p>
      </article>
    </section>
  )
}
