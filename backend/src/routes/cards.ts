import { Hono } from 'hono'

const cardRoutes = new Hono()

cardRoutes.get('/', (c) => {
  return c.json({ data: [] })
})

export { cardRoutes }
