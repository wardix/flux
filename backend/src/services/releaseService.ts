import { db } from '../db'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

export async function getReleases(boardId: number) {
  return await db`
    SELECT * FROM releases
    WHERE board_id = ${boardId}
    ORDER BY created_at DESC
  `
}

export async function getPublicChangelog(boardId: number) {
  return await db`
    SELECT * FROM releases
    WHERE board_id = ${boardId} AND status = 'published'
    ORDER BY published_at DESC
  `
}

export async function getReleaseById(id: number, boardId: number) {
  const [release] = await db`
    SELECT * FROM releases
    WHERE id = ${id} AND board_id = ${boardId}
  `
  if (!release) return null

  const items = await db`
    SELECT ri.*, c.title as card_title, c.is_completed
    FROM release_items ri
    LEFT JOIN cards c ON ri.card_id = c.id
    WHERE ri.release_id = ${id}
  `
  return { ...release, items }
}

export async function createRelease(boardId: number, userId: number, data: { version: string, title: string, items: any[] }) {
  // Check for duplicate version
  const [existing] = await db`SELECT id FROM releases WHERE board_id = ${boardId} AND version = ${data.version}`
  if (existing) {
    throw new Error('DUPLICATE_VERSION')
  }

  // Generate markdown body
  let body = `# v${data.version}\n\n**${data.title}**\n\n`
  const categorized = data.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, any[]>)

  for (const [cat, items] of Object.entries(categorized)) {
    body += `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}s\n`
    for (const item of items) {
      body += `- ${item.summary}\n`
    }
    body += `\n`
  }

  // Convert to HTML
  const rawHtml = await marked(body)
  const bodyHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']),
  })

  return await db.begin(async (tx) => {
    const [release] = await tx`
      INSERT INTO releases (board_id, version, title, body, body_html, created_by)
      VALUES (${boardId}, ${data.version}, ${data.title}, ${body}, ${bodyHtml}, ${userId})
      RETURNING *
    `

    const itemsToInsert = data.items.map(item => ({
      release_id: release.id,
      card_id: item.card_id,
      category: item.category,
      summary: item.summary
    }))

    if (itemsToInsert.length > 0) {
      for (const item of itemsToInsert) {
        await tx`
          INSERT INTO release_items (release_id, card_id, category, summary)
          VALUES (${item.release_id}, ${item.card_id}, ${item.category}, ${item.summary})
        `
      }
    }

    const items = await tx`SELECT * FROM release_items WHERE release_id = ${release.id}`
    return { ...release, items }
  })
}

export async function generateRelease(boardId: number, userId: number, data: { version: string, title: string, from_date: string, to_date: string }) {
  // Fetch completed cards in date range
  const cards = await db`
    SELECT c.id, c.title
    FROM cards c
    WHERE c.list_id IN (SELECT id FROM lists WHERE board_id = ${boardId})
      AND c.is_completed = true
      AND c.updated_at >= ${data.from_date}::timestamptz
      AND c.updated_at <= ${data.to_date}::timestamptz
  `

  const items = cards.map(c => ({
    card_id: c.id,
    category: 'feature', // Default to feature
    summary: c.title
  }))

  return await createRelease(boardId, userId, { version: data.version, title: data.title, items })
}

export async function updateRelease(id: number, boardId: number, data: { title?: string, body?: string }) {
  let bodyHtml = undefined
  if (data.body) {
    const rawHtml = await marked(data.body)
    bodyHtml = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']),
    })
  }

  const [release] = await db`
    UPDATE releases
    SET 
      title = COALESCE(${data.title ?? null}, title),
      body = COALESCE(${data.body ?? null}, body),
      body_html = COALESCE(${bodyHtml ?? null}, body_html),
      updated_at = NOW()
    WHERE id = ${id} AND board_id = ${boardId}
    RETURNING *
  `
  return release
}

export async function publishRelease(id: number, boardId: number) {
  const [release] = await db`
    UPDATE releases
    SET status = 'published', published_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND board_id = ${boardId}
    RETURNING *
  `
  return release
}

export async function deleteRelease(id: number, boardId: number) {
  const [release] = await db`
    DELETE FROM releases
    WHERE id = ${id} AND board_id = ${boardId}
    RETURNING *
  `
  return release
}

export function markdownToHtml(markdown: string) {
  const rawHtml = marked(markdown)
  return sanitizeHtml(rawHtml as string, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2']),
  })
}
