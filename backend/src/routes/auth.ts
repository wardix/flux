import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as authService from '../services/authService'

const authRoutes = new Hono()

authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const user = await authService.register(body.email, body.password)
    return c.json({ data: user }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'Email already registered') {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: message }, 500)
  }
})

authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const result = await authService.login(body.email, body.password)
    return c.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'Invalid email or password') {
      return c.json({ error: message }, 401)
    }
    return c.json({ error: message }, 500)
  }
})

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await authService.getMe(userId)
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ data: user })
})

export { authRoutes }
