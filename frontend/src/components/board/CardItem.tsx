import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Card, CreateSubtaskRequest, SubtaskCard } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'
import { StoryPointBadge } from './StoryPointBadge'
import { StoryPointPicker } from './StoryPointPicker'
import { SubtaskList } from './SubtaskList'
import { SubtaskProgress } from './SubtaskProgress'

interface CardItemProps {
  card: Card
  isSubtask?: boolean
}

export function CardItem({ card, isSubtask = false }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isSubtask, // Disable dragging for subtasks
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
  const [storyPoints, setStoryPoints] = useState<number | null>(card.story_points ?? null)

  const [subtasks, setSubtasks] = useState<SubtaskCard[]>([])
  const [subtaskTotal, setSubtaskTotal] = useState(0)
  const [subtaskCompleted, setSubtaskCompleted] = useState(0)

  const updateCard = useBoardStore((s) => s.updateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const archiveCard = useBoardStore((s) => s.archiveCard)
  const labels = useBoardStore((s) => s.labels)
  const addLabelToCard = useBoardStore((s) => s.addLabelToCard)
  const removeLabelFromCard = useBoardStore((s) => s.removeLabelFromCard)

  const isOverdue = card.due_date && new Date(card.due_date) < new Date() && !card.archived_at

  const fetchSubtasks = async () => {
    try {
      const res = await api.get<{
        subtasks: SubtaskCard[]
        totalCount: number
        completedCount: number
      }>(`/cards/${card.id}/subtasks`)
      setSubtasks(res.subtasks)
      setSubtaskTotal(res.totalCount)
      setSubtaskCompleted(res.completedCount)
    } catch (err) {
      console.error(err)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchSubtasks is not memoized
  useEffect(() => {
    if (isOpen && !card.parent_card_id) {
      fetchSubtasks()
    }
  }, [isOpen, card.parent_card_id])

  const handleAddSubtask = async (requestData: CreateSubtaskRequest) => {
    try {
      await api.post(`/cards/${card.id}/subtasks`, requestData)
      await fetchSubtasks()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleSubtask = async (subtaskId: number, isCompleted: boolean) => {
    try {
      await api.put(`/cards/${card.id}/subtasks/${subtaskId}`, { is_completed: isCompleted })
      await fetchSubtasks()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await api.delete(`/cards/${card.id}/subtasks/${subtaskId}`)
      await fetchSubtasks()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdate = async () => {
    await updateCard(card.id, {
      title,
      description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      story_points: storyPoints,
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

  const renderModal = () => (
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

          {/* SubtaskList rendering for parent cards only */}
          {!card.parent_card_id && (
            <SubtaskList
              subtasks={subtasks}
              total={subtaskTotal}
              completed={subtaskCompleted}
              onAdd={handleAddSubtask}
              onToggle={handleToggleSubtask}
              onDelete={handleDeleteSubtask}
            />
          )}

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
          </div>

          <div>
            <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
              Story Points
            </span>
            <StoryPointPicker value={storyPoints} onChange={setStoryPoints} />
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

        <div className="modal-action flex justify-between items-center w-full">
          <button
            type="button"
            onClick={async () => {
              await archiveCard(card.id)
              setIsOpen(false)
            }}
            className="btn btn-warning btn-sm btn-outline gap-1"
          >
            📦 Archive
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={handleUpdate} className="btn btn-primary btn-sm px-6">
              Save
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (isSubtask) {
    return (
      <>
        {/* biome-ignore lint/a11y/useSemanticElements: interactive title to open subtask */}
        <span
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
          className={`font-medium cursor-pointer truncate hover:text-primary hover:underline flex-1 text-left ${
            card.is_completed ? 'line-through text-base-content/40' : 'text-base-content/85'
          }`}
        >
          {card.title}
        </span>
        {isOpen && renderModal()}
      </>
    )
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
          <div className="flex items-center gap-2">
            {card.due_date && (
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${
                  isOverdue ? 'text-error font-bold' : 'text-base-content/50'
                }`}
              >
                {isOverdue ? '⚠️ Overdue:' : '📅'} {new Date(card.due_date).toLocaleDateString()}
              </span>
            )}
            {card.subtask_count && card.subtask_count.total > 0 && (
              <SubtaskProgress
                completed={card.subtask_count.completed}
                total={card.subtask_count.total}
              />
            )}
          </div>
          {card.story_points !== null && card.story_points !== undefined && (
            <StoryPointBadge points={card.story_points} />
          )}
        </div>
      </div>
      {isOpen && renderModal()}
    </>
  )
}
