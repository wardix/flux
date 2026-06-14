import React, { useEffect, useState } from 'react'
import { useBoardStore } from '../../stores/boardStore'
import type { SearchResult } from '../../lib/types'

interface SearchResultsDropdownProps {
  results: SearchResult[]
  isLoading: boolean
  isOpen: boolean
  onSelect: (result: SearchResult) => void
  onClose: () => void
}

export const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  results,
  isLoading,
  isOpen,
  onSelect,
  onClose,
}) => {
  const fetchBoard = useBoardStore((s) => s.fetchBoard)
  const setActiveCardId = useBoardStore((s) => s.setActiveCardId)
  
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Group results by board
  const groups: Record<string, SearchResult[]> = {}
  results.forEach((r) => {
    if (!groups[r.board_title]) {
      groups[r.board_title] = []
    }
    groups[r.board_title].push(r)
  })

  const flatResults = Object.values(groups).flat()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || flatResults.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % flatResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = flatResults[selectedIndex]
        if (selected) {
          handleSelect(selected)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, flatResults])

  const handleSelect = async (result: SearchResult) => {
    onSelect(result)
    // Fetch target board details, open card details popup
    await fetchBoard(result.board_id)
    setActiveCardId(result.id)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 max-h-80 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 p-2">
      {isLoading ? (
        <div className="text-center text-xs text-neutral-400 dark:text-neutral-500 py-6">
          Searching...
        </div>
      ) : flatResults.length === 0 ? (
        <div className="text-center text-xs text-neutral-400 dark:text-neutral-500 py-6">
          No results found
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groups).map(([boardTitle, boardCards]) => (
            <div key={boardTitle} className="space-y-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2 py-0.5">
                📋 {boardTitle}
              </div>
              <div className="space-y-0.5">
                {boardCards.map((card) => {
                  const globalIdx = flatResults.findIndex((r) => r.id === card.id)
                  const isSelected = globalIdx === selectedIndex

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleSelect(card)}
                      className={`flex flex-col gap-1 p-2 rounded-lg cursor-pointer transition-colors text-left ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-900 dark:text-violet-300'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/40 text-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      <span className="text-xs font-semibold">{card.title}</span>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
                        <span>List: {card.list_title}</span>
                        {card.labels.length > 0 && (
                          <div className="flex gap-1">
                            {card.labels.slice(0, 2).map((l) => (
                              <span
                                key={l.id}
                                style={{ backgroundColor: l.color }}
                                className="w-1.5 h-1.5 rounded-full"
                                title={l.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default SearchResultsDropdown
