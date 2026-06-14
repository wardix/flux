import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  accentColor: string
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      accentColor: 'indigo',
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: 'flux-ui-store',
    },
  ),
)
