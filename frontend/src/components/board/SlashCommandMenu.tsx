import React, { useEffect, useRef, useState } from 'react'
import { Editor } from '@tiptap/react'

export interface SlashCommandItem {
  title: string
  description: string
  icon: string
  command: (editor: Editor) => void
}

export interface SlashCommandMenuProps {
  editor: Editor | null
  items: SlashCommandItem[]
  isOpen: boolean
  position: { top: number; left: number }
  onSelect: (item: SlashCommandItem) => void
  onClose: () => void
  query: string
}

export function SlashCommandMenu({ editor, items, isOpen, position, onSelect, onClose, query }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().startsWith(query.toLowerCase()) || 
    item.description.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isOpen, filteredItems, selectedIndex, onSelect, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || !editor || filteredItems.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 bg-base-100 border border-base-300 rounded-md shadow-lg overflow-hidden py-1"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      {filteredItems.map((item, index) => (
        <button
          key={index}
          className={`w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors ${
            index === selectedIndex ? 'bg-primary/10 text-primary' : 'text-base-content'
          }`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(item)
          }}
        >
          <div className="w-6 h-6 flex items-center justify-center border border-base-300 rounded bg-base-100 shadow-sm text-sm">
            {item.icon}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-semibold text-sm truncate">{item.title}</div>
            <div className="text-xs opacity-60 truncate">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
