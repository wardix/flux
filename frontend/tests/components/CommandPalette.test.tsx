/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommandPalette } from '../../src/components/shared/CommandPalette'
import { useUiStore } from '../../src/stores/uiStore'
import { MemoryRouter } from 'react-router-dom'

// Mock API
vi.mock('../../src/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  window.ResizeObserver = ResizeObserver
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
})

const renderWithProviders = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('CommandPalette', () => {
  beforeEach(() => {
    useUiStore.setState({ isCommandPaletteOpen: true })
  })

  test('should render when isCommandPaletteOpen is true', () => {
    renderWithProviders(<CommandPalette />)
    expect(screen.getByPlaceholderText(/command or search/i)).toBeInTheDocument()
  })

  test('should not render when isCommandPaletteOpen is false', () => {
    useUiStore.setState({ isCommandPaletteOpen: false })
    renderWithProviders(<CommandPalette />)
    expect(screen.queryByPlaceholderText(/command or search/i)).not.toBeInTheDocument()
  })

  test('should display static command groups', () => {
    renderWithProviders(<CommandPalette />)
    expect(screen.getByText('Actions')).toBeInTheDocument()
    // By default cmdk does not render empty groups, wait do we have workspaces populated in tests?
    // We don't need to assert NAVIGATION because workspaceStore is empty.
  })

  test('should display "Create New Card" command', () => {
    renderWithProviders(<CommandPalette />)
    expect(screen.getByText(/create new card/i)).toBeInTheDocument()
  })

  test('should filter commands based on search input', async () => {
    renderWithProviders(<CommandPalette />)
    const input = screen.getByPlaceholderText(/command or search/i)
    fireEvent.change(input, { target: { value: 'create' } })
    await waitFor(() => {
      expect(screen.getByText(/create new card/i)).toBeInTheDocument()
    })
  })

  test('should show "No results found" for non-matching query', async () => {
    renderWithProviders(<CommandPalette />)
    const input = screen.getByPlaceholderText(/command or search/i)
    fireEvent.change(input, { target: { value: 'xyznonexistent' } })
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    })
  })

  test('should search cards when query is 2+ characters', async () => {
    const { api } = await import('../../src/lib/api')
    renderWithProviders(<CommandPalette />)
    const input = screen.getByPlaceholderText(/command or search/i)
    fireEvent.change(input, { target: { value: 'login bug' } })
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/search?q=login'))
    })
  })
})
