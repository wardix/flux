import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'

const docsRoutes = new OpenAPIHono()

docsRoutes.get(
  '/',
  apiReference({
    spec: { url: '/api/docs/openapi.json' },
    theme: 'default',
    pageTitle: 'Flux API Documentation',
  }),
)

export { docsRoutes }
