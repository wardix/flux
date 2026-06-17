import { test as base, type Page } from '@playwright/test'

type Fixtures = {
  authenticatedPage: Page
  adminPage: Page
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    // Admin uses same auth state for now (alice is owner)
    const context = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
