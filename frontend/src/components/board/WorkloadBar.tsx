import React from 'react'
import { WorkloadMember } from '../../lib/types'
import { CAPACITY_COLORS } from '../../lib/constants'
import { ChevronDownIcon, ChevronRightIcon, AlertCircleIcon } from 'lucide-react'

interface WorkloadBarProps {
  member: WorkloadMember
  isExpanded: boolean
  onToggle: () => void
  onCardClick: (cardId: number) => void
}

export const WorkloadBar: React.FC<WorkloadBarProps> = ({ member, isExpanded, onToggle, onCardClick }) => {
  const bgColorClass = CAPACITY_COLORS[member.capacity_level] || 'bg-base-300'
  
  // Calculate percentage for the bar, maxed out at 100%
  // Optimal threshold is 10, let's make max scale = 15 or just visual
  const maxScale = 15
  const percentage = Math.min((member.active_cards / maxScale) * 100, 100)

  return (
    <div className="flex flex-col mb-2">
      <div 
        className={`flex items-center gap-4 p-3 bg-base-100 border border-base-300 cursor-pointer hover:bg-base-200 transition-colors ${isExpanded ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-center w-6 h-6 text-base-content/50">
          {isExpanded ? <ChevronDownIcon size={18} /> : <ChevronRightIcon size={18} />}
        </div>
        
        <div className="flex items-center gap-3 w-48 shrink-0">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.name} />
              ) : (
                <span className="text-xs uppercase">{member.name.substring(0, 2)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm truncate w-32">{member.name}</span>
            {member.overdue_cards > 0 && (
              <span className="text-[10px] text-error flex items-center gap-1 font-semibold">
                <AlertCircleIcon size={10} /> {member.overdue_cards} overdue
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 relative flex items-center">
          <div className="w-full h-4 bg-base-200 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-500 ease-out ${bgColorClass}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end w-16 shrink-0 font-bold text-lg text-base-content/80">
          {member.active_cards}
        </div>
      </div>
    </div>
  )
}
