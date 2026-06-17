import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class WorkspacePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async getWorkspaceNames(): Promise<string[]> {
    // Open the workspace dropdown
    await this.page.locator('button').filter({ hasText: /🏢/ }).click()
    
    const items = this.page.locator('.dropdown-content button')
    const count = await items.count()
    const names: string[] = []
    for (let i = 0; i < count; i++) {
      names.push((await items.nth(i).innerText()).trim())
    }
    
    // Close dropdown by pressing Escape
    await this.page.keyboard.press('Escape')
    return names
  }

  async selectWorkspace(name: string) {
    await this.page.locator('button').filter({ hasText: /🏢/ }).click()
    await this.page.locator('.dropdown-content button').filter({ hasText: name }).click()
  }
}
