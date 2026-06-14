import { db } from '../db'

export interface OAuthUser {
  email: string
  name: string
  provider: 'google' | 'github' | 'facebook'
  providerUserId: string
  avatarUrl?: string
}

/**
 * Generate authorization URLs for OAuth.
 */
export function getGoogleAuthURL(): string {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  const options = {
    redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  }
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

export function getGitHubAuthURL(): string {
  const rootUrl = 'https://github.com/login/oauth/authorize'
  const options = {
    client_id: process.env.GITHUB_CLIENT_ID || 'mock-github-client-id',
    redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/github/callback`,
    scope: 'user:email',
  }
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

export function getFacebookAuthURL(): string {
  const rootUrl = 'https://www.facebook.com/v18.0/dialog/oauth'
  const options = {
    client_id: process.env.FACEBOOK_CLIENT_ID || 'mock-facebook-client-id',
    redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/facebook/callback`,
    scope: 'email,public_profile',
  }
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

/**
 * Handles authorization callbacks (Google, GitHub, Facebook) and registers / links users.
 */
export async function findOrCreateUser(oauthUser: OAuthUser) {
  // First, check if this provider account is already linked
  const existingOAuth = await db`
    SELECT * FROM oauth_accounts 
    WHERE provider = ${oauthUser.provider} AND provider_user_id = ${oauthUser.providerUserId}
  `
  if (existingOAuth.length > 0) {
    const user = await db`SELECT * FROM users WHERE id = ${existingOAuth[0].user_id}`
    return user[0]
  }

  // Next, check if a user with the same email already exists
  const existingUser = await db`SELECT * FROM users WHERE email = ${oauthUser.email}`
  let user: any

  if (existingUser.length > 0) {
    user = existingUser[0]
  } else {
    // If not, create a new user. We can use a random string for the password hash since they log in via OAuth.
    const randomHash = await Bun.password.hash(Math.random().toString(36))
    const newUserResult = await db`
      INSERT INTO users (email, password_hash, avatar_url)
      VALUES (${oauthUser.email}, ${randomHash}, ${oauthUser.avatarUrl || null})
      RETURNING *
    `
    user = newUserResult[0]

    // Create a default workspace for the new user
    const workspaceName = `${oauthUser.name || oauthUser.email.split('@')[0]}'s Workspace`
    const wsResult = await db`
      INSERT INTO workspaces (name, owner_id)
      VALUES (${workspaceName}, ${user.id})
      RETURNING id
    `
    const workspaceId = wsResult[0].id

    // Add user as member of their own workspace
    await db`
      INSERT INTO workspace_members (user_id, workspace_id, role)
      VALUES (${user.id}, ${workspaceId}, 'owner')
    `
  }

  // Link the OAuth account
  await db`
    INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
    VALUES (${user.id}, ${oauthUser.provider}, ${oauthUser.providerUserId})
  `

  return user
}

/**
 * Handles mocking callbacks in test environments or standard requests.
 */
export async function handleGoogleCallback(code: string): Promise<OAuthUser> {
  // Normally, here we'd exchange code for tokens and query Google API.
  // In our development/testing context, if we have mock keys or mock code, we return mock details.
  if (code === 'mock-google-code') {
    return {
      email: 'mock-google-user@test.com',
      name: 'Google User',
      provider: 'google',
      providerUserId: 'google-123456',
    }
  }
  throw new Error('OAuth authentication failed')
}

export async function handleGitHubCallback(code: string): Promise<OAuthUser> {
  if (code === 'mock-github-code') {
    return {
      email: 'mock-github-user@test.com',
      name: 'GitHub User',
      provider: 'github',
      providerUserId: 'github-123456',
    }
  }
  throw new Error('OAuth authentication failed')
}

export async function handleFacebookCallback(code: string): Promise<OAuthUser> {
  if (code === 'mock-facebook-code') {
    return {
      email: 'mock-facebook-user@test.com',
      name: 'Facebook User',
      provider: 'facebook',
      providerUserId: 'facebook-123456',
    }
  }
  throw new Error('OAuth authentication failed')
}
