import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface ShortcutDefinition {
  key: string
  description: string
  category: string
  modifiers?: {
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    alt?: boolean
  }
}

export interface ShortcutRegistryEntry extends ShortcutDefinition {
  handler: (e: KeyboardEvent) => void
  enabled: boolean
}

interface ShortcutContextType {
  register: (id: string, entry: ShortcutRegistryEntry) => void
  unregister: (id: string) => void
  shortcuts: ShortcutDefinition[]
}

const ShortcutContext = createContext<ShortcutContextType | null>(null)

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [registry, setRegistry] = useState<Record<string, ShortcutRegistryEntry>>({})

  const register = useCallback((id: string, entry: ShortcutRegistryEntry) => {
    setRegistry(prev => ({ ...prev, [id]: entry }))
  }, [])

  const unregister = useCallback((id: string) => {
    setRegistry(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        (activeElement as HTMLElement).isContentEditable
      )

      for (const entry of Object.values(registry)) {
        if (!entry.enabled) continue

        const ctrlMatch = !!entry.modifiers?.ctrl === e.ctrlKey
        const metaMatch = !!entry.modifiers?.meta === e.metaKey
        const altMatch = !!entry.modifiers?.alt === e.altKey

        // If key matches case-insensitively, e.g. e.key = "?" and entry.key = "?"
        // When user types "?", on many layouts e.key is "?" and e.shiftKey is true.
        // But some systems might report it slightly differently or Playwright's press("?") might not send Shift modifier.
        // Let's make sure that if entry.key is a symbol that requires Shift (like '?'), we don't strictly require shiftMatch to be false if shiftMatch is actually required, or vice-versa.
        // Standard rule: if the typed character matches entry.key exactly, and we don't explicitly require other modifiers, match it.
        const keyMatch = e.key === entry.key || e.key.toLowerCase() === entry.key.toLowerCase()

        // If the entry.key is "?" or other symbol and keyMatch is true, we should be lenient with shiftMatch.
        const shiftMatch = entry.key === '?' ? true : (!!entry.modifiers?.shift === e.shiftKey)

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          const hasModifier = e.ctrlKey || e.metaKey || e.altKey
          // If we are in an input, ONLY trigger if it's Escape or it has a modifier
          if (isInput) {
            if (e.key === 'Escape' || hasModifier) {
              entry.handler(e)
            }
          } else {
            entry.handler(e)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [registry])

  const shortcuts = Object.values(registry).map(({ key, description, category, modifiers }) => ({
    key, description, category, modifiers
  }))

  // Sort by category then by key
  shortcuts.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.key.localeCompare(b.key)
  })

  // Deduplicate for display
  const uniqueShortcuts = Array.from(new Map(shortcuts.map(s => [s.key + s.category, s])).values())

  return (
    <ShortcutContext.Provider value={{ register, unregister, shortcuts: uniqueShortcuts }}>
      {children}
    </ShortcutContext.Provider>
  )
}

export function useShortcutContext() {
  const ctx = useContext(ShortcutContext)
  if (!ctx) throw new Error('useShortcutContext must be used within a ShortcutProvider')
  return ctx
}
