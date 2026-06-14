import * as path from 'node:path'
import { db } from './index'

async function runMigration() {
  console.log('⏳ Running database migration...')
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    await db.file(schemaPath)
    console.log('✅ Schema migrated successfully.')

    if (process.argv.includes('--seed')) {
      console.log('⏳ Seeding database...')
      const seedPath = path.join(__dirname, 'seed.sql')
      await db.file(seedPath)
      console.log('✅ Database seeded successfully.')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
