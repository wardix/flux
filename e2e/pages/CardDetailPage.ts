import type { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class CardDetailPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  // --- Title & Description ---

  async fillTitle(title: string) {
    const titleInput = this.page.locator('.modal-box input[type="text"]').first()
    await titleInput.fill(title)
  }

  async fillDescription(description: string) {
    const editor = this.page.locator('.modal-box .tiptap.ProseMirror')
    await editor.click()
    // Select all and delete before typing, or just fill
    await editor.fill(description)
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click()
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel', exact: true }).click()
  }

  async close() {
    await this.page.getByRole('button', { name: '✕', exact: true }).click()
  }

  // --- Labels ---

  async toggleLabel(name: string) {
    await this.page
      .locator('.modal-box button')
      .filter({ hasText: new RegExp(`^${name}$`, 'i') })
      .click()
  }

  // --- Due Date ---

  async setDueDate(dateString: string) {
    const input = this.page.locator('.modal-box input[type="date"]').first()
    await input.fill(dateString)
  }

  // --- Member Assignment ---

  async assignMember(email: string) {
    const select = this.page.locator('.modal-box select').first()
    await select.selectOption({ label: new RegExp(email, 'i') })
  }

  // --- Checklist ---

  async addChecklist(title: string) {
    await this.page.getByPlaceholder('New Checklist title...').fill(title)
    await this.page.getByRole('button', { name: /Add Checklist/i }).click()
  }

  async addChecklistItem(checklistTitle: string, itemTitle: string) {
    const checklistSection = this.page
      .locator('.modal-box div')
      .filter({ hasText: `📋 ${checklistTitle}` })
      .first()
    await checklistSection.getByPlaceholder('Add item...').fill(itemTitle)
    await checklistSection.getByRole('button', { name: 'Add' }).click()
  }

  async toggleChecklistItem(checklistTitle: string, itemTitle: string) {
    const checklistSection = this.page
      .locator('.modal-box div')
      .filter({ hasText: `📋 ${checklistTitle}` })
      .first()
    const itemRow = checklistSection.locator('div').filter({ hasText: itemTitle }).first()
    await itemRow.locator('input[type="checkbox"]').click()
  }

  // --- Comment ---

  async addComment(content: string) {
    await this.page.getByPlaceholder('Tulis komentar...').fill(content)
    await this.page.getByRole('button', { name: 'Kirim' }).click()
  }

  async getComments(): Promise<string[]> {
    const commentsLocator = this.page.locator('.modal-box p.break-words')
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
    const logsLocator = this.page
      .locator('.modal-box div')
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
    await this.page
      .locator('.modal-box button')
      .filter({ hasText: new RegExp(`^${points}$`) })
      .first()
      .click()
  }

  // --- Subtasks ---

  async addSubtask(title: string) {
    await this.page.getByRole('button', { name: '+ Add sub-task' }).click()
    await this.page.getByPlaceholder('Add a subtask...').fill(title)
    await this.page.getByRole('button', { name: 'Add' }).click()
  }

  async getSubtasksList(): Promise<string[]> {
    const subtaskSpan = this.page.locator('.modal-box span[role="button"]')
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
      .getByRole('button', { name: /Archive/i })
      .first()
      .click()
  }
}
