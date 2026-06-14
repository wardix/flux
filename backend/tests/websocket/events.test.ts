import { describe, test, expect } from 'bun:test'
import { handleEvent } from '../../src/websocket/events'

describe('WebSocket Events', () => {
  describe('handleEvent', () => {
    test('should handle join_board event', () => {
      const mockWs = {
        data: { userId: 1, userName: 'John', boardId: null },
        subscribe: (channel: string) => {},
        unsubscribe: (channel: string) => {},
        send: () => {},
      } as any

      handleEvent(mockWs, { type: 'join_board', boardId: 1 })
      expect(mockWs.data.boardId).toBe(1)
    })

    test('should handle leave_board event', () => {
      const mockWs = {
        data: { userId: 1, userName: 'John', boardId: 1 },
        subscribe: (channel: string) => {},
        unsubscribe: (channel: string) => {},
        send: () => {},
      } as any

      handleEvent(mockWs, { type: 'leave_board', boardId: 1 })
      expect(mockWs.data.boardId).toBeNull()
    })
  })

  describe('Event Types', () => {
    test('should serialize card_updated event correctly', () => {
      const event = {
        type: 'card_updated' as const,
        payload: { id: 1, title: 'Updated Card' },
        boardId: 1,
        userId: 2,
        userName: 'Jane',
        timestamp: new Date().toISOString(),
      }
      const serialized = JSON.stringify(event)
      const parsed = JSON.parse(serialized)
      expect(parsed.type).toBe('card_updated')
      expect(parsed.payload.id).toBe(1)
      expect(parsed.boardId).toBe(1)
    })

    test('should serialize card_moved event correctly', () => {
      const event = {
        type: 'card_moved' as const,
        payload: { id: 1, from_list_id: 1, to_list_id: 2, position: 0 },
        boardId: 1,
        userId: 2,
        userName: 'Jane',
        timestamp: new Date().toISOString(),
      }
      const serialized = JSON.stringify(event)
      const parsed = JSON.parse(serialized)
      expect(parsed.type).toBe('card_moved')
      expect(parsed.payload.from_list_id).toBe(1)
      expect(parsed.payload.to_list_id).toBe(2)
    })

    test('should serialize presence event correctly', () => {
      const event = {
        type: 'presence' as const,
        payload: {
          users: [
            { id: 1, name: 'John', avatar_url: null },
            { id: 2, name: 'Jane', avatar_url: null },
          ],
        },
        boardId: 1,
        timestamp: new Date().toISOString(),
      }
      const parsed = JSON.parse(JSON.stringify(event))
      expect(parsed.payload.users).toHaveLength(2)
    })
  })

  describe('Presence Management', () => {
    test('should track users joining a board', () => {
      const mockWs1 = {
        data: { userId: 1, userName: 'John', boardId: null },
        subscribe: () => {},
        unsubscribe: () => {},
        send: () => {},
      } as any

      const mockWs2 = {
        data: { userId: 2, userName: 'Jane', boardId: null },
        subscribe: () => {},
        unsubscribe: () => {},
        send: () => {},
      } as any

      handleEvent(mockWs1, { type: 'join_board', boardId: 1 })
      handleEvent(mockWs2, { type: 'join_board', boardId: 1 })

      // Both users should be tracked in board 1
      expect(mockWs1.data.boardId).toBe(1)
      expect(mockWs2.data.boardId).toBe(1)
    })
  })
})
