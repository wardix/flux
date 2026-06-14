import type React from 'react'
import { useEffect, useState } from 'react'
import type { Card } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'

interface GoalCardLinkerProps {
  goalId: number
  linkedCards: Card[]
  onLink: (cardId: number) => void
  onUnlink: (cardId: number) => void
}

export const GoalCardLinker: React.FC<GoalCardLinkerProps> = ({
  linkedCards = [],
  onLink,
  onUnlink,
}) => {
  const activeBoard = useBoardStore((s) => s.activeBoard)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableCards, setAvailableCards] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    // Collect all cards from all loaded boards or activeBoard to search from
    const allCards: any[] = []

    // Check activeBoard cards
    if (activeBoard?.lists) {
      for (const list of activeBoard.lists) {
        if (list.cards) {
          for (const card of list.cards) {
            allCards.push({
              ...card,
              board_title: activeBoard.title,
            })
          }
        }
      }
    }

    // Filter out cards that are already linked
    const unlinked = allCards.filter((c) => !linkedCards.some((lc) => lc.id === c.id))
    setAvailableCards(unlinked)
  }, [activeBoard, linkedCards])

  const filteredCards = availableCards.filter((card) =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="label text-xs font-bold uppercase text-base-content/60">
          Hubungkan Kartu Tugas
        </label>
        <div className="relative">
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            placeholder="Cari kartu tugas berdasarkan judul..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && searchTerm.trim() && (
            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-base-100 border border-base-200 shadow-xl rounded-lg z-10">
              {filteredCards.length === 0 ? (
                <div className="text-xs p-3 text-base-content/50 text-center">
                  Tidak ada kartu yang cocok.
                </div>
              ) : (
                filteredCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="w-full text-left p-2.5 hover:bg-base-200 border-b border-base-50 text-xs flex flex-col justify-start"
                    onClick={() => {
                      onLink(card.id)
                      setSearchTerm('')
                      setShowDropdown(false)
                    }}
                  >
                    <span className="font-semibold text-base-content">{card.title}</span>
                    <span className="text-[10px] text-base-content/50">
                      Board: {card.board_title}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-base-content/60 uppercase block">
          Kartu yang Terhubung ({linkedCards.length})
        </span>
        {linkedCards.length === 0 ? (
          <p className="text-xs text-base-content/40 italic">
            Belum ada kartu tugas yang terhubung.
          </p>
        ) : (
          <div className="space-y-1.5">
            {linkedCards.map((c: any) => (
              <div
                key={c.id}
                className="flex justify-between items-center text-xs p-2 rounded-lg border border-base-200 bg-base-50"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate text-base-content">{c.title}</span>
                  <span className="text-[10px] text-base-content/50">
                    Board: {c.board_title || activeBoard?.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUnlink(c.id)}
                  className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
