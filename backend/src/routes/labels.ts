import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as labelService from '../services/labelService'

const labelRoutes = new Hono()

labelRoutes.use('*', authMiddleware)

labelRoutes.get('/', async (c) => {
  const boardId = Number(c.req.query('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'boardId query parameter is required' }, 400)

  const labels = await labelService.getByBoardId(boardId)
  return c.json({ data: labels })
})

labelRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.board_id || !body.name || !body.color) {
      return c.json({ error: 'board_id, name, and color are required' }, 400)
    }

    const label = await labelService.create(body.board_id, body.name, body.color)
    return c.json({ data: label }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

labelRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const label = await labelService.remove(id)
  if (!label) return c.json({ error: 'Label not found' }, 404)

  return c.body(null, 204)
})

labelRoutes.post('/card/:cardId', async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid cardId' }, 400)

    const body = await c.req.json()
    if (!body.label_id) return c.json({ error: 'label_id is required' }, 400)

    const association = await labelService.assignToCard(cardId, body.label_id)
    return c.json({ data: association }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

labelRoutes.delete('/card/:cardId/:labelId', async (c) => {
  const cardId = Number(c.req.param('cardId'))
  const labelId = Number(c.req.param('labelId'))
  if (Number.isNaN(cardId) || Number.isNaN(labelId)) return c.json({ error: 'Invalid IDs' }, 400)

  await labelService.unassignFromCard(cardId, labelId)
  return c.body(null, 204)
})

export { labelRoutes }
