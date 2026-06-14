import React, { useEffect } from 'react'
import { useAnalyticsStore } from '../stores/analyticsStore'
import { useBoardStore } from '../stores/boardStore'
import { TimeFilter } from '../components/dashboard/TimeFilter'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import { CardsByStatusChart } from '../components/dashboard/CardsByStatusChart'
import { CardsByMemberChart } from '../components/dashboard/CardsByMemberChart'
import { CompletionRateChart } from '../components/dashboard/CompletionRateChart'
import { VelocityChart } from '../components/dashboard/VelocityChart'
import { BarChart3 } from 'lucide-react'

export function DashboardPage() {
  const { 
    boardId, 
    period, 
    summary, 
    cardsByStatus, 
    cardsByMember, 
    completionRate, 
    velocity, 
    isLoading, 
    setBoardId, 
    setPeriod 
  } = useAnalyticsStore()
  
  const boards = useBoardStore(s => s.boards)

  useEffect(() => {
    // If no board is selected, select the first one by default
    if (!boardId && boards.length > 0) {
      setBoardId(boards[0].id)
    }
  }, [boards, boardId, setBoardId])

  return (
    <div className="p-6 h-full overflow-y-auto bg-base-200/50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-base-content/60">Track your project's performance and velocity.</p>
          </div>
        </div>

        <TimeFilter 
          boardId={boardId} 
          period={period} 
          boards={boards} 
          onBoardChange={setBoardId} 
          onPeriodChange={setPeriod} 
        />

        {boardId ? (
          <>
            <SummaryCards data={summary || { total_cards: 0, completed_cards: 0, overdue_cards: 0, avg_completion_days: 0, completion_percentage: 0 }} isLoading={isLoading} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <CardsByStatusChart data={cardsByStatus} isLoading={isLoading} />
              <CardsByMemberChart data={cardsByMember} isLoading={isLoading} />
              <CompletionRateChart data={completionRate} isLoading={isLoading} />
              <VelocityChart data={velocity} isLoading={isLoading} />
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-base-100 rounded-box shadow">
            <p className="text-base-content/60">Select a board to view analytics.</p>
          </div>
        )}
      </div>
    </div>
  )
}
