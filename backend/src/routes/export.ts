import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as exportService from '../services/exportService'

const exportRoutes = new OpenAPIHono()

exportRoutes.use('/export/*', authMiddleware)

const exportBoardRoute = createRoute({
  method: 'get',
  path: '/export/{boardId}',
  tags: ['Export'],
  summary: 'Export board data (JSON/CSV)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
    query: z.object({
      format: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Board exported successfully',
    },
    400: {
      description: 'Invalid format',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Board not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

exportRoutes.openapi(exportBoardRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const format = c.req.query('format')
  if (format !== 'json' && format !== 'csv') {
    return c.json({ error: 'Invalid format. Must be "json" or "csv"' }, 400)
  }

  const userId = c.get('userId')

  if (format === 'json') {
    const data = await exportService.exportBoardJSON(boardId, userId)
    if (!data) return c.json({ error: 'Board not found' }, 404)
    return c.json({ data }, 200)
  } else {
    const csvContent = await exportService.exportBoardCSV(boardId, userId)
    if (csvContent === null) return c.json({ error: 'Board not found' }, 404)

    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="board-${boardId}-export.csv"`)
    return c.body(csvContent, 200)
  }
})

export { exportRoutes }
