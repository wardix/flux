import { Hono } from 'hono'
import { db } from '../db'
import { extractCardIdFromBranch, verifyGitHubSignature } from '../lib/githubHelpers'

export const githubWebhookRoutes = new Hono()

githubWebhookRoutes.post('/', async (c) => {
  const signature = c.req.header('X-Hub-Signature-256')
  const event = c.req.header('X-GitHub-Event')
  
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 401)
  }

  const payloadString = await c.req.text()
  let payload: any
  try {
    payload = JSON.parse(payloadString)
  } catch (err) {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const repoFullName = payload.repository?.full_name
  if (!repoFullName) {
    return c.json({ error: 'Repository not found in payload' }, 400)
  }

  // Find installations for this repo
  const installations = await db`
    SELECT * FROM github_installations WHERE repo_full_name = ${repoFullName}
  `

  if (installations.length === 0) {
    // We don't track this repo, just return 200
    return c.json({ processed: false })
  }

  // Verify signature using the first matching installation's secret
  // (In a real app with multiple boards tracking same repo, we might need to check multiple, 
  // but let's assume the payload matches if at least one installation verifies it)
  let verified = false
  for (const inst of installations) {
    if (verifyGitHubSignature(payloadString, signature, inst.webhook_secret)) {
      verified = true
      break
    }
  }

  if (!verified) {
    return c.json({ 
      error: 'Invalid signature', 
      debug_signature: signature,
      debug_payload_len: payloadString.length,
      debug_secret: installations[0].webhook_secret 
    }, 401)
  }

  let processed = false

  // Process Event
  if (event === 'create') {
    if (payload.ref_type === 'branch') {
      const branchName = payload.ref
      const cardId = extractCardIdFromBranch(branchName)
      if (cardId) {
        processed = true
        // Create link
        await db`
          INSERT INTO github_links (card_id, type, title, url, state)
          VALUES (${cardId}, 'branch', ${branchName}, ${'https://github.com/' + repoFullName + '/tree/' + branchName}, 'open')
          ON CONFLICT (card_id, type, url) DO NOTHING
        `
        // Move card to In Progress
        for (const inst of installations) {
          if (inst.in_progress_list_id) {
            // Check if card belongs to this board before moving
            const [card] = await db`SELECT c.id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = ${cardId} AND l.board_id = ${inst.board_id}`
            if (card) {
              await db`UPDATE cards SET list_id = ${inst.in_progress_list_id}, updated_at = CURRENT_TIMESTAMP WHERE id = ${cardId}`
            }
          }
        }
      }
    }
  } else if (event === 'pull_request') {
    const pr = payload.pull_request
    const branchName = pr.head.ref
    const cardId = extractCardIdFromBranch(branchName)
    
    if (cardId) {
      processed = true
      const state = pr.merged ? 'merged' : pr.state // 'open', 'closed'
      
      // Upsert link
      await db`
        INSERT INTO github_links (card_id, type, github_id, title, url, state)
        VALUES (${cardId}, 'pull_request', ${pr.number.toString()}, ${pr.title}, ${pr.html_url}, ${state})
        ON CONFLICT (card_id, type, url) DO UPDATE SET
          state = EXCLUDED.state,
          title = EXCLUDED.title,
          updated_at = CURRENT_TIMESTAMP
      `

      for (const inst of installations) {
        // Check board
        const [card] = await db`SELECT c.id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = ${cardId} AND l.board_id = ${inst.board_id}`
        if (!card) continue

        if (payload.action === 'opened' || payload.action === 'reopened') {
          if (inst.review_list_id) {
            await db`UPDATE cards SET list_id = ${inst.review_list_id}, updated_at = CURRENT_TIMESTAMP WHERE id = ${cardId}`
          }
        } else if (payload.action === 'closed' && pr.merged) {
          if (inst.done_list_id) {
            await db`UPDATE cards SET list_id = ${inst.done_list_id}, updated_at = CURRENT_TIMESTAMP WHERE id = ${cardId}`
          }
        }
      }
    }
  }

  // GitHub expects 200 OK
  return c.json({ processed })
})
