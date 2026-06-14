import { create } from 'zustand'

interface UiState {
  isShortcutHelpOpen: boolean
  openShortcutHelp: () => void
  closeShortcutHelp: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isShortcutHelpOpen: false,
  openShortcutHelp: () => set({ isShortcutHelpOpen: true }),
  closeShortcutHelp: () => set({ isShortcutHelpOpen: false })
}))
