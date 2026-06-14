import argon2 from 'argon2'
import { sign } from 'hono/jwt'
import { db } from '../db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'

export async function register(email: string, password: string) {
  const existing = await db`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    throw new Error('Email already registered')
  }

  const passwordHash = await argon2.hash(password)
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`

  const result = await db`
    INSERT INTO users (email, password_hash, avatar_url)
    VALUES (${email}, ${passwordHash}, ${avatarUrl})
    RETURNING id, email, avatar_url, created_at
  `
  return result[0]
}

export async function login(email: string, password: string) {
  const users = await db`SELECT * FROM users WHERE email = ${email}`
  if (users.length === 0) {
    throw new Error('Invalid email or password')
  }

  const user = users[0]
  const isValid = await argon2.verify(user.password_hash, password)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  // Check if 2FA is enabled for the user
  const user2fa = await db`SELECT enabled FROM user_2fa WHERE user_id = ${user.id}`
  if (user2fa.length > 0 && user2fa[0].enabled) {
    // Generate a temporary 5-minute token
    const tempPayload = {
      sub: user.id,
      email: user.email,
      temp: true,
      exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
    }
    const tempToken = await sign(tempPayload, JWT_SECRET)
    return {
      requires_2fa: true,
      temp_token: tempToken,
    }
  }

  const payload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }

  const token = await sign(payload, JWT_SECRET)

  return {
    user: {
      id: user.id,
      email: user.email,
      avatar_url: user.avatar_url,
    },
    token,
  }
}

export async function getMe(userId: number) {
  const users = await db`SELECT id, email, avatar_url, is_super_admin, is_suspended, created_at FROM users WHERE id = ${userId}`
  return users[0] || null
}
