import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as listService from '../services/listService'

const listRoutes = new Hono()

listRoutes.use('*', authMiddleware)

listRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.board_id) return c.json({ error: 'board_id is required' }, 400)
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const list = await listService.create(body)
    return c.json({ data: list }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

listRoutes.put('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    const list = await listService.update(id, body)
    if (!list) return c.json({ error: 'List not found' }, 404)

    return c.json({ data: list })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

listRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const list = await listService.remove(id)
  if (!list) return c.json({ error: 'List not found' }, 404)

  return c.body(null, 204)
})

export { listRoutes }
