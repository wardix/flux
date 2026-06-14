import { beforeEach, describe, expect, test } from 'vitest'
import { useUIStore } from '../../src/stores/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({ theme: 'system', accentColor: 'indigo' })
  })

  test('should initialize with default state', () => {
    const state = useUIStore.getState()
    expect(state.theme).toBe('system')
    expect(state.accentColor).toBe('indigo')
  })

  test('should update theme', () => {
    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')

    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')
  })

  test('should update accent color', () => {
    useUIStore.getState().setAccentColor('rose')
    expect(useUIStore.getState().accentColor).toBe('rose')
  })
})
