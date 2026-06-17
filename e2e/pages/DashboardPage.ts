import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto('/')
  }

  // --- Workspace ---

  async clickAddWorkspace() {
    await this.page.getByTitle('Add Workspace').click()
  }

  async fillWorkspaceName(name: string) {
    await this.page.getByPlaceholder('Workspace name...').fill(name)
  }

  async submitWorkspace() {
    await this.page.locator('form').filter({ hasText: 'Create' }).getByRole('button', { name: 'Create' }).click()
  }

  async createWorkspace(name: string) {
    await this.clickAddWorkspace()
    await this.fillWorkspaceName(name)
    await this.submitWorkspace()
  }

  async selectWorkspace(name: string) {
    // Click dropdown trigger
    await this.page.locator('button').filter({ hasText: /🏢/ }).click()
    await this.page.getByRole('button', { name }).click()
  }

  async getActiveWorkspaceName(): Promise<string> {
    const btn = this.page.locator('button').filter({ hasText: /🏢/ })
    return (await btn.innerText()).replace('🏢', '').replace('▾', '').trim()
  }

  // --- Board ---

  async clickAddBoard() {
    // Click the "+" button next to "Boards" section header
    await this.page.locator('div').filter({ hasText: /^Boards/ }).getByRole('button', { name: '+' }).click()
  }

  async fillBoardName(name: string) {
    await this.page.getByPlaceholder('Board name...').fill(name)
  }

  async submitBoard() {
    await this.page.locator('form').filter({ hasText: 'Create' }).filter({ has: this.page.getByPlaceholder('Board name...') }).getByRole('button', { name: 'Create' }).click()
  }

  async createBoard(name: string) {
    await this.clickAddBoard()
    await this.fillBoardName(name)
    await this.submitBoard()
  }

  async selectBoard(name: string) {
    await this.page.locator('button').filter({ hasText: `📋 ${name}` }).first().click()
  }

  async getBoardNames(): Promise<string[]> {
    const items = this.page.locator('button').filter({ hasText: /📋/ })
    const count = await items.count()
    const names: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).innerText()
      names.push(text.replace('📋', '').replace('☆', '').replace('★', '').trim())
    }
    return names
  }

  async isBoardVisible(name: string): Promise<boolean> {
    const board = this.page.locator('button').filter({ hasText: `📋 ${name}` }).first()
    return board.isVisible({ timeout: 2000 }).catch(() => false)
  }

  // --- Starred Boards ---

  async getStarredBoardNames(): Promise<string[]> {
    const section = this.page.locator('div').filter({ hasText: '★ Starred Boards' })
    if (!(await section.isVisible().catch(() => false))) return []
    const items = section.locator('button').filter({ hasText: /📋/ })
    const count = await items.count()
    const names: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).innerText()
      names.push(text.replace('📋', '').replace('★', '').trim())
    }
    return names
  }
}
