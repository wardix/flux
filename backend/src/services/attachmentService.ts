import { db } from '../db'

export async function getAttachments(cardId: number) {
  return await db`
    SELECT * FROM attachments
    WHERE card_id = ${cardId}
    ORDER BY created_at DESC
  `
}

export async function createAttachment(
  cardId: number,
  data: {
    name: string
    file_path: string
    file_type: string
    size: number
    uploaded_by?: number
  },
) {
  const result = await db`
    INSERT INTO attachments (card_id, name, file_path, file_type, size, uploaded_by, is_cover)
    VALUES (${cardId}, ${data.name}, ${data.file_path}, ${data.file_type}, ${data.size}, ${data.uploaded_by || null}, FALSE)
    RETURNING *
  `
  return result[0]
}

export async function deleteAttachment(cardId: number, attachmentId: number) {
  const result = await db`
    DELETE FROM attachments
    WHERE id = ${attachmentId} AND card_id = ${cardId}
    RETURNING *
  `
  return result[0] || null
}

export async function setCover(cardId: number, attachmentId: number, isCover: boolean) {
  // Check if attachment exists for this card
  const attachments = await db`
    SELECT * FROM attachments WHERE id = ${attachmentId} AND card_id = ${cardId}
  `
  if (attachments.length === 0) return null

  if (isCover) {
    // Unset current cover
    await db`
      UPDATE attachments
      SET is_cover = FALSE
      WHERE card_id = ${cardId}
    `
  }

  const result = await db`
    UPDATE attachments
    SET is_cover = ${isCover}, updated_at = NOW()
    WHERE id = ${attachmentId} AND card_id = ${cardId}
    RETURNING *
  `
  return result[0] || null
}
