
interface TimeFilterProps {
  boardId: number | null
  period: 'week' | 'month' | 'sprint'
  boards: Array<{ id: number; title: string }>
  onBoardChange: (boardId: number) => void
  onPeriodChange: (period: 'week' | 'month' | 'sprint') => void
}

export function TimeFilter({ boardId, period, boards, onBoardChange, onPeriodChange }: TimeFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-base-100 p-4 rounded-box shadow">
      <div className="flex-1 w-full sm:w-auto">
        <select
          className="select select-bordered w-full max-w-xs"
          value={boardId || ''}
          onChange={(e) => onBoardChange(Number(e.target.value))}
        >
          <option value="" disabled>Select a Board</option>
          {boards.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      </div>

      <div className="join w-full sm:w-auto">
        <input 
          className="join-item btn flex-1" 
          type="radio" 
          name="period" 
          aria-label="This Week" 
          checked={period === 'week'}
          onChange={() => onPeriodChange('week')}
        />
        <input 
          className="join-item btn flex-1" 
          type="radio" 
          name="period" 
          aria-label="This Month" 
          checked={period === 'month'}
          onChange={() => onPeriodChange('month')}
        />
        <input 
          className="join-item btn flex-1" 
          type="radio" 
          name="period" 
          aria-label="This Sprint" 
          checked={period === 'sprint'}
          onChange={() => onPeriodChange('sprint')}
        />
      </div>
    </div>
  )
}
