import { Hono } from 'hono'

const authRoutes = new Hono()

authRoutes.post('/login', (c) => {
  return c.json({ data: { token: 'mock-token' } })
})

export { authRoutes }
