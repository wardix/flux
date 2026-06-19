/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, test, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShortcutHelpModal } from '../../src/components/shared/ShortcutHelpModal'
import { ShortcutProvider } from '../../src/components/shared/ShortcutProvider'
import { useKeyboardShortcut } from '../../src/hooks/useKeyboardShortcut'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

const TestComponent = () => {
  useKeyboardShortcut('n', () => {}, { description: 'Navigation Test', category: 'Navigation' })
  useKeyboardShortcut('b', () => {}, { description: 'Board Test', category: 'Board' })
  useKeyboardShortcut('c', () => {}, { description: 'Card Test', category: 'Card' })
  useKeyboardShortcut('g', () => {}, { description: 'General Test', category: 'General' })
  return null
}

describe('ShortcutHelpModal', () => {
  test('should render when isOpen is true', () => {
    render(
      <ShortcutProvider>
        <ShortcutHelpModal isOpen={true} onClose={vi.fn()} />
      </ShortcutProvider>
    )
    expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument()
  })

  test('should not render when isOpen is false', () => {
    // modal is dialog, when isOpen false it's technically still in DOM but closed.
    // Testing DOM for dialog element open state or visibility is tricky in JSDOM.
    // Let's just check if it renders the title but dialog is not open
    const { container } = render(
      <ShortcutProvider>
        <ShortcutHelpModal isOpen={false} onClose={vi.fn()} />
      </ShortcutProvider>
    )
    const dialog = container.querySelector('dialog')
    // JSDOM doesn't fully support dialog open attribute natively in the same way, but it should not have 'open' attribute
    expect(dialog?.hasAttribute('open')).toBeFalsy()
  })

  test('should display shortcut categories', () => {
    render(
      <ShortcutProvider>
        <TestComponent />
        <ShortcutHelpModal isOpen={true} onClose={vi.fn()} />
      </ShortcutProvider>
    )
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Board')).toBeInTheDocument()
    expect(screen.getByText('Card')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  test('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <ShortcutProvider>
        <ShortcutHelpModal isOpen={true} onClose={onClose} />
      </ShortcutProvider>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
