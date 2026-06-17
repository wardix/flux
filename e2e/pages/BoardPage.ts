import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class BoardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // --- Board Header ---

  async getBoardTitle(): Promise<string> {
    const heading = this.page.locator('header h2').first()
    return (await heading.innerText()).trim()
  }

  async clickStar() {
    await this.page.locator('header button').filter({ hasText: /[★☆]/ }).first().click()
  }

  async isStarred(): Promise<boolean> {
    const starBtn = this.page.locator('header button').filter({ hasText: /[★☆]/ }).first()
    const text = await starBtn.innerText()
    return text.includes('★')
  }

  // --- Board Visibility ---

  async openVisibilityDropdown() {
    await this.page.locator('header button').filter({ hasText: /👁️/ }).click()
  }

  async setVisibility(visibility: 'Private' | 'Workspace Only' | 'Public') {
    await this.openVisibilityDropdown()
    await this.page.getByRole('button', { name: visibility, exact: true }).click()
  }

  async getVisibility(): Promise<string> {
    const btn = this.page.locator('header button').filter({ hasText: /👁️/ })
    return (await btn.innerText()).replace('👁️', '').trim().toLowerCase()
  }

  // --- Delete Board ---

  async deleteBoard() {
    await this.openVisibilityDropdown()
    this.page.once('dialog', (dialog) => dialog.accept())
    await this.page.getByRole('button', { name: /Delete Board/i }).click()
  }

  // --- Board Background ---

  async openBackgroundPicker() {
    await this.page
      .getByTitle('Change Background')
      .or(this.page.locator('button').filter({ hasText: /🎨/ }))
      .first()
      .click()
  }

  async selectBackgroundColor(color: string) {
    await this.openBackgroundPicker()
    await this.page.locator(`button[style*="${color}"], button[title*="${color}"]`).first().click()
  }

  async getBoardBackground(): Promise<string | null> {
    const main = this.page.locator('main').first()
    const style = await main.getAttribute('style')
    return style
  }

  // --- List Management ---

  async getListTitles(): Promise<string[]> {
    const lists = this.page.locator('[data-list-id] h3')
    const count = await lists.count()
    const titles: string[] = []
    for (let i = 0; i < count; i++) {
      const text = await lists.nth(i).innerText()
      // Strip count and points: "Title (3) • 5 pts" → "Title"
      titles.push(text.split('(')[0].trim())
    }
    return titles
  }

  async clickAddList() {
    await this.page.getByRole('button', { name: /\+ Add List/i }).click()
  }

  async fillListTitle(title: string) {
    await this.page.getByPlaceholder('Enter list title...').fill(title)
  }

  async submitList() {
    await this.page
      .locator('form')
      .filter({ has: this.page.getByPlaceholder('Enter list title...') })
      .getByRole('button', { name: 'Add List' })
      .click()
  }

  async addList(title: string) {
    await this.clickAddList()
    await this.fillListTitle(title)
    await this.submitList()
  }

  async openListMenu(listTitle: string) {
    const list = this.page.locator('[data-list-id]').filter({ hasText: listTitle })
    await list.getByTitle('Column Options').click()
  }

  async deleteList(listTitle: string) {
    await this.openListMenu(listTitle)
    await this.page.getByRole('button', { name: /Delete List/i }).click()
  }

  async archiveList(listTitle: string) {
    await this.openListMenu(listTitle)
    await this.page.getByRole('button', { name: /Archive List/i }).click()
  }

  // --- Archive ---

  async openArchive() {
    await this.page.getByRole('button', { name: /📦 Archive/i }).click()
  }

  async restoreListFromArchive(listTitle: string) {
    const archiveSection = this.page.locator('div').filter({ hasText: 'Archived Items' })
    await archiveSection
      .getByRole('button', { name: /Restore/i })
      .filter({ hasText: listTitle })
      .or(
        archiveSection
          .locator('div')
          .filter({ hasText: listTitle })
          .getByRole('button', { name: /Restore/i }),
      )
      .first()
      .click()
  }

  // --- Card Management ---

  async clickAddCard(listTitle: string) {
    const list = this.page.locator('[data-list-id]').filter({ hasText: listTitle }).first()
    await list.locator('[data-list-add-card]').click()
  }

  async fillCardTitle(listTitle: string, title: string) {
    const list = this.page.locator('[data-list-id]').filter({ hasText: listTitle }).first()
    await list.getByPlaceholder('Enter card title...').fill(title)
  }

  async submitCard(listTitle: string) {
    const list = this.page.locator('[data-list-id]').filter({ hasText: listTitle }).first()
    await list.getByRole('button', { name: 'Add' }).click()
  }

  async addCard(listTitle: string, title: string) {
    await this.clickAddCard(listTitle)
    await this.fillCardTitle(listTitle, title)
    await this.submitCard(listTitle)
  }

  async clickCard(title: string) {
    await this.page.locator('[data-card-id]').filter({ hasText: title }).first().click()
  }

  async isCardVisible(listTitle: string, cardTitle: string): Promise<boolean> {
    const list = this.page.locator('[data-list-id]').filter({ hasText: listTitle }).first()
    return await list
      .locator('[data-card-id]')
      .filter({ hasText: cardTitle })
      .first()
      .isVisible()
      .catch(() => false)
  }

  async deleteCard(cardTitle: string) {
    const card = this.page.locator('[data-card-id]').filter({ hasText: cardTitle }).first()
    await card.hover()
    await card.getByTitle('Delete Card').click()
  }

  async restoreCardFromArchive(cardTitle: string) {
    const archiveSection = this.page.locator('div').filter({ hasText: 'Archived Items' }).first()
    await archiveSection
      .getByRole('button', { name: /Restore/i })
      .filter({ hasText: cardTitle })
      .first()
      .click()
  }
}
