import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as cardService from '../services/cardService'

const cardRoutes = new Hono()

cardRoutes.use('*', authMiddleware)

cardRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.list_id) return c.json({ error: 'list_id is required' }, 400)
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    const card = await cardService.create(body)
    return c.json({ data: card }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.put('/positions', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.cards || !Array.isArray(body.cards)) {
      return c.json({ error: 'cards array is required' }, 400)
    }

    await cardService.updatePositions(body.cards)
    return c.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.put('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    const card = await cardService.update(id, body)
    if (!card) return c.json({ error: 'Card not found' }, 404)

    return c.json({ data: card })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const permanent = c.req.query('permanent') === 'true'
  const card = permanent
    ? await cardService.remove(id)
    : await cardService.update(id, { deleted_at: new Date().toISOString() })
  if (!card) return c.json({ error: 'Card not found' }, 404)

  return c.body(null, 204)
})

export { cardRoutes }
