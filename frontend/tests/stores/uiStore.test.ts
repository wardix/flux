import { beforeEach, describe, expect, test } from 'vitest'
import { useUiStore } from '../../src/stores/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      isShortcutHelpOpen: false,
      isCommandPaletteOpen: false,
    })
  })

  test('should initialize with default state', () => {
    const state = useUiStore.getState()
    expect(state.isShortcutHelpOpen).toBe(false)
    expect(state.isCommandPaletteOpen).toBe(false)
  })

  test('should open and close shortcut help', () => {
    useUiStore.getState().openShortcutHelp()
    expect(useUiStore.getState().isShortcutHelpOpen).toBe(true)

    useUiStore.getState().closeShortcutHelp()
    expect(useUiStore.getState().isShortcutHelpOpen).toBe(false)
  })

  test('should open, close, and toggle command palette', () => {
    useUiStore.getState().openCommandPalette()
    expect(useUiStore.getState().isCommandPaletteOpen).toBe(true)

    useUiStore.getState().closeCommandPalette()
    expect(useUiStore.getState().isCommandPaletteOpen).toBe(false)

    useUiStore.getState().toggleCommandPalette()
    expect(useUiStore.getState().isCommandPaletteOpen).toBe(true)

    useUiStore.getState().toggleCommandPalette()
    expect(useUiStore.getState().isCommandPaletteOpen).toBe(false)
  })
})
