import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as brandingService from '../services/brandingService'

const brandingRoutes = new OpenAPIHono()

// Apply authentication middleware
brandingRoutes.use('*', authMiddleware)

// Helper to check workspace permission
async function checkAdminPermission(c: any, workspaceId: number) {
  const userId = c.get('userId')
  const ok = await brandingService.isAdmin(userId, workspaceId)
  return ok
}

// 1. GET /api/workspaces/:workspaceId/branding
const getBrandingRoute = createRoute({
  method: 'get',
  path: '/{workspaceId}/branding',
  tags: ['Branding'],
  summary: 'Get workspace branding config',
  request: {
    params: z.object({
      workspaceId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Workspace branding config',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              id: z.number(),
              workspace_id: z.number(),
              app_name: z.string(),
              logo_url: z.string().nullable(),
              favicon_url: z.string().nullable(),
              primary_color: z.string(),
              secondary_color: z.string(),
              custom_domain: z.string().nullable(),
              custom_css: z.string().nullable(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Branding not configured',
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
  },
})

brandingRoutes.openapi(getBrandingRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) {
    return c.json({ error: 'Invalid workspace ID' }, 400)
  }

  const branding = await brandingService.getBranding(workspaceId)
  if (!branding) {
    return c.json({ error: 'Branding not configured' }, 404)
  }

  return c.json({ data: branding }, 200)
})

// 2. PUT /api/workspaces/:workspaceId/branding
const updateBrandingRoute = createRoute({
  method: 'put',
  path: '/{workspaceId}/branding',
  tags: ['Branding'],
  summary: 'Update workspace branding config',
  request: {
    params: z.object({
      workspaceId: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            app_name: z.string().optional(),
            primary_color: z.string().optional(),
            secondary_color: z.string().optional(),
            custom_domain: z.string().nullable().optional(),
            custom_css: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Branding updated',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

brandingRoutes.openapi(updateBrandingRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) {
    return c.json({ error: 'Invalid workspace ID' }, 400)
  }

  const isAllowed = await checkAdminPermission(c, workspaceId)
  if (!isAllowed) {
    return c.json({ error: 'Only workspace admin can update branding' }, 403)
  }

  const body = await c.req.json().catch(() => ({}))

  if (body.primary_color && !brandingService.validateColorHex(body.primary_color)) {
    return c.json({ error: 'Invalid color format. Use hex (e.g., #2563EB)' }, 400)
  }
  if (body.secondary_color && !brandingService.validateColorHex(body.secondary_color)) {
    return c.json({ error: 'Invalid color format. Use hex (e.g., #2563EB)' }, 400)
  }

  const updated = await brandingService.upsertBranding(workspaceId, body)
  return c.json({ data: updated }, 200)
})

// 3. POST /api/workspaces/:workspaceId/branding/logo
const uploadLogoRoute = createRoute({
  method: 'post',
  path: '/{workspaceId}/branding/logo',
  tags: ['Branding'],
  summary: 'Upload logo image',
  request: {
    params: z.object({
      workspaceId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Logo uploaded',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              logo_url: z.string(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

brandingRoutes.openapi(uploadLogoRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) {
    return c.json({ error: 'Invalid workspace ID' }, 400)
  }

  const isAllowed = await checkAdminPermission(c, workspaceId)
  if (!isAllowed) {
    return c.json({ error: 'Only workspace admin can update branding' }, 403)
  }

  const body = await c.req.parseBody()
  const file = body.file as File | undefined
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  if (file.size > 2 * 1024 * 1024) {
    return c.json({ error: 'File too large. Maximum 2MB' }, 400)
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Allowed: png, jpg, jpeg, svg' }, 400)
  }

  const fileBuffer = await file.arrayBuffer()
  const ext = path.extname(file.name) || (file.type === 'image/svg+xml' ? '.svg' : '.png')
  const filename = `ws-${workspaceId}-logo-${Math.floor(Date.now() / 1000)}${ext}`

  const uploadsDir = path.resolve(__dirname, '../../../frontend/public/uploads/logos')
  await fs.mkdir(uploadsDir, { recursive: true })
  const filePath = path.join(uploadsDir, filename)
  await Bun.write(filePath, fileBuffer)

  const publicUrl = `/uploads/logos/${filename}`
  await brandingService.updateLogoUrl(workspaceId, publicUrl)

  return c.json({ data: { logo_url: publicUrl } }, 200)
})

// 4. POST /api/workspaces/:workspaceId/branding/favicon
const uploadFaviconRoute = createRoute({
  method: 'post',
  path: '/{workspaceId}/branding/favicon',
  tags: ['Branding'],
  summary: 'Upload favicon image',
  request: {
    params: z.object({
      workspaceId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Favicon uploaded',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              favicon_url: z.string(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

brandingRoutes.openapi(uploadFaviconRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) {
    return c.json({ error: 'Invalid workspace ID' }, 400)
  }

  const isAllowed = await checkAdminPermission(c, workspaceId)
  if (!isAllowed) {
    return c.json({ error: 'Only workspace admin can update branding' }, 403)
  }

  const body = await c.req.parseBody()
  const file = body.file as File | undefined
  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  if (file.size > 500 * 1024) {
    return c.json({ error: 'File too large. Maximum 500KB' }, 400)
  }

  const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
    return c.json({ error: 'Invalid file type. Allowed: ico, png, jpg, jpeg' }, 400)
  }

  const fileBuffer = await file.arrayBuffer()
  const ext = file.name.endsWith('.ico') ? '.ico' : path.extname(file.name) || '.png'
  const filename = `ws-${workspaceId}-favicon-${Math.floor(Date.now() / 1000)}${ext}`

  const uploadsDir = path.resolve(__dirname, '../../../frontend/public/uploads/favicons')
  await fs.mkdir(uploadsDir, { recursive: true })
  const filePath = path.join(uploadsDir, filename)
  await Bun.write(filePath, fileBuffer)

  const publicUrl = `/uploads/favicons/${filename}`
  await brandingService.updateFaviconUrl(workspaceId, publicUrl)

  return c.json({ data: { favicon_url: publicUrl } }, 200)
})

// 5. DELETE /api/workspaces/:workspaceId/branding
const deleteBrandingRoute = createRoute({
  method: 'delete',
  path: '/{workspaceId}/branding',
  tags: ['Branding'],
  summary: 'Reset workspace branding to default',
  request: {
    params: z.object({
      workspaceId: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    204: {
      description: 'Branding reset successfully',
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

brandingRoutes.openapi(deleteBrandingRoute, async (c) => {
  const workspaceId = Number(c.req.param('workspaceId'))
  if (Number.isNaN(workspaceId)) {
    return c.json({ error: 'Invalid workspace ID' }, 400)
  }

  const isAllowed = await checkAdminPermission(c, workspaceId)
  if (!isAllowed) {
    return c.json({ error: 'Only workspace admin can update branding' }, 403)
  }

  await brandingService.deleteBranding(workspaceId)
  return c.body(null, 204)
})

export { brandingRoutes }
