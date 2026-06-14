import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { labelRoutes } from './routes/labels'
import { listRoutes } from './routes/lists'
import { workspaceRoutes } from './routes/workspaces'

const app = new Hono()

app.use('*', cors())

app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: err.message, stack: err.stack }, 500)
})

app.get('/', (c) => {
  return c.text('Flux API is running!')
})

app.route('/api/auth', authRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/lists', listRoutes)
app.route('/api/cards', cardRoutes)
app.route('/api/workspaces', workspaceRoutes)
app.route('/api/labels', labelRoutes)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
