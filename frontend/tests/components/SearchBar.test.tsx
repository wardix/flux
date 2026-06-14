import { fireEvent, render, screen, act } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX in Vitest environment
import React from 'react'
import { describe, expect, test, vi } from 'vitest'
import { SearchBar } from '../../src/components/shared/SearchBar'

describe('SearchBar', () => {
  vi.useFakeTimers()

  test('should render search input with placeholder', () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText(/Search\.\.\./i)
    expect(input).toBeInTheDocument()
  })

  test('should show loading spinner when isLoading is true', () => {
    render(<SearchBar isLoading={true} />)
    const spinner = screen.getByTestId('search-spinner')
    expect(spinner).toBeInTheDocument()
  })

  test('should call onSearch after 300ms debounce when typing', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    const input = screen.getByPlaceholderText(/Search\.\.\./i)

    fireEvent.change(input, { target: { value: 'react' } })

    // Before 300ms debounce
    expect(onSearch).not.toHaveBeenCalled()

    // Advance time by 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onSearch).toHaveBeenCalledWith('react')
  })

  test('should clear search and close dropdown on Escape key', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    const input = screen.getByPlaceholderText(/Search\.\.\./i)

    fireEvent.change(input, { target: { value: 'react' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(input).toHaveValue('react')

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })

    expect(input).toHaveValue('')
  })
})
