import { Page } from '@playwright/test'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

export async function login(page: Page, email: string, password: string): Promise<string> {
  const response = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  })

  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`)
  }

  const body = await response.json()
  return body.data.token
}

export async function loginAndSaveState(
  page: Page,
  email: string,
  password: string,
  statePath: string,
): Promise<void> {
  const token = await login(page, email, password)

  // Navigate to app and set token in localStorage
  await page.goto('/')
  await page.evaluate((t) => {
    localStorage.setItem('token', t)
  }, token)

  // Reload to pick up the token
  await page.goto('/')

  // Save storage state for reuse
  await page.context().storageState({ path: statePath })
}

export async function registerUser(
  page: Page,
  email: string,
  password: string,
): Promise<string> {
  const response = await page.request.post(`${API_BASE}/api/auth/register`, {
    data: { email, password },
  })

  if (!response.ok()) {
    throw new Error(`Register failed for ${email}: ${response.status()} ${await response.text()}`)
  }

  const body = await response.json()
  return body.data.token
}
