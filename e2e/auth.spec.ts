import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

test.describe('Auth Flows', () => {
  // --- Register Tests ---

  test('TC1: Register with email & password → redirect to dashboard', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const uniqueEmail = `e2e-register-${Date.now()}@example.com`

    await registerPage.register(uniqueEmail, 'testpass123')

    // Should be logged in — token in localStorage
    await page.waitForFunction(() => localStorage.getItem('token') !== null, { timeout: 10000 })
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()
  })

  test('TC2: Register with existing email → shows error', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    // alice@example.com already exists from seed
    await registerPage.register('alice@example.com', 'testpass123')

    await registerPage.expectError(/already registered|Registration failed/i)
  })

  test('TC3: Register with password < 6 chars → shows validation error', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const uniqueEmail = `e2e-short-${Date.now()}@example.com`

    await registerPage.register(uniqueEmail, '123')

    await registerPage.expectError(/at least 6 characters/i)
  })

  // --- Login Tests ---

  test('TC4: Login with valid credentials → shows dashboard with boards', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.login('alice@example.com', 'password123')

    await loginPage.expectLoggedIn()

    // Dashboard should show some content (boards, sidebar, etc.)
    await page.waitForTimeout(1000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('TC5: Login with wrong email → shows error', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.login('nonexistent@example.com', 'password123')

    await loginPage.expectError(/invalid email or password/i)
  })

  test('TC6: Login with wrong password → shows error', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.login('alice@example.com', 'wrongpassword')

    await loginPage.expectError(/invalid email or password/i)
  })

  // --- Session Tests ---

  test('TC7: Session persists after page refresh', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // Login first
    await loginPage.login('alice@example.com', 'password123')
    await loginPage.expectLoggedIn()

    // Refresh the page
    await page.reload()

    // Should still be logged in (token persists in localStorage)
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()

    // Should not see login form
    const loginForm = page.locator('#email-input')
    await expect(loginForm).not.toBeVisible({ timeout: 3000 })
  })

  test('TC8: Logout → redirect to login, token removed', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // Login first
    await loginPage.login('alice@example.com', 'password123')
    await loginPage.expectLoggedIn()
    await page.waitForTimeout(500)

    // Click logout button
    await page.getByText('Log Out').click()

    // Token should be removed
    await page.waitForFunction(() => localStorage.getItem('token') === null, { timeout: 5000 })

    // Should see login form again
    const emailInput = page.locator('#email-input')
    await expect(emailInput).toBeVisible({ timeout: 5000 })
  })

  test('TC9: Access protected page without login → shows login page', async ({ page }) => {
    // Clear any existing token
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('token'))

    // Navigate to app root
    await page.goto('/')

    // Should see login form (not dashboard)
    const emailInput = page.locator('#email-input')
    await expect(emailInput).toBeVisible({ timeout: 5000 })
  })
})
