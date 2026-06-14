import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as boardService from '../services/boardService'

const boardRoutes = new Hono()

boardRoutes.use('*', authMiddleware)

boardRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const boards = await boardService.getAll(userId)
  return c.json({ data: boards })
})

boardRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const board = await boardService.getById(id)
  if (!board) return c.json({ error: 'Board not found' }, 404)

  return c.json({ data: board })
})

boardRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const userId = c.get('userId')
    const board = await boardService.create(userId, body)
    return c.json({ data: board }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.put('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    const board = await boardService.update(id, body)
    if (!board) return c.json({ error: 'Board not found' }, 404)

    return c.json({ data: board })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

boardRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const board = await boardService.remove(id)
  if (!board) return c.json({ error: 'Board not found' }, 404)

  return c.body(null, 204)
})

export { boardRoutes }
