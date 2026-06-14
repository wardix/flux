import React, { useState, useRef, useEffect } from 'react'

interface ChecklistItemDueDateProps {
  dueDate: string | null
  isOverdue: boolean
  onChange: (date: string | null) => void
}

export function ChecklistItemDueDate({ dueDate, isOverdue, onChange }: ChecklistItemDueDateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempDate, setTempDate] = useState(dueDate ? dueDate.split('T')[0] : '')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTempDate(dueDate ? dueDate.split('T')[0] : '')
  }, [dueDate])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSave = () => {
    if (tempDate) {
      // Create ISO string for end of day if not specified, but let's just do simple ISO
      onChange(new Date(tempDate).toISOString())
    } else {
      onChange(null)
    }
    setIsOpen(false)
  }

  const handleRemove = () => {
    onChange(null)
    setIsOpen(false)
  }

  const formatDisplayDate = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
          dueDate
            ? isOverdue
              ? 'bg-error/10 text-error hover:bg-error/20'
              : 'bg-base-200 text-base-content hover:bg-base-300'
            : 'text-base-content/40 hover:bg-base-200 hover:text-base-content'
        }`}
        title="Set due date"
      >
        <span>📅</span>
        {dueDate && <span>{formatDisplayDate(dueDate)}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-48 bg-base-100 border border-base-300 rounded-md shadow-lg z-50 p-3">
          <label className="block text-xs font-semibold mb-1">Due Date</label>
          <input
            type="date"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
            className="input input-sm input-bordered w-full mb-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-sm btn-primary flex-1">Save</button>
            <button onClick={handleRemove} className="btn btn-sm btn-error btn-outline px-2" title="Remove">🗑️</button>
          </div>
        </div>
      )}
    </div>
  )
}
