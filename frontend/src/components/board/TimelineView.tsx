import React, { useMemo, useState } from 'react'
import type { Card, List } from '../../lib/types'
import { format, addDays, startOfWeek, endOfWeek, differenceInDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'

interface TimelineViewProps {
  cards: Card[]
  lists: List[]
  onCardClick?: (card: Card) => void
}

export function TimelineView({ cards, lists, onCardClick }: TimelineViewProps) {
  const [zoom, setZoom] = useState<'week' | 'month'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const validCards = useMemo(() => cards.filter(c => c.start_date && c.due_date), [cards])

  if (validCards.length === 0) {
    return <div className="p-8 text-center text-base-content/50">No cards with both start_date and due_date found</div>
  }

  const { start, end, days } = useMemo(() => {
    let s, e
    if (zoom === 'week') {
      s = startOfWeek(currentDate)
      e = endOfWeek(currentDate)
    } else {
      s = startOfMonth(currentDate)
      e = endOfMonth(currentDate)
    }
    const d = eachDayOfInterval({ start: s, end: e })
    return { start: s, end: e, days: d }
  }, [zoom, currentDate])

  const totalDays = differenceInDays(end, start) + 1

  return (
    <div className="w-full overflow-x-auto bg-base-100 rounded-xl border border-base-300 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{format(currentDate, zoom === 'week' ? 'MMMM yyyy, w' : 'MMMM yyyy')}</h3>
        <div className="join">
          <button type="button" className="join-item btn btn-sm" onClick={() => setCurrentDate(addDays(currentDate, zoom === 'week' ? -7 : -30))}>Prev</button>
          <button type="button" className={`join-item btn btn-sm ${zoom === 'week' ? 'btn-active' : ''}`} onClick={() => setZoom('week')}>Week</button>
          <button type="button" className={`join-item btn btn-sm ${zoom === 'month' ? 'btn-active' : ''}`} onClick={() => setZoom('month')}>Month</button>
          <button type="button" className="join-item btn btn-sm" onClick={() => setCurrentDate(addDays(currentDate, zoom === 'week' ? 7 : 30))}>Next</button>
        </div>
      </div>
      
      <div className="min-w-[800px]">
        {/* Header timeline */}
        <div className="flex border-b border-base-300 pb-2">
          <div className="w-48 shrink-0 font-medium">Card</div>
          <div className="flex-1 flex relative">
            {days.map((day, i) => (
              <div key={i} className="flex-1 text-center text-xs text-base-content/70 border-l border-base-300">
                {format(day, zoom === 'week' ? 'EEE d' : 'd')}
              </div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        <div className="mt-2 space-y-2 relative">
          {validCards.map(card => {
            const cardStart = new Date(card.start_date!)
            const cardEnd = new Date(card.due_date!)
            
            // Calculate intersection with current view
            const viewStart = start
            const viewEnd = end
            
            if (cardEnd < viewStart || cardStart > viewEnd) return null
            
            const startOffset = Math.max(0, differenceInDays(cardStart, viewStart))
            const duration = differenceInDays(Math.min(cardEnd.getTime(), viewEnd.getTime()), Math.max(cardStart.getTime(), viewStart.getTime())) + 1
            
            const leftPct = (startOffset / totalDays) * 100
            const widthPct = (duration / totalDays) * 100
            
            const isDone = lists[lists.length - 1]?.id === card.list_id
            const isOverdue = cardEnd < new Date() && !isDone
            const bgClass = isDone ? 'bg-success' : isOverdue ? 'bg-error' : 'bg-primary'

            return (
              <div key={card.id} className="flex items-center group">
                <div className="w-48 shrink-0 pr-4 truncate text-sm" title={card.title}>{card.title}</div>
                <div className="flex-1 relative h-8 bg-base-200 rounded">
                  <div 
                    onClick={() => onCardClick?.(card)}
                    className={`absolute h-full rounded shadow-sm text-xs text-primary-content font-medium px-2 py-1 truncate cursor-pointer hover:opacity-90 ${bgClass}`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${card.title} (${format(cardStart, 'MMM d')} - ${format(cardEnd, 'MMM d')})`}
                  >
                    {card.title}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
