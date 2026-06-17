import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto('/login')
  }

  async fillEmail(email: string) {
    await this.page.getByLabel(/email/i).fill(email)
  }

  async fillPassword(password: string) {
    await this.page.getByLabel(/password/i).fill(password)
  }

  async submit() {
    await this.page.getByRole('button', { name: /log\s*in|sign\s*in|submit/i }).click()
  }

  async login(email: string, password: string) {
    await this.goto()
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  async expectLoginError() {
    await this.page.getByText(/invalid|error|failed/i).waitFor({ state: 'visible', timeout: 5000 })
  }
}
