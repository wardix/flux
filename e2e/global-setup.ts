import { test as setup } from '@playwright/test'
import { seedTestData } from './helpers/seed'
import { loginAndSaveState } from './helpers/auth'

setup('migrate and seed database', async () => {
  await seedTestData()
})

setup('authenticate as default user', async ({ page }) => {
  await loginAndSaveState(page, 'alice@example.com', 'password123', 'e2e/.auth/user.json')
})
