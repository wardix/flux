// Store active connections per board
export const boardConnections = new Map<number, Set<any>>()

// Store active connections per chat channel
export const chatConnections = new Map<number, Set<any>>()

export function handleEvent(ws: any, event: any) {
  if (event.type === 'join_board') {
    const boardId = Number(event.boardId)

    // If already on a board, leave it first
    if (ws.data.boardId && ws.data.boardId !== boardId) {
      leaveBoard(ws, ws.data.boardId)
    }

    ws.data.boardId = boardId
    ws.subscribe(`board:${boardId}`)

    if (!boardConnections.has(boardId)) {
      boardConnections.set(boardId, new Set())
    }
    boardConnections.get(boardId)!.add(ws)

    broadcastPresence(boardId)
  } else if (event.type === 'leave_board') {
    const boardId = Number(event.boardId || ws.data.boardId)
    if (boardId) {
      leaveBoard(ws, boardId)
    }
  } else if (event.type === 'join_chat') {
    const channelId = Number(event.channelId)
    if (ws.data.chatChannelId && ws.data.chatChannelId !== channelId) {
      leaveChat(ws, ws.data.chatChannelId)
    }
    ws.data.chatChannelId = channelId
    ws.subscribe(`chat:${channelId}`)
    if (!chatConnections.has(channelId)) {
      chatConnections.set(channelId, new Set())
    }
    chatConnections.get(channelId)!.add(ws)
  } else if (event.type === 'leave_chat') {
    const channelId = Number(event.channelId || ws.data.chatChannelId)
    if (channelId) {
      leaveChat(ws, channelId)
    }
  }
}

export function leaveBoard(ws: any, boardId: number) {
  ws.data.boardId = null
  ws.unsubscribe(`board:${boardId}`)

  const conns = boardConnections.get(boardId)
  if (conns) {
    conns.delete(ws)
    if (conns.size === 0) {
      boardConnections.delete(boardId)
    }
  }

  broadcastPresence(boardId)
}

export function broadcastPresence(boardId: number) {
  const conns = boardConnections.get(boardId)
  const users = Array.from(conns || []).map((conn: any) => ({
    id: conn.data.userId,
    name: conn.data.userName,
    avatar_url: conn.data.avatarUrl || null,
  }))

  // Filter duplicates
  const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values())

  const presenceEvent = {
    type: 'presence' as const,
    payload: { users: uniqueUsers },
    boardId,
    timestamp: new Date().toISOString(),
  }

  broadcastToBoard(boardId, presenceEvent)
}

export function broadcastToBoard(boardId: number, event: any) {
  const conns = boardConnections.get(boardId)
  if (!conns) return
  const msg = JSON.stringify(event)
  for (const ws of conns) {
    try {
      ws.send(msg)
    } catch (err) {
      // ignore closed connections
    }
  }
}

export function leaveChat(ws: any, channelId: number) {
  ws.data.chatChannelId = null
  ws.unsubscribe(`chat:${channelId}`)

  const conns = chatConnections.get(channelId)
  if (conns) {
    conns.delete(ws)
    if (conns.size === 0) {
      chatConnections.delete(channelId)
    }
  }
}

export function broadcastToChat(channelId: number, event: any) {
  const conns = chatConnections.get(channelId)
  if (!conns) return
  const msg = JSON.stringify(event)
  for (const ws of conns) {
    try {
      ws.send(msg)
    } catch (err) {
      // ignore closed connections
    }
  }
}
