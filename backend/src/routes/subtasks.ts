import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as subtaskService from '../services/subtaskService'

const subtaskRoutes = new Hono()

subtaskRoutes.use('*', authMiddleware)

subtaskRoutes.get('/cards/:id/subtasks', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid card ID' }, 400)

    const result = await subtaskService.getSubtasks(id)
    return c.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

subtaskRoutes.post('/cards/:id/subtasks', async (c) => {
  try {
    const parentCardId = Number(c.req.param('id'))
    if (Number.isNaN(parentCardId)) return c.json({ error: 'Invalid card ID' }, 400)

    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const subtask = await subtaskService.createSubtask(parentCardId, body)
    return c.json({ data: subtask }, 201)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return c.json({ error: 'Parent card not found' }, 404)
      }
      if (error.message === 'NESTING_DEPTH_EXCEEDED') {
        return c.json({ error: 'Cannot nest subtasks deeper than nesting depth 1' }, 400)
      }
      return c.json({ error: error.message }, 500)
    }
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subtaskRoutes.put('/cards/:cardId/subtasks/:subtaskId', async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const subtaskId = Number(c.req.param('subtaskId'))
    if (Number.isNaN(cardId) || Number.isNaN(subtaskId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }

    const body = await c.req.json()
    const result = await subtaskService.updateSubtask(cardId, subtaskId, body)
    if (!result) return c.json({ error: 'Subtask not found' }, 404)

    return c.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

subtaskRoutes.delete('/cards/:cardId/subtasks/:subtaskId', async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const subtaskId = Number(c.req.param('subtaskId'))
    if (Number.isNaN(cardId) || Number.isNaN(subtaskId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }

    const result = await subtaskService.removeSubtask(cardId, subtaskId)
    if (!result) return c.json({ error: 'Subtask not found' }, 404)

    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { subtaskRoutes }
