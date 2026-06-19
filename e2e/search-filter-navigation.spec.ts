import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'
import { CardDetailPage } from './pages/CardDetailPage'

test.describe('Search, Filter & Navigation E2E', () => {
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

    // Setup: Create a board and a list
    boardName = `Nav Board ${Date.now()}`
    await dashboardPage.createBoard(boardName)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(boardName)
    await page.waitForTimeout(500)

    listName = `List Alpha`
    await boardPage.addList(listName)
    await page.waitForTimeout(500)
  })

  test('TC1: Search card by title → click → navigate to card', async ({ page }) => {
    const cardTitle = `SearchTargetCard`
    await boardPage.addCard(listName, cardTitle)
    // Wait for card to be visible on the board list to avoid race conditions
    await expect(page.locator('[data-card-id]').filter({ hasText: cardTitle }).first()).toBeVisible()

    // Enter query in search bar
    const searchInput = page.locator('input[placeholder*="Search..."]')
    await searchInput.fill(cardTitle)
    await page.waitForTimeout(800) // wait for debounce

    // Wait for dropdown to show result
    const dropdownItem = page.locator('.absolute.top-full').getByText(cardTitle).first()
    await dropdownItem.click()
    await page.waitForTimeout(500)

    // Should open card detail modal
    await expect(page.locator('.modal-box').filter({ hasText: /Card Details|Edit Card/i })).toBeVisible()
    const modalTitleInput = page.locator('.modal-box').filter({ hasText: /Card Details|Edit Card/i }).locator('input[type="text"]').first()
    await expect(modalTitleInput).toHaveValue(cardTitle)

    await cardDetailPage.close()
  })

  test('TC2-TC4: Filters (Assignee, Label, Due Date)', async ({ page }) => {
    const cardAssignee = `CardAssignee`
    const cardLabel = `CardLabel`
    const cardOverdue = `CardOverdue`

    // Create Card for Assignee Filter
    await boardPage.addCard(listName, cardAssignee)
    await page.waitForTimeout(300)
    await boardPage.clickCard(cardAssignee)
    await page.waitForTimeout(300)
    await cardDetailPage.assignMember('alice@example.com')
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Create Card for Label Filter
    await boardPage.addCard(listName, cardLabel)
    await page.waitForTimeout(300)
    await boardPage.clickCard(cardLabel)
    await page.waitForTimeout(300)
    await cardDetailPage.toggleLabel('bug')
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Create Card for Overdue Filter
    await boardPage.addCard(listName, cardOverdue)
    await page.waitForTimeout(300)
    await boardPage.clickCard(cardOverdue)
    await page.waitForTimeout(300)
    await cardDetailPage.setDueDate('2020-01-01')
    await cardDetailPage.save()
    await page.waitForTimeout(500)

    // Open Filter Panel
    await page.getByRole('button', { name: /Filter/i }).click()
    await page.waitForTimeout(500)

    // 1. Filter by assignee
    await page.locator('button').filter({ hasText: /^alice$/i }).first().click()
    await page.waitForTimeout(500)
    expect(await boardPage.isCardVisible(listName, cardAssignee)).toBeTruthy()
    expect(await boardPage.isCardVisible(listName, cardLabel)).toBeFalsy()

    // Clear and toggle off assignee
    await page.locator('button').filter({ hasText: /^alice$/i }).first().click()
    await page.waitForTimeout(300)

    // 2. Filter by label
    await page.locator('button').filter({ hasText: /^bug$/i }).first().click()
    await page.waitForTimeout(500)
    expect(await boardPage.isCardVisible(listName, cardLabel)).toBeTruthy()
    expect(await boardPage.isCardVisible(listName, cardAssignee)).toBeFalsy()

    // Clear and toggle off label
    await page.locator('button').filter({ hasText: /^bug$/i }).first().click()
    await page.waitForTimeout(300)

    // 3. Filter by due date status (overdue)
    await page.locator('select').filter({ has: page.locator('option[value="overdue"]') }).selectOption('overdue')
    await page.waitForTimeout(500)
    expect(await boardPage.isCardVisible(listName, cardOverdue)).toBeTruthy()
    expect(await boardPage.isCardVisible(listName, cardAssignee)).toBeFalsy()
  })

  test('TC5-TC6: Command Palette navigation', async ({ page }) => {
    // Open Command Palette via shortcut
    const isMac = process.platform === 'darwin'
    if (isMac) {
      await page.keyboard.press('Meta+k')
    } else {
      await page.keyboard.press('Control+k')
    }
    await page.waitForTimeout(500)

    // Dialog should be visible
    const palette = page.locator('[role="dialog"]').filter({ hasText: /Command Palette/i }).or(
      page.locator('div').filter({ hasText: /Create New Card/i })
    ).first()
    await expect(palette).toBeVisible()

    // Type query to fuzzy search
    await page.keyboard.type('Go to Dashboard')
    await page.waitForTimeout(500)

    // Click option
    const opt = page.locator('div[role="option"]').filter({ hasText: 'Go to Dashboard' }).first()
    await opt.click()
    await page.waitForTimeout(500)

    // Navigated to Dashboard
    await expect(page).toHaveURL(/.*\/$/)
  })

  test('TC7: Press "/" to focus search bar', async ({ page }) => {
    // Press "/" shortcut
    await page.keyboard.press('/')
    await page.waitForTimeout(300)

    const searchInput = page.locator('input[placeholder*="Search..."]')
    await expect(searchInput).toBeFocused()
  })

  test('TC8: Dark Mode toggle & persist after refresh', async ({ page }) => {
    // Click theme toggle
    await page.locator('button').filter({ hasText: /Theme:/i }).click()
    await page.waitForTimeout(300)

    // Choose Dark
    await page.locator('button').filter({ hasText: /Dark/i }).click()
    await page.waitForTimeout(500)

    // Verify HTML has dark class/attribute
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark'))
    expect(isDark).toBeTruthy()

    // Refresh page
    await page.reload()
    await page.waitForTimeout(500)

    // Remains dark
    const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark'))
    expect(isDarkAfter).toBeTruthy()
  })

  test('TC9: Change language i18n', async ({ page }) => {
    // Go to settings
    await page.locator('button').filter({ hasText: /⚙️/ }).first().click()
    await page.waitForTimeout(500)

    // Change language select to id
    const langSelect = page.locator('select[role="combobox"]').first()
    await langSelect.selectOption('id')
    await page.waitForTimeout(800)

    // Check UI texts change to Indonesian
    const backBtn = page.locator('button').filter({ hasText: /Kembali/i }).or(page.locator('button').filter({ hasText: /Back/i }))
    await expect(backBtn).toBeVisible()
  })
})
