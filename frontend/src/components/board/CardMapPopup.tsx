import React from 'react'
import { MapPin } from 'lucide-react'
import { CardWithLocation } from '../../lib/types'

interface CardMapPopupProps {
  card: CardWithLocation
  onOpenCard: () => void
}

export function CardMapPopup({ card, onOpenCard }: CardMapPopupProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <h3 className="font-bold text-sm leading-tight text-base-content">{card.title}</h3>
      
      <div className="flex items-start gap-1.5 text-xs text-base-content/70 mt-1">
        <MapPin size={12} className="shrink-0 mt-0.5 text-error" />
        <span className="leading-tight">{card.address || 'No address provided'}</span>
      </div>
      
      <div className="flex items-center gap-2 mt-1">
        <span className="badge badge-sm badge-ghost text-[10px] uppercase font-bold tracking-wider">
          {card.list_title}
        </span>
      </div>

      <button 
        className="btn btn-primary btn-xs w-full mt-2" 
        onClick={(e) => {
          e.stopPropagation()
          onOpenCard()
        }}
      >
        Open Card
      </button>
    </div>
  )
}
