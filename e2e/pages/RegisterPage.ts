import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto('/')
  }

  async switchToRegister() {
    await this.page.getByRole('button', { name: /register/i }).click()
  }

  async fillEmail(email: string) {
    await this.page.locator('#email-input').fill(email)
  }

  async fillPassword(password: string) {
    await this.page.locator('#password-input').fill(password)
  }

  async submit() {
    await this.page.getByRole('button', { name: /register/i, exact: false }).filter({ has: this.page.locator('[type="submit"]') }).or(this.page.locator('button[type="submit"]')).first().click()
  }

  async register(email: string, password: string) {
    await this.goto()
    await this.switchToRegister()
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  async expectError(text: string | RegExp) {
    await this.page.getByRole('alert').filter({ hasText: text }).waitFor({ state: 'visible', timeout: 5000 })
  }
}
