import React, { useState } from 'react'
import { ChecklistItem } from '../../lib/types'
import { ChecklistItemAssignee } from './ChecklistItemAssignee'
import { ChecklistItemDueDate } from './ChecklistItemDueDate'

interface ChecklistItemRowProps {
  item: ChecklistItem
  onToggle: (itemId: number, isCompleted: boolean) => void
  onUpdate: (itemId: number, data: Partial<ChecklistItem>) => void
  onDelete: (itemId: number) => void
  boardMembers: Array<{ id: number; name: string; avatar_url: string | null }>
  disabled?: boolean
}

export function ChecklistItemRow({ item, onToggle, onUpdate, onDelete, boardMembers, disabled }: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== item.title) {
      onUpdate(item.id, { title: editTitle.trim() })
    } else {
      setEditTitle(item.title)
    }
    setIsEditing(false)
  }

  const isOverdue = item.due_date ? new Date(item.due_date) < new Date() && !item.is_completed : false

  return (
    <div className="group flex items-start gap-2 p-1 -ml-1 rounded hover:bg-base-200/50 transition-colors">
      <input
        type="checkbox"
        checked={item.is_completed}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="checkbox checkbox-sm checkbox-primary mt-0.5 rounded"
        disabled={disabled}
      />
      
      <div className="flex-1 min-w-0">
        {isEditing && !disabled ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            className="input input-sm input-bordered w-full h-7 text-sm"
            autoFocus
          />
        ) : (
          <span 
            className={`text-sm cursor-text break-words ${item.is_completed ? 'line-through opacity-50' : ''}`}
            onClick={() => !disabled && setIsEditing(true)}
          >
            {item.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {!disabled && (
          <>
            <ChecklistItemDueDate
              dueDate={item.due_date}
              isOverdue={isOverdue}
              onChange={(date) => onUpdate(item.id, { due_date: date })}
            />
            
            <ChecklistItemAssignee
              assignee={item.assignee}
              boardMembers={boardMembers}
              onAssign={(userId) => onUpdate(item.id, { assignee_id: userId } as any)}
            />
            
            <button
              onClick={() => onDelete(item.id)}
              className="w-6 h-6 flex items-center justify-center text-base-content/40 hover:text-error hover:bg-error/10 rounded transition-colors"
              title="Delete item"
            >
              ✕
            </button>
          </>
        )}
      </div>
      
      {/* Show badges permanently if they exist and not hovering */}
      {(item.due_date || item.assignee) && (
        <div className="flex items-center gap-1 group-hover:hidden transition-opacity">
           {item.due_date && (
            <span className={`px-1 rounded text-[10px] font-medium ${isOverdue ? 'bg-error/10 text-error' : 'bg-base-200'}`}>
              {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {item.assignee && (
            <div className="w-4 h-4 rounded-full overflow-hidden bg-base-300 flex items-center justify-center">
              {item.assignee.avatar_url ? (
                <img src={item.assignee.avatar_url} alt={item.assignee.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold uppercase">{item.assignee.name.charAt(0)}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
