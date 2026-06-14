import { useEffect, useRef, useState } from 'react'
import type { PresenceUser, WSEvent } from '../lib/types'

interface UseWebSocketOptions {
  boardId: number
  onEvent: (event: WSEvent) => void
  enabled?: boolean
}

interface UseWebSocketReturn {
  isConnected: boolean
  onlineUsers: PresenceUser[]
  reconnectAttempts: number
}

const INITIAL_DELAY = 1000
const MAX_DELAY = 30000
const BACKOFF_FACTOR = 2

export function useWebSocket({
  boardId,
  onEvent,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<any>(null)
  const onEventRef = useRef(onEvent)

  // Keep latest onEvent to avoid socket re-creation on handler updates
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled || !boardId) {
      if (socketRef.current) {
        socketRef.current.close()
      }
      return
    }

    let attempt = 0
    let isMounted = true

    function connect() {
      if (!isMounted) return

      const token = localStorage.getItem('token')
      if (!token) return

      // Determine WS URL
      const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws'
      const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`

      const ws = new WebSocket(wsUrl)
      socketRef.current = ws

      ws.onopen = () => {
        if (!isMounted) return
        setIsConnected(true)
        attempt = 0
        setReconnectAttempts(0)
        ws.send(JSON.stringify({ type: 'join_board', boardId }))
      }

      ws.onmessage = (event) => {
        if (!isMounted) return
        try {
          const wsEvent = JSON.parse(event.data) as WSEvent
          if (wsEvent.type === 'presence') {
            setOnlineUsers(wsEvent.payload.users || [])
          } else {
            onEventRef.current(wsEvent)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        if (!isMounted) return
        setIsConnected(false)
        setOnlineUsers([])

        // Exponential backoff reconnect
        const delay = Math.min(INITIAL_DELAY * BACKOFF_FACTOR ** attempt, MAX_DELAY)
        setReconnectAttempts(attempt + 1)

        reconnectTimeoutRef.current = setTimeout(() => {
          attempt++
          connect()
        }, delay)
      }

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err)
        ws.close()
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'leave_board', boardId }))
        }
        socketRef.current.close()
      }
    }
  }, [boardId, enabled])

  return {
    isConnected,
    onlineUsers,
    reconnectAttempts,
  }
}
