import type React from 'react'
import type { CardMirror } from '../../lib/types'

interface MirrorListProps {
  cardId: number
  mirrors: CardMirror[]
  onRemoveMirror: (mirrorId: number) => void
}

export const MirrorList: React.FC<MirrorListProps> = ({ cardId, mirrors, onRemoveMirror }) => {
  return (
    <div className="space-y-2" data-card-id={cardId}>
      <span className="text-xs text-base-content/50 font-bold uppercase block">
        Card Mirrors ({mirrors.length})
      </span>
      {mirrors.length === 0 ? (
        <p className="text-xs text-base-content/40 italic">Card ini belum di-mirror ke mana pun.</p>
      ) : (
        <div className="space-y-1.5">
          {mirrors.map((m) => (
            <div
              key={m.id}
              className="flex justify-between items-center text-xs p-2 rounded-lg border border-base-200 bg-base-50/50"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base-content/50">🔗</span>
                <span className="font-semibold truncate">
                  {m.mirror_board_title || 'Unknown Board'}
                </span>
                <span className="text-base-content/30">→</span>
                <span className="text-base-content/70 truncate">
                  {m.mirror_list_title || 'Unknown List'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMirror(m.id)}
                className="btn btn-xs btn-ghost text-error hover:bg-error/10 p-1 min-h-0 h-auto"
                title="Hapus Mirror (Unlink)"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
