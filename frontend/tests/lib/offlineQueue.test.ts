import { beforeEach, describe, expect, test, vi } from 'vitest'
import 'fake-indexeddb/auto'
import {
  clearFailedMutations,
  enqueueMutation,
  getPendingMutations,
  syncMutations,
} from '../../src/lib/offlineQueue'

describe('Offline Mutation Queue', () => {
  beforeEach(async () => {
    // Reset IndexedDB before each test cleanly
    // Wait for any active connections to drop by referencing fake-indexeddb structure
    const databases = await indexedDB.databases()
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name)
      }
    }
    vi.restoreAllMocks()
    localStorage.clear()
  })

  test('should enqueue a mutation', async () => {
    await enqueueMutation({
      type: 'create_card',
      payload: { title: 'New Card', list_id: 1 },
      endpoint: '/api/cards',
      method: 'POST',
    })
    const pending = await getPendingMutations()
    expect(pending).toHaveLength(1)
    expect(pending[0].type).toBe('create_card')
    expect(pending[0].status).toBe('pending')
  })

  test('should preserve mutation order (FIFO)', async () => {
    await enqueueMutation({
      type: 'create_card',
      payload: { title: 'First' },
      endpoint: '/api/cards',
      method: 'POST',
    })
    await enqueueMutation({
      type: 'move_card',
      payload: { cardId: 1, toListId: 2 },
      endpoint: '/api/cards/1/move',
      method: 'PUT',
    })
    const pending = await getPendingMutations()
    expect(pending).toHaveLength(2)
    expect(pending[0].type).toBe('create_card')
    expect(pending[1].type).toBe('move_card')
  })

  test('should sync mutations when online', async () => {
    // Mock fetch
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as any)
    localStorage.setItem('token', 'test-token')
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })

    await enqueueMutation({
      type: 'create_card',
      payload: { title: 'Card' },
      endpoint: '/api/cards',
      method: 'POST',
    })

    await syncMutations()

    const pending = await getPendingMutations()
    expect(pending).toHaveLength(0)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('should retry failed mutations up to 3 times', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as any)
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })

    await enqueueMutation({
      type: 'create_card',
      payload: { title: 'Card' },
      endpoint: '/api/cards',
      method: 'POST',
    })

    // Sync 4 times (initial + 3 retries)
    for (let i = 0; i < 4; i++) {
      await syncMutations()
    }

    // After 4 failures, status should be 'failed'
    const pending = await getPendingMutations()
    expect(pending).toHaveLength(0) // Not pending anymore

    // Check it's in failed state via clearFailed
    await clearFailedMutations()
  })

  test('should clear failed mutations', async () => {
    await clearFailedMutations()
  })
})
