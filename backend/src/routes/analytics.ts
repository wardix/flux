import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as analyticsService from '../services/analyticsService'

const app = new Hono()

app.use('*', authMiddleware)

app.get('/cards-by-status', async (c) => {
  const boardId = Number(c.req.query('board_id'))
  const period = c.req.query('period') || 'month'
  
  if (!boardId || isNaN(boardId)) {
    return c.json({ error: 'board_id is required' }, 400)
  }

  try {
    const data = await analyticsService.getCardsByStatus(boardId, period)
    return c.json({ data })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch cards by status' }, 500)
  }
})

app.get('/cards-by-member', async (c) => {
  const boardId = Number(c.req.query('board_id'))
  const period = c.req.query('period') || 'month'
  
  if (!boardId || isNaN(boardId)) {
    return c.json({ error: 'board_id is required' }, 400)
  }

  try {
    const data = await analyticsService.getCardsByMember(boardId, period)
    return c.json({ data })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch cards by member' }, 500)
  }
})

app.get('/completion-rate', async (c) => {
  const boardId = Number(c.req.query('board_id'))
  const period = c.req.query('period') || 'month'
  
  if (!boardId || isNaN(boardId)) {
    return c.json({ error: 'board_id is required' }, 400)
  }

  try {
    const data = await analyticsService.getCompletionRate(boardId, period)
    return c.json({ data })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch completion rate' }, 500)
  }
})

app.get('/velocity', async (c) => {
  const boardId = Number(c.req.query('board_id'))
  const period = c.req.query('period') || 'month'
  
  if (!boardId || isNaN(boardId)) {
    return c.json({ error: 'board_id is required' }, 400)
  }

  try {
    const data = await analyticsService.getVelocity(boardId, period)
    return c.json({ data })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch velocity' }, 500)
  }
})

app.get('/summary', async (c) => {
  const boardId = Number(c.req.query('board_id'))
  const period = c.req.query('period') || 'month'
  
  if (!boardId || isNaN(boardId)) {
    return c.json({ error: 'board_id is required' }, 400)
  }

  try {
    const data = await analyticsService.getSummary(boardId, period)
    return c.json({ data })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Failed to fetch summary' }, 500)
  }
})

export const analyticsRoutes = app
