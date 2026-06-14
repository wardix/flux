import { useEffect } from 'react'
import { type Theme, useUIStore } from '../stores/uiStore'

export function useTheme() {
  const { theme, setTheme, accentColor, setAccentColor } = useUIStore()

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (t: Theme) => {
      let resolvedTheme = t
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      root.setAttribute('data-theme', resolvedTheme)
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    applyTheme(theme)

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const accents: Record<string, string> = {
      indigo: '#4f46e5',
      blue: '#2563eb',
      emerald: '#059669',
      rose: '#e11d48',
      amber: '#d97706',
      violet: '#7c3aed',
    }
    const colorVal = accents[accentColor] || accents.indigo
    root.style.setProperty('--p', colorVal)
  }, [accentColor])

  return {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
  }
}
