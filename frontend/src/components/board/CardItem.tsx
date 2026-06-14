import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { Card } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'

interface CardItemProps {
  card: Card
}

export function CardItem({ card }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.split('T')[0] : '')
  const [storyPoints, setStoryPoints] = useState(card.story_points || '')

  const updateCard = useBoardStore((s) => s.updateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const labels = useBoardStore((s) => s.labels)
  const addLabelToCard = useBoardStore((s) => s.addLabelToCard)
  const removeLabelFromCard = useBoardStore((s) => s.removeLabelFromCard)

  const isOverdue = card.due_date && new Date(card.due_date) < new Date() && !card.archived_at

  const handleUpdate = async () => {
    await updateCard(card.id, {
      title,
      description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      story_points: storyPoints ? Number(storyPoints) : null,
    })
    setIsOpen(false)
  }

  const toggleLabel = async (label: (typeof labels)[0]) => {
    const hasLabel = card.labels?.some((l) => l.id === label.id)
    if (hasLabel) {
      await removeLabelFromCard(card.id, label.id)
    } else {
      await addLabelToCard(card.id, label)
    }
  }

  return (
    <>
      {/* Card Body */}
      {/* biome-ignore lint/a11y/useSemanticElements: using div as button for complex CardItem trigger */}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
        className="card bg-base-100 shadow-sm border border-base-200/50 hover:shadow-md hover:border-primary/30 transition-all p-3 space-y-2 group relative cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {/* Labels header */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((l) => (
              <span
                key={l.id}
                style={{ backgroundColor: l.color }}
                className="text-[9px] text-white px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase"
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm text-base-content/90 line-clamp-2 pr-6">
            {card.title}
          </h4>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              deleteCard(card.id)
            }}
            className="btn btn-ghost btn-xs btn-circle absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-error hover:bg-error/10"
            title="Delete Card"
          >
            ✕
          </button>
        </div>

        {card.description && (
          <p className="text-xs text-base-content/65 line-clamp-2 leading-relaxed">
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
            <span
              className={`text-[10px] ml-auto font-medium flex items-center gap-1 ${
                isOverdue ? 'text-error font-bold' : 'text-base-content/50'
              }`}
            >
              {isOverdue ? '⚠️ Overdue:' : '📅'} {new Date(card.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Card Details Modal */}
      {isOpen && (
        <div className="modal modal-open z-50">
          <div className="modal-box bg-base-100 border border-base-200 shadow-2xl relative space-y-4 max-w-lg">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-primary">Edit Card Details</h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                  Title
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered input-sm w-full focus:outline-none focus:input-primary"
                />
              </div>

              <div>
                <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea textarea-bordered textarea-sm w-full h-24 focus:outline-none focus:textarea-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                    Due Date
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input input-bordered input-sm w-full focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                    Story Points
                  </span>
                  <input
                    type="number"
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(e.target.value)}
                    className="input input-bordered input-sm w-full focus:outline-none"
                  />
                </div>
              </div>

              {/* Labels list toggle */}
              <div>
                <span className="text-xs text-base-content/50 font-bold uppercase block mb-2">
                  Labels
                </span>
                <div className="flex flex-wrap gap-2">
                  {labels.map((l) => {
                    const active = card.labels?.some((cl) => cl.id === l.id)
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLabel(l)}
                        style={{
                          backgroundColor: active ? l.color : undefined,
                          borderColor: l.color,
                        }}
                        className={`btn btn-xs rounded transition-all capitalize border ${
                          active ? 'text-white' : 'btn-outline text-base-content/70'
                        }`}
                      >
                        {l.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button type="button" onClick={handleUpdate} className="btn btn-primary btn-sm px-6">
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
