import { execSync } from 'node:child_process'
import * as path from 'node:path'

const BACKEND_DIR = path.resolve(__dirname, '../../backend')

export async function seedTestData(): Promise<void> {
  console.log('⏳ Running database migration...')
  try {
    execSync('bun run db:migrate', {
      cwd: BACKEND_DIR,
      stdio: 'pipe',
      env: { ...process.env },
    })
    console.log('✅ Migration complete')
  } catch (err: any) {
    console.error('❌ Migration failed:', err.stderr?.toString() || err.message)
    throw err
  }

  console.log('⏳ Seeding test data...')
  try {
    execSync('bun run db:seed', {
      cwd: BACKEND_DIR,
      stdio: 'pipe',
      env: { ...process.env },
    })
    console.log('✅ Seed complete')
  } catch (err: any) {
    // Seed may fail if data already exists (unique constraints), that's OK
    const stderr = err.stderr?.toString() || ''
    if (stderr.includes('duplicate') || stderr.includes('already exists')) {
      console.log('⚠️ Seed skipped (data already exists)')
    } else {
      console.error('❌ Seed failed:', stderr || err.message)
      throw err
    }
  }
}
