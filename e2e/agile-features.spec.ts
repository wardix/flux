import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'
import { CardDetailPage } from './pages/CardDetailPage'

test.describe('Agile & Scrum Features E2E', () => {
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

    // Create a new board and list
    boardName = `Agile Board ${Date.now()}`
    await dashboardPage.createBoard(boardName)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(boardName)
    await page.waitForTimeout(500)

    listName = `Sprint List`
    await boardPage.addList(listName)
    await page.waitForTimeout(500)
  })

  test('TC1-TC4: Sprint Lifecycle (Create, Assign Cards, Burndown, and Complete Sprint)', async ({ page }) => {
    const cardTitle = `Backlog Task ${Date.now()}`

    // 1. Create card (automatically acts as backlog card)
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    // Enable Sprints Mode
    await page.locator('button').filter({ hasText: /Sprints Mode/i }).click()
    await page.waitForTimeout(500)

    // Go to Planning tab
    await page.getByRole('button', { name: 'Planning / Backlog' }).click()
    await page.waitForTimeout(500)

    // Create a new Sprint
    await page.getByRole('button', { name: /\+ New Sprint|New Sprint/i }).click()
    await page.waitForTimeout(300)
    await page.locator('input[placeholder="e.g. Sprint 1"]').fill('Sprint Alpha')
    await page.locator('input[placeholder*="Goal"]').fill('OAuth implementation goal')

    // Dates: start today, end next week
    const start = new Date().toISOString().split('T')[0]
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').first().fill(start)
    await page.locator('input[type="date"]').last().fill(end)

    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(500)

    // Verify Sprint Alpha appeared in planning
    await expect(page.locator('.card').filter({ hasText: 'Sprint Alpha' }).first()).toBeVisible()

    // 2. Assign card to Sprint Alpha
    const cardBox = page.locator('div').filter({ hasText: cardTitle }).last()
    await cardBox.locator('select').selectOption({ label: 'Sprint Alpha' })
    await page.waitForTimeout(1000)

    // Verify card is now inside Sprint Alpha card list in UI
    const sprintBox = page.locator('.card').filter({ hasText: 'Sprint Alpha' }).first()
    await expect(sprintBox.locator('span', { hasText: cardTitle }).first()).toBeVisible()

    // Create another Sprint for incomplete cards
    await page.getByRole('button', { name: /\+ New Sprint|New Sprint/i }).click()
    await page.waitForTimeout(300)
    await page.locator('input[placeholder="e.g. Sprint 1"]').fill('Sprint Beta')
    await page.locator('input[type="date"]').first().fill(start)
    await page.locator('input[type="date"]').last().fill(end)
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Start Sprint Alpha (only if not already active)
    const startBtn = page.locator('.card').filter({ hasText: 'Sprint Alpha' }).getByRole('button', { name: 'Start' }).first()
    if (await startBtn.isVisible()) {
      await startBtn.click()
      await page.waitForTimeout(500)
    }

    // 3. View burndown chart
    await page.getByRole('button', { name: 'Burndown Chart' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('canvas')).toBeVisible()

    // Go back to Planning
    await page.getByRole('button', { name: 'Planning / Backlog' }).click()
    await page.waitForTimeout(500)

    // 4. Complete Sprint Alpha → send cards to Sprint Beta
    await page.getByRole('button', { name: 'Complete Sprint' }).click()
    await page.waitForTimeout(500)

    // Choose Sprint Beta
    await page.locator('.modal select').selectOption({ label: /Sprint Beta/ })
    await page.locator('.modal button').filter({ hasText: 'Complete Sprint' }).click()
    await page.waitForTimeout(1000)

    // Verify card is now inside Sprint Beta
    const sprintBetaBox = page.locator('.card').filter({ hasText: 'Sprint Beta' }).first()
    await expect(sprintBetaBox.locator('span', { hasText: cardTitle }).first()).toBeVisible()
  })

  test('TC5-TC6: Epic Tracking (Create Epic and Link Cards)', async ({ page }) => {
    const cardTitle = `Epic Task ${Date.now()}`
    const epicTitle = `Epic Alpha ${Date.now()}`

    // Create card
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    // Go to Epic Tracking
    await page.locator('button').filter({ hasText: /Epic Tracking/i }).click()
    await page.waitForTimeout(500)

    // Create Epic
    await page.locator('button').filter({ hasText: /\+ New Epic|New Epic/i }).click()
    await page.waitForTimeout(300)
    await page.locator('input[placeholder="Epic Title"]').fill(epicTitle)
    await page.locator('textarea[placeholder="Epic Description"]').fill('Large initiative description')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Verify epic created
    await expect(page.locator('.card').filter({ hasText: epicTitle }).first()).toBeVisible()

    // Go back to Board view
    await page.locator('aside button').filter({ hasText: boardName }).first().click()
    await page.waitForTimeout(500)

    // Link card to Epic Alpha
    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Choose Epic Alpha from Epic select dropdown
    const epicSelect = page.locator('.modal-box select').filter({ has: page.locator('option:has-text("No Epic")') }).first()
    await epicSelect.selectOption({ label: new RegExp(epicTitle, 'i') })
    await cardDetailPage.save()
    await page.waitForTimeout(1000)

    // Go back to Epic Tracking and check progress bar is visible
    await page.locator('button').filter({ hasText: /Epic Tracking/i }).click()
    await page.waitForTimeout(500)
    const epicProgress = page.locator('.card').filter({ hasText: epicTitle }).locator('.w-full')
    await expect(epicProgress).toBeVisible()
  })

  test('TC7-TC8: Dashboard Analytics', async ({ page }) => {
    // Navigate to Analytics Dashboard
    await page.locator('button').filter({ hasText: /Analytics Dashboard/i }).click()
    await page.waitForTimeout(1000)

    // Check cards by status pie chart is rendered
    const statusChart = page.locator('canvas').first()
    await expect(statusChart).toBeVisible()

    // Check cards by member bar chart is rendered (or velocity chart)
    const memberChart = page.locator('canvas').nth(1)
    await expect(memberChart).toBeVisible()
  })

  test('TC9: Start/Stop Time Tracker', async ({ page }) => {
    const cardTitle = `Time Task ${Date.now()}`
    await boardPage.addCard(listName, cardTitle)
    await page.waitForTimeout(500)

    await boardPage.clickCard(cardTitle)
    await page.waitForTimeout(500)

    // Start Timer
    await page.locator('button').filter({ hasText: /Start Timer/i }).first().click()
    await page.waitForTimeout(1500)

    // Stop Timer
    await page.locator('button').filter({ hasText: /Stop Timer/i }).first().click()
    await page.waitForTimeout(1000)

    // Time Log entry should appear in Activity/Time tracking list
    const logItem = page.locator('.modal-box').getByText(/detik|seconds|Logged/i).first()
    await expect(logItem).toBeVisible()

    await cardDetailPage.close()
  })

  test('TC10: Goals & OKRs Objectives Hierarchy', async ({ page }) => {
    const objectiveTitle = `Obj Alpha ${Date.now()}`
    const krTitle = `KR Alpha ${Date.now()}`

    // Navigate to Goals & OKRs page
    await page.locator('button').filter({ hasText: /Goals & OKRs/i }).click()
    await page.waitForTimeout(1000)

    // Click Create Objective
    await page.getByRole('button', { name: /Create Objective/i }).click()
    await page.waitForTimeout(300)
    await page.locator('.modal-box input[type="text"]').first().fill(objectiveTitle)
    await page.locator('.modal-box button').filter({ hasText: 'Simpan Sasaran' }).click()
    await page.waitForTimeout(1000)

    // Select created objective to view details
    await page.locator('span').filter({ hasText: objectiveTitle }).first().click()
    await page.waitForTimeout(500)

    // Add Key Result
    await page.getByRole('button', { name: /Add Key Result/i }).click()
    await page.waitForTimeout(300)
    await page.locator('.modal-box input[type="text"]').first().fill(krTitle)
    await page.locator('.modal-box input[type="number"]').first().fill('10')
    await page.locator('.modal-box button').filter({ hasText: 'Simpan Sasaran' }).click()
    await page.waitForTimeout(1000)

    // Verify OKR tree hierarchy has Objective + Key Result
    await expect(page.locator('span').filter({ hasText: objectiveTitle }).first()).toBeVisible()
    await expect(page.locator('span').filter({ hasText: krTitle }).first()).toBeVisible()
  })

  test('TC11: Workload View per Member bar chart rendering', async ({ page }) => {
    // Go to Workload tab
    await page.getByRole('button', { name: 'Workload' }).click()
    await page.waitForTimeout(1000)

    // Check workload component chart/bar rendering
    const workloadBars = page.locator('.progress, progress, canvas, div.flex-1').first()
    await expect(workloadBars).toBeVisible()
  })
})
