import { Hono } from 'hono'

const boardRoutes = new Hono()

boardRoutes.get('/', (c) => {
  return c.json({ data: [] })
})

export { boardRoutes }
