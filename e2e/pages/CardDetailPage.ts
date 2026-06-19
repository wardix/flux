import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class CardDetailPage extends BasePage {
  private modalBox: any

  constructor(page: Page) {
    super(page)
    this.modalBox = this.page.locator('.modal-box').filter({ hasText: /Card Details|Edit Card/i })
  }

  // --- Title & Description ---

  async fillTitle(title: string) {
    const titleInput = this.modalBox.locator('input[type="text"]').first()
    await titleInput.fill(title)
  }

  async fillDescription(description: string) {
    const editor = this.modalBox.locator('.tiptap.ProseMirror')
    await editor.click()
    // Select all and delete before typing, or just fill
    await editor.fill(description)
  }

  async save() {
    await this.modalBox.getByRole('button', { name: 'Save', exact: true }).click()
  }

  async cancel() {
    await this.modalBox.getByRole('button', { name: 'Cancel', exact: true }).click()
  }

  async close() {
    await this.modalBox.locator('button:has-text("✕")').first().click()
  }

  // --- Labels ---

  async toggleLabel(name: string) {
    await this.modalBox
      .locator('button')
      .filter({ hasText: new RegExp(`^${name}$`, 'i') })
      .click()
  }

  // --- Due Date ---

  async setDueDate(dateString: string) {
    const input = this.modalBox.locator('input[type="date"]').first()
    await input.fill(dateString)
  }

  // --- Member Assignment ---

  async assignMember(email: string) {
    const select = this.modalBox.locator('select').first()
    const option = select.locator('option').filter({ hasText: email })
    const value = await option.getAttribute('value')
    if (value) {
      await select.selectOption(value)
    }
  }

  // --- Checklist ---

  async addChecklist(title: string) {
    await this.page.locator('.modal-box').getByPlaceholder('New Checklist title...').fill(title)
    await this.page.locator('.modal-box').getByRole('button', { name: /Add Checklist/i }).click()
  }

  async addChecklistItem(checklistTitle: string, itemTitle: string) {
    const checklistSection = this.page
      .locator('.modal-box div.rounded-xl')
      .filter({ hasText: `📋 ${checklistTitle}` })
      .first()
    await checklistSection.getByPlaceholder('Add item...').fill(itemTitle)
    await checklistSection.getByRole('button', { name: 'Add', exact: true }).click()
  }

  async toggleChecklistItem(checklistTitle: string, itemTitle: string) {
    const checklistSection = this.page
      .locator('.modal-box div.rounded-xl')
      .filter({ hasText: `📋 ${checklistTitle}` })
      .first()
    const itemRow = checklistSection.locator('.group').filter({ hasText: itemTitle }).first()
    await itemRow.locator('input[type="checkbox"]').click()
  }

  // --- Comment ---

  async addComment(content: string) {
    await this.page.locator('.modal-box').getByPlaceholder('Tulis komentar...').fill(content)
    await this.page.locator('.modal-box').getByRole('button', { name: 'Kirim' }).click()
  }

  async getComments(): Promise<string[]> {
    const commentsLocator = this.modalBox.locator('p.break-words')
    const count = await commentsLocator.count()
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      list.push((await commentsLocator.nth(i).innerText()).trim())
    }
    return list
  }

  // --- Activity Log ---

  async getActivityLogs(): Promise<string[]> {
    // Activities are rendered via CardActivities.tsx
    // Let's locate the list of activities
    const logsLocator = this.modalBox
      .locator('div')
      .filter({ hasText: 'Aktivitas' })
      .locator('p')
    const count = await logsLocator.count()
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      list.push((await logsLocator.nth(i).innerText()).trim())
    }
    return list
  }

  // --- Story Points ---

  async setStoryPoints(points: number) {
    await this.modalBox
      .locator('button')
      .filter({ hasText: new RegExp(`^${points}$`) })
      .first()
      .click()
  }

  // --- Subtasks ---

  async addSubtask(title: string) {
    await this.page.locator('.modal-box').getByRole('button', { name: '+ Add sub-task' }).click()
    await this.page.locator('.modal-box').getByPlaceholder('Add a subtask...').fill(title)
    await this.page.locator('.modal-box').getByRole('button', { name: 'Add', exact: true }).click()
  }

  async getSubtasksList(): Promise<string[]> {
    const subtaskSpan = this.modalBox.locator('span[role="button"]')
    const count = await subtaskSpan.count()
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      list.push((await subtaskSpan.nth(i).innerText()).trim())
    }
    return list
  }

  // --- Archive ---

  async archive() {
    await this.page
      .locator('.modal-box')
      .getByRole('button', { name: /Archive/i })
      .first()
      .click()
  }
}
