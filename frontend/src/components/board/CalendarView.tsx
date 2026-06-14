import React, { useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Card } from '../../lib/types'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarViewProps {
  cards: Card[]
  onCardClick?: (card: Card) => void
  onSlotClick?: (date: Date) => void
}

export function CalendarView({ cards, onCardClick, onSlotClick }: CalendarViewProps) {
  const events = useMemo(() => {
    return cards
      .filter((c) => c.due_date)
      .map((c) => ({
        id: c.id,
        title: c.title,
        start: c.start_date ? new Date(c.start_date) : new Date(c.due_date!),
        end: new Date(c.due_date!),
        resource: c,
      }))
  }, [cards])

  return (
    <div className="h-[600px] w-full bg-base-100 p-4 rounded-xl border border-base-300">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={(event) => onCardClick?.(event.resource)}
        onSelectSlot={(slotInfo) => onSlotClick?.(slotInfo.start)}
        selectable
        defaultView={Views.MONTH}
        eventPropGetter={(event: any) => {
          const card = event.resource as Card
          const now = new Date()
          const isOverdue = card.due_date && new Date(card.due_date) < now && !card.is_completed
          const bgColor = isOverdue
            ? '#ef4444'
            : card.labels && card.labels.length > 0
            ? card.labels[0].color
            : '#3b82f6'
          return {
            style: {
              backgroundColor: bgColor,
              color: 'white',
              border: 'none',
            },
          }
        }}
      />
    </div>
  )
}
