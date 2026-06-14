import type { Card } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'

interface CardItemProps {
  card: Card
}

export function CardItem({ card }: CardItemProps) {
  const deleteCard = useBoardStore((s) => s.deleteCard)

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/50 hover:shadow-md hover:border-primary/30 transition-all p-3 space-y-2 group relative">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-sm text-base-content/90 line-clamp-2 pr-6">{card.title}</h4>
        <button
          type="button"
          onClick={() => deleteCard(card.id)}
          className="btn btn-ghost btn-xs btn-circle absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-error hover:bg-error/10"
          title="Delete Card"
        >
          ✕
        </button>
      </div>
      {card.description && (
        <p className="text-xs text-base-content/65 line-clamp-3 leading-relaxed">
          {card.description}
        </p>
      )}
      <div className="flex items-center justify-between pt-1">
        {card.story_points !== null && card.story_points !== undefined && (
          <span className="badge badge-sm badge-outline font-semibold text-primary">
            {card.story_points} pts
          </span>
        )}
        {card.due_date && (
          <span className="text-[10px] text-base-content/50 ml-auto">
            📅 {new Date(card.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
