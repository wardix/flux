import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { authRoutes } from './routes/auth'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('Flux API is running!')
})

app.route('/api/auth', authRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/cards', cardRoutes)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
