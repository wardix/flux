import type { Page, Locator } from '@playwright/test'

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path = '/') {
    await this.page.goto(path)
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async getByTestId(testId: string): Promise<Locator> {
    return this.page.getByTestId(testId)
  }

  async clickButton(name: string) {
    await this.page.getByRole('button', { name }).click()
  }

  async fillInput(label: string, value: string) {
    await this.page.getByLabel(label).fill(value)
  }

  async expectToast(message: string) {
    await this.page.getByText(message).waitFor({ state: 'visible', timeout: 5000 })
  }

  async expectUrl(path: string) {
    await this.page.waitForURL(`**${path}`, { timeout: 5000 })
  }
}
