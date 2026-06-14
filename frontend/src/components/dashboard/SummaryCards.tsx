import type { SummaryData } from '../../lib/types'
import { LayoutList, CheckCircle2, AlertTriangle, Clock, Activity } from 'lucide-react'

interface SummaryCardsProps {
  data: SummaryData
  isLoading: boolean
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="stat shadow rounded-box bg-base-100 animate-pulse">
            <div className="h-12 bg-base-300 rounded mb-2 w-3/4" />
            <div className="h-8 bg-base-300 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="stat shadow rounded-box bg-base-100">
        <div className="stat-figure text-primary">
          <LayoutList size={32} />
        </div>
        <div className="stat-title">Total Cards</div>
        <div className="stat-value text-primary">{data.total_cards}</div>
      </div>
      
      <div className="stat shadow rounded-box bg-base-100">
        <div className="stat-figure text-success">
          <CheckCircle2 size={32} />
        </div>
        <div className="stat-title">Completed</div>
        <div className="stat-value text-success">{data.completed_cards}</div>
      </div>

      <div className="stat shadow rounded-box bg-base-100">
        <div className="stat-figure text-error">
          <AlertTriangle size={32} />
        </div>
        <div className="stat-title">Overdue</div>
        <div className="stat-value text-error">{data.overdue_cards}</div>
      </div>

      <div className="stat shadow rounded-box bg-base-100">
        <div className="stat-figure text-secondary">
          <Clock size={32} />
        </div>
        <div className="stat-title">Avg Days to Complete</div>
        <div className="stat-value text-secondary">{data.avg_completion_days}</div>
      </div>

      <div className="stat shadow rounded-box bg-base-100">
        <div className="stat-figure text-info">
          <Activity size={32} />
        </div>
        <div className="stat-title">Completion Rate</div>
        <div className="stat-value text-info">{data.completion_percentage}%</div>
      </div>
    </div>
  )
}
