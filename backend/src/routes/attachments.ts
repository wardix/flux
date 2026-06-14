import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as attachmentService from '../services/attachmentService'
import { ErrorSchema } from '../lib/schemas'

const attachmentRoutes = new OpenAPIHono()

const getAttachmentsRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/attachments',
  tags: ['Cards'],
  summary: 'Get attachments of a card',
  description: 'Get all file attachments associated with a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of attachments',
      content: {
        'application/json': {
          schema: z.array(z.any()),
        },
      },
    },
    400: {
      description: 'Invalid card ID',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const createAttachmentRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/attachments',
  tags: ['Cards'],
  summary: 'Upload attachment',
  description: 'Upload a file attachment to a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    201: {
      description: 'Attachment uploaded successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid parameters or missing file',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const deleteAttachmentRoute = createRoute({
  method: 'delete',
  path: '/cards/{cardId}/attachments/{attachmentId}',
  tags: ['Cards'],
  summary: 'Delete attachment',
  description: 'Delete a file attachment from a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      attachmentId: z.string().openapi({ example: '2' }),
    }),
  },
  responses: {
    204: {
      description: 'Attachment deleted successfully',
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Attachment not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const setCoverRoute = createRoute({
  method: 'put',
  path: '/cards/{cardId}/attachments/{attachmentId}/cover',
  tags: ['Cards'],
  summary: 'Set card cover',
  description: 'Set or unset an attachment as the card cover image',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      attachmentId: z.string().openapi({ example: '2' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            is_cover: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Cover status updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Invalid parameters',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Attachment not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

attachmentRoutes.use('/cards/*', authMiddleware)

attachmentRoutes.openapi(getAttachmentsRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const result = await attachmentService.getAttachments(cardId)
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

attachmentRoutes.openapi(createAttachmentRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)

    const user = c.get('user')
    const userId = user?.id

    const body = await c.req.parseBody()
    const file = body.file as File | undefined

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    const fileBuffer = await file.arrayBuffer()
    const filename = `${Date.now()}-${file.name}`
    
    // We upload to frontend/public/uploads in dev, let's construct the absolute path.
    const uploadsDir = path.resolve(__dirname, '../../../frontend/public/uploads')
    
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, filename)
    await Bun.write(filePath, fileBuffer)

    const publicUrl = `/uploads/${filename}`

    const attachment = await attachmentService.createAttachment(cardId, {
      name: file.name,
      file_path: publicUrl,
      file_type: file.type,
      size: file.size,
      uploaded_by: userId,
    })

    return c.json({ data: attachment }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

attachmentRoutes.openapi(deleteAttachmentRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const attachmentId = Number(c.req.param('attachmentId'))
    if (Number.isNaN(cardId) || Number.isNaN(attachmentId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }

    const result = await attachmentService.deleteAttachment(cardId, attachmentId)
    if (!result) return c.json({ error: 'Attachment not found' }, 404)

    // Optional: Delete physical file if possible.
    try {
      if (result.file_path.startsWith('/uploads/')) {
        const physicalPath = path.resolve(__dirname, '../../../frontend/public', result.file_path.replace(/^\//, ''))
        await fs.unlink(physicalPath).catch(() => {})
      }
    } catch (_) {}

    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

attachmentRoutes.openapi(setCoverRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const attachmentId = Number(c.req.param('attachmentId'))
    if (Number.isNaN(cardId) || Number.isNaN(attachmentId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }

    const body = await c.req.json()
    const isCover = typeof body.is_cover === 'boolean' ? body.is_cover : false

    const result = await attachmentService.setCover(cardId, attachmentId, isCover)
    if (!result) return c.json({ error: 'Attachment not found' }, 404)

    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { attachmentRoutes }
