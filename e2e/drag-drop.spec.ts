import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'
import { CardDetailPage } from './pages/CardDetailPage'

test.describe('Kanban Board Drag & Drop E2E', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let boardPage: BoardPage
  let cardDetailPage: CardDetailPage
  let boardName: string
  let listTodo: string
  let listInProgress: string

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    boardPage = new BoardPage(page)
    cardDetailPage = new CardDetailPage(page)

    // Login
    await loginPage.login('alice@example.com', 'password123')
    await loginPage.expectLoggedIn()
    await page.waitForTimeout(1000)

    // Setup: Create a board
    boardName = `DND Board ${Date.now()}`
    await dashboardPage.createBoard(boardName)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(boardName)
    await page.waitForTimeout(500)

    // Create To Do and In Progress columns
    listTodo = `To Do`
    listInProgress = `In Progress`
    await boardPage.addList(listTodo)
    await page.waitForTimeout(500)
    await boardPage.addList(listInProgress)
    await page.waitForTimeout(500)
  })

  async function dragAndDrop(page, source, target) {
    const sourceBox = await source.boundingBox()
    const targetBox = await target.boundingBox()
    if (!sourceBox || !targetBox) {
      throw new Error('Could not find bounding box for source or target')
    }

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 })
    await page.waitForTimeout(100)
    await page.mouse.up()
    await page.waitForTimeout(500)
  }

  test('TC1: Drag card from To Do to In Progress → card moves column', async ({ page }) => {
    const cardTitle = `Drag Card ${Date.now()}`
    await boardPage.addCard(listTodo, cardTitle)
    await page.waitForTimeout(500)

    // Select source and target
    const source = page.locator('[data-card-id]').filter({ hasText: cardTitle }).first()
    const target = page.locator('[data-list-id]').filter({ hasText: listInProgress }).first()

    await dragAndDrop(page, source, target)

    // Card should now be visible in In Progress column
    expect(await boardPage.isCardVisible(listInProgress, cardTitle)).toBeTruthy()
    expect(await boardPage.isCardVisible(listTodo, cardTitle)).toBeFalsy()
  })

  test('TC2: Drag card within same list → reorder changes', async ({ page }) => {
    const card1 = `Card One ${Date.now()}`
    const card2 = `Card Two ${Date.now()}`

    await boardPage.addCard(listTodo, card1)
    await page.waitForTimeout(300)
    await boardPage.addCard(listTodo, card2)
    await page.waitForTimeout(500)

    // Verify initial positions: Card One should be above Card Two
    const todoList = page.locator('[data-list-id]').filter({ hasText: listTodo }).first()
    const cardsBefore = await todoList.locator('[data-card-id]').allInnerTexts()
    expect(cardsBefore[0]).toContain(card1)
    expect(cardsBefore[1]).toContain(card2)

    // Drag Card One below Card Two
    const source = page.locator('[data-card-id]').filter({ hasText: card1 }).first()
    const target = page.locator('[data-card-id]').filter({ hasText: card2 }).first()

    await dragAndDrop(page, source, target)

    // Verify positions reordered: Card Two should now be above Card One
    const cardsAfter = await todoList.locator('[data-card-id]').allInnerTexts()
    expect(cardsAfter[0]).toContain(card2)
    expect(cardsAfter[1]).toContain(card1)
  })

  test('TC3: Drag and refresh → new position persists', async ({ page }) => {
    const cardTitle = `Persist Card ${Date.now()}`
    await boardPage.addCard(listTodo, cardTitle)
    await page.waitForTimeout(500)

    const source = page.locator('[data-card-id]').filter({ hasText: cardTitle }).first()
    const target = page.locator('[data-list-id]').filter({ hasText: listInProgress }).first()

    await dragAndDrop(page, source, target)

    // Refresh page
    await page.reload()
    await page.waitForTimeout(1000)

    // Card should remain in In Progress column
    expect(await boardPage.isCardVisible(listInProgress, cardTitle)).toBeTruthy()
  })

  test('TC4: Drag to empty column → card is sole item', async ({ page }) => {
    const cardTitle = `Sole Card ${Date.now()}`
    await boardPage.addCard(listTodo, cardTitle)
    await page.waitForTimeout(500)

    // Drag to empty column In Progress
    const source = page.locator('[data-card-id]').filter({ hasText: cardTitle }).first()
    const target = page.locator('[data-list-id]').filter({ hasText: listInProgress }).first()

    await dragAndDrop(page, source, target)

    const inProgressList = page.locator('[data-list-id]').filter({ hasText: listInProgress }).first()
    const count = await inProgressList.locator('[data-card-id]').count()
    expect(count).toBe(1)
  })

  test.skip('TC5: Drag list/kolom untuk reorder (Not supported/implemented in UI)', async () => {
    // List reordering is not wrapped in DndContext/SortableContext on frontend Kanban layout.
  })

  test('TC6: Drag card yang blocked → warning muncul', async ({ page }) => {
    const blockerCard = `Blocker ${Date.now()}`
    const blockedCard = `Blocked ${Date.now()}`

    // Add blocker and blocked cards
    await boardPage.addCard(listTodo, blockerCard)
    await page.waitForTimeout(300)
    await boardPage.addCard(listTodo, blockedCard)
    await page.waitForTimeout(500)

    // Setup dependency: blocker blocks blocked
    await boardPage.clickCard(blockedCard)
    await page.waitForTimeout(500)

    // Find and get blockedCard's numeric ID to select blocker in select dropdown
    const boardState = await page.evaluate(() => {
      const activeBoard = (window as any).useBoardStore?.getState()?.activeBoard
      return activeBoard
    })
    
    // Fallback: We can just input dependency via CardDetailPage
    // Let's toggle the dependency selector
    await page.locator('.modal-box button').filter({ hasText: /dependencies/i }).first().click()
    await page.locator('.modal-box select').last().selectOption({ label: new RegExp(blockerCard, 'i') })
    await page.locator('.modal-box button').filter({ hasText: 'Tautkan' }).click()
    await page.waitForTimeout(500)
    await cardDetailPage.close()
    await page.waitForTimeout(500)

    // Listen to dialog warning alert
    let alertMessage = ''
    page.once('dialog', async (dialog) => {
      alertMessage = dialog.message()
      await dialog.accept()
    })

    // Try to drag blocked card to In Progress column
    const source = page.locator('[data-card-id]').filter({ hasText: blockedCard }).first()
    const target = page.locator('[data-list-id]').filter({ hasText: listInProgress }).first()

    await dragAndDrop(page, source, target)

    // Warning alert should have been fired
    expect(alertMessage.toLowerCase()).toContain('blocked by')
  })
})
