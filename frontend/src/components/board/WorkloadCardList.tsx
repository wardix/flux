import React from 'react'
import { WorkloadCard } from '../../lib/types'
import { CalendarIcon, AlertCircleIcon, TagIcon } from 'lucide-react'
import { format } from 'date-fns'

interface WorkloadCardListProps {
  cards: WorkloadCard[]
  onCardClick: (cardId: number) => void
}

export const WorkloadCardList: React.FC<WorkloadCardListProps> = ({ cards, onCardClick }) => {
  if (cards.length === 0) {
    return <div className="p-4 text-center text-base-content/60 text-sm">No active cards assigned.</div>
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-base-200/50 rounded-b-lg border border-t-0 border-base-300">
      {cards.map(card => (
        <div
          key={card.id}
          onClick={() => onCardClick(card.id)}
          className="flex items-center justify-between p-3 bg-base-100 rounded-md border border-base-300 hover:border-primary hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-base-content">{card.title}</span>
              {card.is_overdue && (
                <span className="badge badge-error badge-sm gap-1">
                  <AlertCircleIcon className="w-3 h-3" />
                  Overdue
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-base-content/70">
              <span className="flex items-center gap-1 opacity-70">
                <span className="w-2 h-2 rounded-full bg-base-content/20"></span>
                {card.list_title}
              </span>
              {card.due_date && (
                <span className={`flex items-center gap-1 ${card.is_overdue ? 'text-error font-medium' : ''}`}>
                  <CalendarIcon className="w-3 h-3" />
                  {format(new Date(card.due_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          
          {card.labels && card.labels.length > 0 && (
            <div className="flex items-center gap-1">
              {card.labels.slice(0, 3).map(label => (
                <div
                  key={label.id}
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
              {card.labels.length > 3 && (
                <span className="text-[10px] text-base-content/50 ml-1">+{card.labels.length - 3}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
