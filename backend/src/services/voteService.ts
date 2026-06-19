import { db } from '../db'

export async function toggleVote(cardId: number, userId: number) {
  // Check if card exists
  const cards = await db`SELECT id FROM cards WHERE id = ${cardId} AND deleted_at IS NULL`
  if (cards.length === 0) {
    throw new Error('Card not found')
  }

  const existing = await db`
    SELECT 1 FROM card_votes WHERE card_id = ${cardId} AND user_id = ${userId}
  `
  let voted = false
  if (existing.length > 0) {
    await db`
      DELETE FROM card_votes WHERE card_id = ${cardId} AND user_id = ${userId}
    `
  } else {
    await db`
      INSERT INTO card_votes (card_id, user_id) VALUES (${cardId}, ${userId})
    `
    voted = true
  }

  const countRes = await db`
    SELECT COUNT(*)::INTEGER as count FROM card_votes WHERE card_id = ${cardId}
  `
  const voteCount = countRes[0].count

  return {
    voted,
    vote_count: voteCount,
    user_voted: voted,
  }
}

export async function getVotes(cardId: number, userId: number) {
  const countRes = await db`
    SELECT COUNT(*)::INTEGER as count FROM card_votes WHERE card_id = ${cardId}
  `
  const voteCount = countRes[0].count

  const userVotedRes = await db`
    SELECT 1 FROM card_votes WHERE card_id = ${cardId} AND user_id = ${userId}
  `
  const userVoted = userVotedRes.length > 0

  const voters = await db`
    SELECT u.id, u.email as name, u.avatar_url, cv.created_at as voted_at
    FROM card_votes cv
    JOIN users u ON cv.user_id = u.id
    WHERE cv.card_id = ${cardId}
    ORDER BY cv.created_at DESC
  `

  return {
    vote_count: voteCount,
    user_voted: userVoted,
    voters: voters,
  }
}

export async function getVoteCountsBatch(cardIds: number[]) {
  if (cardIds.length === 0) return []
  const cardIdsStr = `{${cardIds.join(',')}}`
  const results = await db`
    SELECT card_id, COUNT(*)::INTEGER as count
    FROM card_votes
    WHERE card_id = ANY(${cardIdsStr}::int[])
    GROUP BY card_id
  `
  return results
}

export async function getUserVotesBatch(cardIds: number[], userId: number) {
  if (cardIds.length === 0) return []
  const cardIdsStr = `{${cardIds.join(',')}}`
  const results = await db`
    SELECT card_id
    FROM card_votes
    WHERE card_id = ANY(${cardIdsStr}::int[]) AND user_id = ${userId}
  `
  return results.map((r) => Number(r.card_id))
}
