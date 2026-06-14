import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { listRoutes } from './routes/lists'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('Flux API is running!')
})

app.route('/api/auth', authRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/lists', listRoutes)
app.route('/api/cards', cardRoutes)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
