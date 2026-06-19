import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface UiState {
  theme: Theme
  accentColor: string
  aiFeaturesEnabled: boolean
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
  setAiFeaturesEnabled: (enabled: boolean) => void
  isShortcutHelpOpen: boolean
  openShortcutHelp: () => void
  closeShortcutHelp: () => void
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      accentColor: 'indigo',
      aiFeaturesEnabled: true,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setAiFeaturesEnabled: (aiFeaturesEnabled) => set({ aiFeaturesEnabled }),
      isShortcutHelpOpen: false,
      openShortcutHelp: () => set({ isShortcutHelpOpen: true }),
      closeShortcutHelp: () => set({ isShortcutHelpOpen: false }),
      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
    }),
    {
      name: 'flux-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        aiFeaturesEnabled: state.aiFeaturesEnabled,
      }),
    },
  ),
)

