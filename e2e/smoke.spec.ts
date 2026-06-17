import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('app loads and shows login or dashboard', async ({ page }) => {
    await page.goto('/')

    // App should load — either redirect to login or show dashboard
    await expect(page).toHaveTitle(/.+/)

    // Page should have some visible content (not a blank page)
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Should see either login form or app content
    const hasContent = await page.locator('button, input, a, h1, h2').first().isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('API health check', async ({ request }) => {
    const apiBase = process.env.API_URL || 'http://localhost:3000'
    const response = await request.get(`${apiBase}/api/auth/login`, {
      failOnStatusCode: false,
    })

    // Should get a response (even if 405 method not allowed for GET)
    expect([200, 400, 404, 405]).toContain(response.status())
  })
})
