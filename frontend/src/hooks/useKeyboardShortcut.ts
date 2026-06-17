import { useEffect, useId, useRef } from 'react'
import { useShortcutContext, ShortcutDefinition } from '../components/shared/ShortcutProvider'

interface UseKeyboardShortcutOptions extends Partial<Omit<ShortcutDefinition, 'key'>> {
  enabled?: boolean
}

export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {}
) {
  const { register, unregister } = useShortcutContext()
  const id = useId()

  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  const {
    enabled = true,
    description = '',
    category = 'General',
    modifiers
  } = options

  const ctrl = modifiers?.ctrl
  const meta = modifiers?.meta
  const shift = modifiers?.shift
  const alt = modifiers?.alt

  useEffect(() => {
    const stabilityHandler = (e: KeyboardEvent) => {
      handlerRef.current(e)
    }

    register(id, {
      key,
      description,
      category,
      modifiers: { ctrl, meta, shift, alt },
      handler: stabilityHandler,
      enabled
    })

    return () => unregister(id)
  }, [id, key, description, category, ctrl, meta, shift, alt, enabled, register, unregister])
}

