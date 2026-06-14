import React, { useState, useRef, useEffect } from 'react'

interface ChecklistItemAssigneeProps {
  assignee: { id: number; name: string; avatar_url: string | null } | null
  boardMembers: Array<{ id: number; name: string; avatar_url: string | null }>
  onAssign: (userId: number | null) => void
}

export function ChecklistItemAssignee({ assignee, boardMembers, onAssign }: ChecklistItemAssigneeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 rounded-full border border-base-300 flex items-center justify-center overflow-hidden hover:bg-base-200 transition-colors tooltip tooltip-bottom"
        data-tip={assignee ? assignee.name : 'Assign to...'}
      >
        {assignee ? (
          assignee.avatar_url ? (
            <img src={assignee.avatar_url} alt={assignee.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-base-content/70 uppercase">
              {assignee.name.charAt(0)}
            </span>
          )
        ) : (
          <span className="text-base-content/40 text-xs">👤</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-48 bg-base-100 border border-base-300 rounded-md shadow-lg z-50 py-1">
          <button
            onClick={() => { onAssign(null); setIsOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 text-error transition-colors"
          >
            Unassign
          </button>
          <div className="h-px bg-base-300 my-1" />
          <div className="max-h-48 overflow-y-auto">
            {boardMembers.map(member => (
              <button
                key={member.id}
                onClick={() => { onAssign(member.id); setIsOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 transition-colors flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-base-300 flex-shrink-0 flex items-center justify-center">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase">{member.name.charAt(0)}</span>
                  )}
                </div>
                <span className="truncate">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
