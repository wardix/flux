import { describe, test, expect, beforeAll } from 'bun:test'
import { createHmac } from 'crypto'
import { app } from '../../src/index'
import { db } from '../../src/db'

function signPayload(payload: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')
}

describe('POST /api/webhooks/github', () => {
  const webhookSecret = 'test-secret'
  let boardId: number
  let cardId: number

  beforeAll(async () => {
    // Setup db
    const [u] = await db`INSERT INTO users (email, password_hash) VALUES ('test_gh@test.com', 'hash') ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id`
    const [w] = await db`INSERT INTO workspaces (name, owner_id) VALUES ('ws', ${u.id}) RETURNING id`
    const [b] = await db`INSERT INTO boards (title, workspace_id, created_by) VALUES ('b1', ${w.id}, ${u.id}) RETURNING id`
    const [l] = await db`INSERT INTO lists (title, board_id) VALUES ('l1', ${b.id}) RETURNING id`
    const [c] = await db`INSERT INTO cards (title, list_id) VALUES ('test', ${l.id}) RETURNING id`
    cardId = c.id
    boardId = b.id
    await db`INSERT INTO github_installations (board_id, repo_full_name, webhook_secret) VALUES (${boardId}, 'user/repo', ${webhookSecret})`
  })

  test('should process branch creation event', async () => {
    const payload = JSON.stringify({
      ref: `feat/${cardId}-test-card`,
      ref_type: 'branch',
      repository: { full_name: 'user/repo' },
      sender: { login: 'johndoe' },
    })
    const signature = signPayload(payload, webhookSecret)

    const res = await app.request('/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'create',
        'X-Hub-Signature-256': signature,
      },
      body: payload,
    })
    if (res.status !== 200) console.log(await res.text())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.processed).toBeDefined()
  })

  test('should process pull request opened event', async () => {
    const payload = JSON.stringify({
      action: 'opened',
      pull_request: {
        number: 1,
        title: 'feat: test feature',
        state: 'open',
        html_url: 'https://github.com/user/repo/pull/1',
        head: { ref: `feat/${cardId}-test-card` },
        merged: false,
      },
      repository: { full_name: 'user/repo' },
    })
    const signature = signPayload(payload, webhookSecret)

    const res = await app.request('/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'pull_request',
        'X-Hub-Signature-256': signature,
      },
      body: payload,
    })
    expect(res.status).toBe(200)
  })

  test('should process pull request merged event', async () => {
    const payload = JSON.stringify({
      action: 'closed',
      pull_request: {
        number: 1,
        title: 'feat: test feature',
        state: 'closed',
        html_url: 'https://github.com/user/repo/pull/1',
        head: { ref: `feat/${cardId}-test-card` },
        merged: true,
        merged_at: '2026-01-16T10:00:00Z',
      },
      repository: { full_name: 'user/repo' },
    })
    const signature = signPayload(payload, webhookSecret)

    const res = await app.request('/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'pull_request',
        'X-Hub-Signature-256': signature,
      },
      body: payload,
    })
    expect(res.status).toBe(200)
  })

  test('should return 401 for invalid signature', async () => {
    const payload = JSON.stringify({ ref: 'main', ref_type: 'branch', repository: { full_name: 'user/repo' } })

    const res = await app.request('/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'create',
        'X-Hub-Signature-256': 'sha256=invalidsignature',
      },
      body: payload,
    })
    expect(res.status).toBe(401)
  })

  test('should return 200 for unrecognized event', async () => {
    const payload = JSON.stringify({ action: 'created', repository: { full_name: 'user/repo' } })
    const signature = signPayload(payload, webhookSecret)

    const res = await app.request('/api/webhooks/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': 'issues',
        'X-Hub-Signature-256': signature,
      },
      body: payload,
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.processed).toBe(false)
  })
})
