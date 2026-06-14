import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  accentColor: string
  aiFeaturesEnabled: boolean
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
  setAiFeaturesEnabled: (enabled: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      accentColor: 'indigo',
      aiFeaturesEnabled: true,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setAiFeaturesEnabled: (aiFeaturesEnabled) => set({ aiFeaturesEnabled }),
    }),
    {
      name: 'flux-ui-store',
    },
  ),
)
