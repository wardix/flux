import { SQL } from 'bun'

export const db = new SQL({
  url: process.env.DATABASE_URL || 'postgres://flux_user:secret123@localhost:5432/flux',
})
