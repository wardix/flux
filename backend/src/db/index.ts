import { SQL } from 'bun'

export const db = new SQL({
  url: process.env.DATABASE_URL || 'postgres://flux_user:secret123@localhost:5432/flux',
})

export async function cleanOldTrash() {
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() - 30)

  await db`DELETE FROM cards WHERE deleted_at < ${limitDate}`
  await db`DELETE FROM lists WHERE deleted_at < ${limitDate}`
  await db`DELETE FROM boards WHERE deleted_at < ${limitDate}`
}
