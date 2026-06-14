import { handleEvent, leaveBoard } from './events'

export const websocket = {
  open(ws: any) {
    console.log(`WebSocket connected: User ${ws.data.userId}`)
  },
  message(ws: any, message: string) {
    try {
      const event = JSON.parse(message)
      handleEvent(ws, event)
    } catch (err) {
      console.error('WebSocket message parsing error:', err)
    }
  },
  close(ws: any) {
    console.log(`WebSocket disconnected: User ${ws.data.userId}`)
    if (ws.data.boardId) {
      leaveBoard(ws, ws.data.boardId)
    }
  },
}
