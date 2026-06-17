import { test as setup } from '@playwright/test'
import { seedTestData } from './helpers/seed'
import { loginAndSaveState } from './helpers/auth'

setup('migrate, seed and authenticate', async ({ page }) => {
  await seedTestData()
  await loginAndSaveState(page, 'alice@example.com', 'password123', 'e2e/.auth/user.json')
})

