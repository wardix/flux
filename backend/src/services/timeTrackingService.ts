import { db } from '../db'

export async function getActiveTimer(userId: number) {
  const result = await db`
    SELECT tl.*,
      EXTRACT(EPOCH FROM (NOW() - tl.started_at))::INTEGER as elapsed_seconds
    FROM time_logs tl
    WHERE tl.user_id = ${userId} AND tl.is_running = TRUE
    LIMIT 1
  `
  return result[0] || null
}

export async function startTimer(cardId: number, userId: number, description?: string) {
  // Check if there is already a running timer for this user
  const activeTimer = await getActiveTimer(userId)
  if (activeTimer) {
    throw new Error('User already has a running timer')
  }

  const result = await db`
    INSERT INTO time_logs (card_id, user_id, started_at, is_running, description)
    VALUES (${cardId}, ${userId}, NOW(), TRUE, ${description || null})
    RETURNING *
  `
  return {
    ...result[0],
    is_running: true,
  }
}

export async function stopTimer(cardId: number, userId: number) {
  const active = await db`
    SELECT id FROM time_logs
    WHERE card_id = ${cardId} AND user_id = ${userId} AND is_running = TRUE
    LIMIT 1
  `
  if (active.length === 0) {
    return null
  }

  const result = await db`
    UPDATE time_logs
    SET
      ended_at = NOW(),
      is_running = FALSE,
      duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    WHERE id = ${active[0].id}
    RETURNING *
  `
  return {
    ...result[0],
    is_running: false,
  }
}

export async function createManualLog(cardId: number, userId: number, data: {
  started_at: string
  ended_at?: string
  duration_seconds?: number
  description?: string
}) {
  let duration = data.duration_seconds

  if (data.ended_at) {
    const start = new Date(data.started_at).getTime()
    const end = new Date(data.ended_at).getTime()
    if (end < start) {
      throw new Error('ended_at cannot be before started_at')
    }
    if (duration === undefined) {
      duration = Math.round((end - start) / 1000)
    }
  }

  const result = await db`
    INSERT INTO time_logs (card_id, user_id, started_at, ended_at, duration_seconds, description, is_running)
    VALUES (
      ${cardId},
      ${userId},
      ${data.started_at},
      ${data.ended_at || null},
      ${duration || 0},
      ${data.description || null},
      FALSE
    )
    RETURNING *
  `
  return {
    ...result[0],
    is_running: false,
  }
}

export async function getCardTimeLogs(cardId: number) {
  const logs = await db`
    SELECT tl.*, u.email
    FROM time_logs tl
    JOIN users u ON tl.user_id = u.id
    WHERE tl.card_id = ${cardId}
    ORDER BY tl.started_at DESC
  `

  const summary = await db`
    SELECT
      COALESCE(SUM(duration_seconds), 0)::INTEGER as total_duration_seconds,
      COUNT(*)::INTEGER as total_logs
    FROM time_logs
    WHERE card_id = ${cardId} AND is_running = FALSE
  `

  const byUser = await db`
    SELECT
      tl.user_id,
      u.email,
      COALESCE(SUM(tl.duration_seconds), 0)::INTEGER as duration_seconds
    FROM time_logs tl
    JOIN users u ON tl.user_id = u.id
    WHERE tl.card_id = ${cardId} AND tl.is_running = FALSE
    GROUP BY tl.user_id, u.email
    ORDER BY duration_seconds DESC
  `

  return {
    data: logs,
    meta: {
      total_duration_seconds: summary[0]?.total_duration_seconds || 0,
      total_logs: summary[0]?.total_logs || 0,
      by_user: byUser,
    },
  }
}

export async function getTimeLogById(id: number) {
  const result = await db`SELECT * FROM time_logs WHERE id = ${id}`
  return result[0] || null
}

export async function deleteTimeLog(id: number) {
  await db`DELETE FROM time_logs WHERE id = ${id}`
}
