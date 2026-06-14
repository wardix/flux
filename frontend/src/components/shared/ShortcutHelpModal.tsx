import React, { useEffect, useRef } from 'react'
import { useShortcutContext } from './ShortcutProvider'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutHelpModal({ isOpen, onClose }: Props) {
  const { shortcuts } = useShortcutContext()
  const modalRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal()
    } else {
      modalRef.current?.close()
    }
  }, [isOpen])

  // Handle Escape manually in case it's not caught by dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const formatKey = (key: string, modifiers?: { ctrl?: boolean, meta?: boolean, shift?: boolean, alt?: boolean }) => {
    const parts = []
    if (modifiers?.ctrl) parts.push('Ctrl')
    if (modifiers?.meta) parts.push('Cmd/Win')
    if (modifiers?.alt) parts.push('Alt')
    if (modifiers?.shift) parts.push('Shift')
    
    // Capitalize single letters, otherwise keep as is
    const displayKey = key.length === 1 ? key.toUpperCase() : key
    if (displayKey === ' ') {
      parts.push('Space')
    } else {
      parts.push(displayKey)
    }

    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="mx-1">+</span>}
        <kbd className="kbd kbd-sm">{part}</kbd>
      </React.Fragment>
    ))
  }

  // Group by category
  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = []
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, typeof shortcuts>)

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close">✕</button>
        </form>
        <h3 className="font-bold text-lg mb-4">Keyboard Shortcuts</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm text-base-content/60 mb-2 uppercase">{category}</h4>
              <table className="table table-xs w-full">
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-none">
                      <td className="px-0 py-1 w-1/2 align-top">
                        <div className="flex flex-wrap items-center gap-1">
                          {formatKey(item.key, item.modifiers)}
                        </div>
                      </td>
                      <td className="px-0 py-1 align-top text-sm">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}
