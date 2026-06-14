import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { sign } from 'hono/jwt'
import { db } from '../db'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as twoFactorService from '../services/twoFactorService'

const twoFactorRoutes = new OpenAPIHono()

const setup2FARoute = createRoute({
  method: 'post',
  path: '/setup',
  tags: ['Auth'],
  summary: 'Setup 2FA secret and QR code',
  description: 'Generates a 2FA secret and corresponding QR code URL for the authenticated user.',
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: 'Secret and QR code generated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              secret: z.string().openapi({ example: 'JBSWY3DPEHPK3PXP' }),
              qr_code_url: z.string().openapi({ example: 'data:image/png;base64,...' }),
            }),
          }),
        },
      },
    },
    409: {
      description: '2FA already enabled',
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

const verify2FARoute = createRoute({
  method: 'post',
  path: '/verify',
  tags: ['Auth'],
  summary: 'Verify and enable 2FA',
  description:
    'Verifies the TOTP code against the secret to enable 2FA and returns recovery codes.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            code: z.string().length(6).openapi({ example: '123456' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '2FA enabled successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              enabled: z.boolean().openapi({ example: true }),
              recovery_codes: z.array(z.string()).length(10),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid TOTP code',
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

const disable2FARoute = createRoute({
  method: 'post',
  path: '/disable',
  tags: ['Auth'],
  summary: 'Disable 2FA',
  description: 'Disables 2FA for the authenticated user by verifying a valid TOTP code.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            code: z.string().openapi({ example: '123456' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '2FA disabled successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              enabled: z.boolean().openapi({ example: false }),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid TOTP code or recovery code',
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

const login2FARoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'Verify 2FA login code',
  description: 'Verifies the 2FA TOTP code or a recovery code with a temp token to log in.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            temp_token: z.string().openapi({ example: 'temp-jwt-token' }),
            code: z.string().openapi({ example: '123456' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully authenticated',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              token: z.string().openapi({ example: 'jwt-auth-token' }),
              user: z.object({
                id: z.number(),
                email: z.string(),
              }),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid or expired code or temp token',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

// Authentication middleware applies only to specific endpoints, not /login
twoFactorRoutes.use('/setup', authMiddleware)
twoFactorRoutes.use('/verify', authMiddleware)
twoFactorRoutes.use('/disable', authMiddleware)

// Setup setup2FARoute handler (authenticated)
twoFactorRoutes.openapi(setup2FARoute, async (c) => {
  const userId = c.get('userId')
  const user = await db`SELECT email FROM users WHERE id = ${userId}`
  if (user.length === 0) return c.json({ error: 'User not found' }, 404)
  const email = user[0].email

  // Check if already enabled
  const existing = await db`SELECT * FROM user_2fa WHERE user_id = ${userId}`
  if (existing.length > 0 && existing[0].enabled) {
    return c.json({ error: '2FA already enabled' }, 409)
  }

  const secret = twoFactorService.generateSecret()
  const qrCodeUrl = await twoFactorService.generateQRCode(email, secret)

  if (existing.length > 0) {
    await db`UPDATE user_2fa SET secret = ${secret} WHERE user_id = ${userId}`
  } else {
    await db`INSERT INTO user_2fa (user_id, secret, enabled) VALUES (${userId}, ${secret}, false)`
  }

  return c.json({ data: { secret, qr_code_url: qrCodeUrl } }, 201)
})

// Setup verify2FARoute handler (authenticated)
twoFactorRoutes.openapi(verify2FARoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const code = body.code

  const existing = await db`SELECT * FROM user_2fa WHERE user_id = ${userId}`
  if (existing.length === 0) {
    return c.json({ error: '2FA has not been setup' }, 400)
  }

  const isTotpValid = twoFactorService.verifyTOTP(existing[0].secret, code)
  if (!isTotpValid) {
    return c.json({ error: 'Invalid TOTP code' }, 400)
  }

  const recoveryCodes = twoFactorService.generateRecoveryCodes()
  const hashedRecoveryCodes = await twoFactorService.hashRecoveryCodes(recoveryCodes)

  await db`
    UPDATE user_2fa 
    SET enabled = true, recovery_codes = ${`{${hashedRecoveryCodes.join(',')}}`}
    WHERE user_id = ${userId}
  `

  return c.json(
    {
      data: {
        enabled: true,
        recovery_codes: recoveryCodes,
      },
    },
    200,
  )
})

// Setup disable2FARoute handler (authenticated)
twoFactorRoutes.openapi(disable2FARoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const code = body.code

  const existing = await db`SELECT * FROM user_2fa WHERE user_id = ${userId}`
  if (existing.length === 0 || !existing[0].enabled) {
    return c.json({ error: '2FA is not enabled' }, 400)
  }

  // Code can be either TOTP or a recovery code
  const isTotpValid = twoFactorService.verifyTOTP(existing[0].secret, code)
  let isRecoveryValid = false

  if (!isTotpValid) {
    const recoveryIndex = await twoFactorService.verifyRecoveryCode(
      code,
      existing[0].recovery_codes,
    )
    if (recoveryIndex !== -1) {
      isRecoveryValid = true
      // Remove the used recovery code from the array
      const currentHashed = existing[0].recovery_codes
      currentHashed.splice(recoveryIndex, 1)
      await db`UPDATE user_2fa SET recovery_codes = ${`{${currentHashed.join(',')}}`} WHERE user_id = ${userId}`
    }
  }

  if (!isTotpValid && !isRecoveryValid) {
    return c.json({ error: 'Invalid TOTP code or recovery code' }, 400)
  }

  await db`UPDATE user_2fa SET enabled = false, recovery_codes = '{}' WHERE user_id = ${userId}`

  return c.json(
    {
      data: {
        enabled: false,
      },
    },
    200,
  )
})

// Setup login2FARoute handler (unauthenticated)
twoFactorRoutes.openapi(login2FARoute, async (c) => {
  const body = await c.req.json()
  const { temp_token, code } = body

  if (!temp_token || !code) {
    return c.json({ error: 'temp_token and code are required' }, 400)
  }

  try {
    const { verify } = await import('hono/jwt')
    const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
    const payload = await verify(temp_token, secretKey, 'HS256')

    if (!payload.temp || payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: 'Invalid or expired temporary token' }, 400)
    }

    const userId = Number(payload.sub)
    const existing = await db`SELECT * FROM user_2fa WHERE user_id = ${userId}`
    if (existing.length === 0 || !existing[0].enabled) {
      return c.json({ error: '2FA is not enabled for this user' }, 400)
    }

    const isTotpValid = twoFactorService.verifyTOTP(existing[0].secret, code)
    let isRecoveryValid = false

    if (!isTotpValid) {
      const recoveryIndex = await twoFactorService.verifyRecoveryCode(
        code,
        existing[0].recovery_codes,
      )
      if (recoveryIndex !== -1) {
        isRecoveryValid = true
        // Remove the used recovery code from the array
        const currentHashed = existing[0].recovery_codes
        currentHashed.splice(recoveryIndex, 1)
      }
    }

    if (!isTotpValid && !isRecoveryValid) {
      return c.json({ error: 'Invalid TOTP or recovery code' }, 400)
    }

    // Remove code from array in DB
    if (isRecoveryValid) {
      const currentHashed = existing[0].recovery_codes
      await db`UPDATE user_2fa SET recovery_codes = ${`{${currentHashed.join(',')}}`} WHERE user_id = ${userId}`
    }

    const user = await db`SELECT * FROM users WHERE id = ${userId}`
    const tokenPayload = {
      sub: userId,
      email: user[0].email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    }
    const token = await sign(tokenPayload, secretKey)

    return c.json(
      {
        data: {
          token,
          user: {
            id: user[0].id,
            email: user[0].email,
            avatar_url: user[0].avatar_url,
          },
        },
      },
      200,
    )
  } catch (error) {
    return c.json({ error: 'Invalid or expired temporary token' }, 400)
  }
})

export { twoFactorRoutes }
