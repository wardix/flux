import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { cleanOldTrash } from './db'
import { authRoutes } from './routes/auth'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { labelRoutes } from './routes/labels'
import { listRoutes } from './routes/lists'
import { subtaskRoutes } from './routes/subtasks'
import { workspaceRoutes } from './routes/workspaces'
import { docsRoutes } from './routes/docs'
import { apiDoc } from './lib/openapi'

// Trigger database old trash clean up on server startup
cleanOldTrash().catch((err) => console.error('Trash cleanup failed:', err))

const app = new OpenAPIHono()

app.use('*', cors())

app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: err.message, stack: err.stack }, 500)
})

app.get('/', (c) => {
  return c.text('Flux API is running!')
})

// Register bearerAuth security component first
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

// Setup OpenAPI specification registry doc
app.doc('/api/docs/openapi.json', apiDoc)

// Mount route handlers
app.route('/api/docs', docsRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/lists', listRoutes)
app.route('/api/cards', cardRoutes)
app.route('/api/workspaces', workspaceRoutes)
app.route('/api/labels', labelRoutes)
app.route('/api', subtaskRoutes)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
