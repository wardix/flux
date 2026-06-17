import React, { useState } from 'react'
import type { Card, List } from '../../lib/types'

interface TableViewProps {
  cards: Card[]
  lists: List[]
  onCardUpdate: (cardId: number, data: Partial<Card>) => void
}

export function TableView({ cards, lists, onCardUpdate }: TableViewProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Card | 'list_title'; direction: 'asc' | 'desc' } | null>(null)
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof Card } | null>(null)
  const [editValue, setEditValue] = useState('')
  const getListTitle = (listId: number) => {
    return lists.find(l => l.id === listId)?.title || 'Unknown List'
  }
  // Always render table so layout is correct even without cards
  const sortedCards = cards.length > 0 ? [...cards].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    
    let aVal: any = a[key as keyof Card]
    let bVal: any = b[key as keyof Card]
    
    if (key === 'list_title') {
      aVal = getListTitle(a.list_id)
      bVal = getListTitle(b.list_id)
    }

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1
    if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1

    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    
    if (aStr < bStr) return direction === 'asc' ? -1 : 1
    if (aStr > bStr) return direction === 'asc' ? 1 : -1
    return 0
  }) : []

  const handleSort = (key: keyof Card | 'list_title') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDoubleClick = (card: Card, field: keyof Card) => {
    setEditingCell({ id: card.id, field })
    setEditValue(card[field] ? String(card[field]) : '')
  }

  const handleSave = () => {
    if (editingCell) {
      onCardUpdate(editingCell.id, { [editingCell.field]: editValue })
      setEditingCell(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  return (
    <div className="overflow-x-auto w-full pb-32">
      <table className="table table-zebra table-sm w-full">
        <thead>
          <tr>
            <th className="cursor-pointer select-none hover:bg-base-200" onClick={() => handleSort('title')}>Title</th>
            <th className="cursor-pointer select-none hover:bg-base-200" onClick={() => handleSort('list_title')}>List</th>
            <th>Assignees</th>
            <th>Labels</th>
            <th className="cursor-pointer select-none hover:bg-base-200" onClick={() => handleSort('due_date')}>Due Date</th>
            <th className="cursor-pointer select-none hover:bg-base-200" onClick={() => handleSort('start_date')}>Start Date</th>
          </tr>
        </thead>
        <tbody>
          {sortedCards.map(card => (
            <tr key={card.id}>
              <td onDoubleClick={() => handleDoubleClick(card, 'title')}>
                {editingCell?.id === card.id && editingCell?.field === 'title' ? (
                  <input
                    type="text"
                    className="input input-xs input-bordered w-full"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  card.title
                )}
              </td>
              <td>{getListTitle(card.list_id)}</td>
              <td>{/* Assignees visual representation could go here */}</td>
              <td>
                <div className="flex gap-1 flex-wrap">
                  {card.labels?.map(l => (
                    <span key={l.id} className="badge badge-xs text-white" style={{ backgroundColor: l.color }}>
                      {l.name}
                    </span>
                  ))}
                </div>
              </td>
              <td>{card.due_date ? new Date(card.due_date).toLocaleDateString() : '-'}</td>
              <td>{card.start_date ? new Date(card.start_date).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
