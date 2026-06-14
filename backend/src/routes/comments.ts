import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as commentService from '../services/commentService'
import { ErrorSchema } from '../lib/schemas'

const commentRoutes = new OpenAPIHono()

const getCommentsRoute = createRoute({
  method: 'get',
  path: '/cards/{id}/comments',
  tags: ['Cards'],
  summary: 'Get comments of a card',
  description: 'Get all comments associated with a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'List of comments',
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

const createCommentRoute = createRoute({
  method: 'post',
  path: '/cards/{id}/comments',
  tags: ['Cards'],
  summary: 'Create comment',
  description: 'Add a new comment to a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.string().min(1).openapi({ example: 'Great progress!' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Comment created successfully',
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

const updateCommentRoute = createRoute({
  method: 'put',
  path: '/cards/{cardId}/comments/{commentId}',
  tags: ['Cards'],
  summary: 'Update comment',
  description: 'Update the content of a comment (only by the owner)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      commentId: z.string().openapi({ example: '2' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.string().min(1).openapi({ example: 'Updated comment text' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Comment updated successfully',
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
      description: 'Comment not found or unauthorized',
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

const deleteCommentRoute = createRoute({
  method: 'delete',
  path: '/cards/{cardId}/comments/{commentId}',
  tags: ['Cards'],
  summary: 'Delete comment',
  description: 'Delete a comment from a card (only by the owner)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string().openapi({ example: '1' }),
      commentId: z.string().openapi({ example: '2' }),
    }),
  },
  responses: {
    204: {
      description: 'Comment deleted successfully',
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
      description: 'Comment not found or unauthorized',
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

commentRoutes.use('*', authMiddleware)

commentRoutes.openapi(getCommentsRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    const result = await commentService.getComments(cardId)
    return c.json(result, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

commentRoutes.openapi(createCommentRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('id'))
    if (Number.isNaN(cardId)) return c.json({ error: 'Invalid card ID' }, 400)
    
    const userId = c.get('userId')
    const body = await c.req.json()
    if (!body.content) return c.json({ error: 'Content is required' }, 400)
    
    const result = await commentService.createComment(cardId, userId, body.content)
    return c.json({ data: result }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

commentRoutes.openapi(updateCommentRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const commentId = Number(c.req.param('commentId'))
    if (Number.isNaN(cardId) || Number.isNaN(commentId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }
    
    const userId = c.get('userId')
    const body = await c.req.json()
    if (!body.content) return c.json({ error: 'Content is required' }, 400)
    
    const result = await commentService.updateComment(cardId, commentId, userId, body.content)
    if (!result) return c.json({ error: 'Comment not found or unauthorized' }, 404)
    return c.json({ data: result }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

commentRoutes.openapi(deleteCommentRoute, async (c) => {
  try {
    const cardId = Number(c.req.param('cardId'))
    const commentId = Number(c.req.param('commentId'))
    if (Number.isNaN(cardId) || Number.isNaN(commentId)) {
      return c.json({ error: 'Invalid parameters' }, 400)
    }
    
    const userId = c.get('userId')
    const result = await commentService.deleteComment(cardId, commentId, userId)
    if (!result) return c.json({ error: 'Comment not found or unauthorized' }, 404)
    return c.body(null, 204)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

export { commentRoutes }
