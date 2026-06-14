import { useEffect, useId } from 'react'
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

  const {
    enabled = true,
    description = '',
    category = 'General',
    modifiers
  } = options

  useEffect(() => {
    register(id, {
      key,
      description,
      category,
      modifiers,
      handler,
      enabled
    })

    return () => unregister(id)
  }, [id, key, description, category, modifiers, handler, enabled, register, unregister])
}
