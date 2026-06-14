import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus'

describe('useOnlineStatus', () => {
  test('should return true when online', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  test('should update when going offline', () => {
    const { result } = renderHook(() => useOnlineStatus())
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })

  test('should update when coming back online', () => {
    const { result } = renderHook(() => useOnlineStatus())
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })
})
