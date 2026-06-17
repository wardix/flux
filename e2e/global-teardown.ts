import { test as teardown } from '@playwright/test'

teardown('cleanup test environment', async () => {
  console.log('🧹 Test run complete. Cleanup skipped (data is ephemeral in test DB).')
})
