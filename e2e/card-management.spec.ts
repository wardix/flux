import { expect, test } from '@playwright/test'
import { BoardPage } from './pages/BoardPage'
import { CardDetailPage } from './pages/CardDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'

test.describe('Card Management E2E', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let boardPage: BoardPage
  let cardDetailPage: CardDetailPage
  let boardName: string
  let listName: string

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    boardPage = new BoardPage(page)
    cardDetailPage = new CardDetailPage(page)

    // Login
    await loginPage.login('alice@example.com', 'password123')
    await loginPage.expectLoggedIn()
    await page.waitForTimeout(1000)

    // Setup: Create a board and a list for testing
    boardName = `Card Board ${Date.now()}`
    await dashboardPage.createBoard(boardName)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(boardName)
    await page.waitForTimeout(500)

    listName = `List Alpha`
    await boardPage.addList(listName)
    await page.waitForTimeout(500)
  })

  test('TC1-TC4: Card Basic CRUD (Create, Read detail, Update title/description, Delete)', async ({
    page,
  }) => {
    const cardTitle = `Card Basic ${Date.now()}`
    const updatedTitle = `Card Basic Updated ${Date.now()}`
    const cardDesc = `Initial description of the card.`
    const updatedDesc = `This is the updated card description.`

    // 1. Create card
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)
    expect(await boardPage.isCardVisible(listName, cardTitle)).toBeTruthy()

    // 2. Open detail modal
    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)
    await expect(page.locator('.modal-box')).toBeVisible()

    // 3. Edit title & description
    await cardDetailPage.fillTitle(updatedTitle)
    await cardDetailPage.fillDescription(updatedDesc)
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Verify changes are saved (title updated in view)
    expect(await boardPage.isCardVisible(listName, updatedTitle)).toBeTruthy()

    // Reopen to verify description
    await boardPage.clickCard(updatedTitle)
    await page.waitForTimeout(500)
    const editorContent = await page.locator('.modal-box .tiptap.ProseMirror').innerText()
    expect(editorContent).toContain(updatedDesc)
    await cardDetailPage.close()
    await page.waitForTimeout(500)

    // 4. Delete card
    await boardPage.deleteCard(updatedTitle)
    await page.waitForTimeout(500)
    expect(await boardPage.isCardVisible(listName, updatedTitle)).toBeFalsy()
  })

  test('TC5: Add label to card → label appears in preview', async ({ page }) => {
    const cardTitle = `Card Label ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Let's toggle the label 'bug' or any default label
    await cardDetailPage.toggleLabel('bug')
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Check that label color/badge is visible on card preview
    // Standard label names are styled with capital letters and uppercase
    const badge = page
      .locator('[data-card-id]')
      .filter({ hasText: cardTitle })
      .locator('span')
      .filter({ hasText: /BUG/i })
    await expect(badge).toBeVisible()
  })

  test('TC6: Set due date → date shows in card, status indicator checked', async ({ page }) => {
    const cardTitle = `Card Date ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Set due date to today
    const today = new Date().toISOString().split('T')[0]
    await cardDetailPage.setDueDate(today)
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Date badge should display on card preview
    const dateBadge = page
      .locator('[data-card-id]')
      .filter({ hasText: cardTitle })
      .locator('.badge-ghost')
    await expect(dateBadge).toBeVisible()
  })

  test('TC7: Assign member → avatar appears in preview', async ({ page }) => {
    const cardTitle = `Card Assignee ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Assign alice
    await cardDetailPage.assignMember('alice@example.com')
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Avatar container should appear
    const avatar = page.locator('[data-card-id]').filter({ hasText: cardTitle }).locator('.avatar')
    await expect(avatar).toBeVisible()
  })

  test('TC8-TC9: Checklists (Add checklist, add items, check progress)', async ({ page }) => {
    const cardTitle = `Card Checklist ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Add Checklist
    await cardDetailPage.addChecklist('Tasks')
    await page.waitForTimeout(500)

    // Add Items
    await cardDetailPage.addChecklistItem('Tasks', 'Item 1')
    await page.waitForTimeout(200)
    await cardDetailPage.addChecklistItem('Tasks', 'Item 2')
    await page.waitForTimeout(500)

    // Verify items exist
    const item1 = page.locator('.modal-box').getByText('Item 1')
    const item2 = page.locator('.modal-box').getByText('Item 2')
    await expect(item1).toBeVisible()
    await expect(item2).toBeVisible()

    // Toggle item and see progress
    await cardDetailPage.toggleChecklistItem('Tasks', 'Item 1')
    await page.waitForTimeout(500)

    const progress = page.locator('.modal-box progress')
    await expect(progress).toHaveAttribute('value', '1')

    await cardDetailPage.close()
  })

  test('TC10-TC11: Comments & Activity Log', async ({ page }) => {
    const cardTitle = `Card Comments ${Date.now()}`
    const commentMsg = `E2E Comment ${Date.now()}`

    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Add comment
    await cardDetailPage.addComment(commentMsg)
    await page.waitForTimeout(500)

    // Check comment is shown
    const comments = await cardDetailPage.getComments()
    expect(comments).toContain(commentMsg)

    // Check activity log contains "telah menambahkan komentar" or related message
    const activities = await cardDetailPage.getActivityLogs()
    expect(
      activities.some(
        (act) => act.toLowerCase().includes('komentar') || act.toLowerCase().includes('comment'),
      ),
    ).toBeTruthy()

    await cardDetailPage.close()
  })

  test('TC12: Set story points', async ({ page }) => {
    const cardTitle = `Card Points ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Set story point to 5
    await cardDetailPage.setStoryPoints(5)
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Check badge shows 5 pts in card preview
    const badge = page.locator('[data-card-id]').filter({ hasText: cardTitle }).getByText('5 pts')
    await expect(badge).toBeVisible()
  })

  test('TC13: Subtasks progress tracking', async ({ page }) => {
    const cardTitle = `Card Subtasks ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Add subtask
    await cardDetailPage.addSubtask('Subtask One')
    await page.waitForTimeout(500)

    // Verify subtask in list
    const subtaskList = await cardDetailPage.getSubtasksList()
    expect(subtaskList).toContain('Subtask One')

    await cardDetailPage.close()
    await page.waitForTimeout(500)

    // Subtask progress indicator visible in preview: should show 0/1
    const subtaskProgress = page
      .locator('[data-card-id]')
      .filter({ hasText: cardTitle })
      .locator('.badge', { hasText: '0/1' })
    await expect(subtaskProgress).toBeVisible()
  })

  test('TC14: Archive card → card hidden, restore → card back', async ({ page }) => {
    const cardTitle = `Card Archive ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Archive card
    await cardDetailPage.archive()
    await page.waitForTimeout(500)

    // Card should be hidden
    expect(await boardPage.isCardVisible(listName, cardTitle)).toBeFalsy()

    // Restore from archive menu
    await boardPage.openArchive()
    await page.waitForTimeout(500)
    await boardPage.restoreCardFromArchive(cardTitle)
    await page.waitForTimeout(500)

    // Card should be back in list
    expect(await boardPage.isCardVisible(listName, cardTitle)).toBeTruthy()
  })
})
