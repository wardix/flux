import { db } from '../db'

export interface Webhook {
  id: number
  board_id: number
  url: string
  secret: string | null
  is_active: boolean
  created_at: Date
}

export async function createWebhook(
  boardId: number,
  url: string,
  secret?: string,
): Promise<Webhook> {
  const [webhook] = await db`
    INSERT INTO webhooks (board_id, url, secret)
    VALUES (${boardId}, ${url}, ${secret || null})
    RETURNING *
  `
  return webhook as unknown as Webhook
}

export async function listWebhooks(boardId: number): Promise<Webhook[]> {
  const webhooks = await db`
    SELECT * FROM webhooks
    WHERE board_id = ${boardId}
    ORDER BY created_at DESC
  `
  return webhooks as unknown as Webhook[]
}

export async function deleteWebhook(boardId: number, id: number): Promise<boolean> {
  const res = await db`
    DELETE FROM webhooks
    WHERE id = ${id} AND board_id = ${boardId}
    RETURNING id
  `
  return res.length > 0
}

export async function triggerWebhooks(boardId: number, event: string, payload: any): Promise<void> {
  const webhooks = await db`
    SELECT url, secret FROM webhooks
    WHERE board_id = ${boardId} AND is_active = true
  `

  for (const wh of webhooks) {
    // Fire webhook asynchronously
    fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Flux-Event': event,
        ...(wh.secret ? { 'X-Flux-Signature': wh.secret } : {}),
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    }).catch((err) => {
      console.error(`Webhook call failed for URL: ${wh.url}`, err)
    })
  }
}
