/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { renderHook, fireEvent } from '@testing-library/react'
import { useKeyboardShortcut } from '../../src/hooks/useKeyboardShortcut'
import { ShortcutProvider } from '../../src/components/shared/ShortcutProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(ShortcutProvider, null, children)

describe('useKeyboardShortcut', () => {
  test('should call handler when shortcut key is pressed', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('c', handler, { description: 'Test' }), { wrapper })
    fireEvent.keyDown(document, { key: 'c' })
    expect(handler).toHaveBeenCalledOnce()
  })

  test('should NOT call handler when typing in input', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('c', handler), { wrapper })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'c' })
    expect(handler).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  test('should call handler with modifier keys', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('k', handler, {
      modifiers: { meta: true },
    }), { wrapper })
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(handler).toHaveBeenCalledOnce()
  })

  test('should NOT call handler if modifier is required but not pressed', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('k', handler, {
      modifiers: { meta: true },
    }), { wrapper })
    fireEvent.keyDown(document, { key: 'k' })
    expect(handler).not.toHaveBeenCalled()
  })

  test('should unregister on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcut('c', handler), { wrapper })
    unmount()
    fireEvent.keyDown(document, { key: 'c' })
    expect(handler).not.toHaveBeenCalled()
  })

  test('should respect enabled flag', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('c', handler, { enabled: false }), { wrapper })
    fireEvent.keyDown(document, { key: 'c' })
    expect(handler).not.toHaveBeenCalled()
  })

  test('Escape should work even when focus is in input', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcut('Escape', handler), { wrapper })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(handler).toHaveBeenCalledOnce()
    document.body.removeChild(input)
  })
})
