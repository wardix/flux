import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'
import { CardDetailPage } from './pages/CardDetailPage'

test.describe('Advanced Features E2E Tests', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage
  let boardPage: BoardPage
  let cardDetailPage: CardDetailPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    boardPage = new BoardPage(page)
    cardDetailPage = new CardDetailPage(page)

    // Login as Alice (Super Admin)
    await loginPage.login('alice@example.com', 'password123')
    await loginPage.expectLoggedIn()
    
    // Wait for layout/sidebar to load
    await page.locator('aside').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('button').filter({ hasText: /🏢/ }).waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(500)
  })

  test('TC1: Admin Dashboard Panel user listing and statistics', async ({ page }) => {
    // Click the 🛠️ Admin Panel button in Sidebar
    await page.getByRole('button', { name: /Admin Panel/i }).click()
    await page.waitForTimeout(500)

    // Verify Admin Panel header is visible
    await expect(page.locator('h1', { hasText: 'Admin Panel' })).toBeVisible()

    // Verify statistics cards are visible and populated
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible()
    await expect(page.getByText('Active Users', { exact: true })).toBeVisible()
    await expect(page.getByText('Suspended', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Admins', { exact: true })).toBeVisible()

    // Verify User Management table contains seeded users
    await expect(page.getByText('alice@example.com')).toBeVisible()
    await expect(page.getByText('bob@example.com')).toBeVisible()
    await expect(page.getByText('charlie@example.com')).toBeVisible()

    // Click back to Board
    await page.getByRole('button', { name: /Back to Board/i }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('h1', { hasText: 'Admin Panel' })).not.toBeVisible()
  })

  test('TC2 & TC3: Board Export options (JSON and CSV formats)', async ({ page }) => {
    // Create unique board for this test
    const boardTitle = `Export Board ${Date.now()}`
    await dashboardPage.createBoard(boardTitle)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(boardTitle)
    await page.waitForTimeout(500)

    // Add a list and a card to make sure we have data
    await boardPage.addList('List Alpha')
    await page.waitForTimeout(500)
    await boardPage.addCard('List Alpha', 'Export Card')
    await page.waitForTimeout(500)

    // Click Export Button in Header
    await page.locator('header button:has-text("Export")').first().click()
    await page.waitForTimeout(500)

    // Export as JSON
    const downloadJsonPromise = page.waitForEvent('download')
    await page.locator('input[value="json"]').click()
    await page.getByRole('button', { name: 'Export', exact: true }).click()
    const downloadJson = await downloadJsonPromise
    expect(downloadJson.suggestedFilename()).toContain('.json')
    await page.waitForTimeout(500)

    // Click Export Button again
    await page.locator('header button:has-text("Export")').first().click()
    await page.waitForTimeout(500)

    // Export as CSV
    const downloadCsvPromise = page.waitForEvent('download')
    await page.locator('input[value="csv"]').click()
    await page.getByRole('button', { name: 'Export', exact: true }).click()
    const downloadCsv = await downloadCsvPromise
    expect(downloadCsv.suggestedFilename()).toContain('.csv')
  })

  test('TC4: Create Board from Template', async ({ page }) => {
    const boardTitle = `Agile Temp Board ${Date.now()}`

    // Open add board section
    await dashboardPage.clickAddBoard()
    await page.waitForTimeout(300)

    // Fill title and select template
    await dashboardPage.fillBoardName(boardTitle)
    await page.locator('select').filter({ has: page.locator('option:has-text("Agile")') }).selectOption('agile')

    // Submit
    await page.getByRole('button', { name: 'Create' }).click()
    await page.waitForTimeout(1000)

    // Select the new board
    await dashboardPage.selectBoard(boardTitle)
    await page.waitForTimeout(1000)

    // Verify preset template lists exist on the board
    const listTitles = await boardPage.getListTitles()
    expect(listTitles).toContain('Backlog')
    expect(listTitles).toContain('To Do')
    expect(listTitles).toContain('In Progress')
    expect(listTitles).toContain('Done')
  })

  test('TC5: Clone Board', async ({ page }) => {
    const origTitle = `Clone Orig ${Date.now()}`
    await dashboardPage.createBoard(origTitle)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(origTitle)
    await page.waitForTimeout(500)

    const clonedTitle = `Cloned Target ${Date.now()}`

    // Intercept prompt and enter custom title
    const dialogHandler = async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept(clonedTitle)
      } else {
        await dialog.accept()
      }
    }
    page.on('dialog', dialogHandler)

    // Click Clone Board button
    await page.getByRole('button', { name: /Clone Board/i }).click()
    await page.waitForTimeout(2000)
    page.off('dialog', dialogHandler)

    // Verify that cloned board is active
    const activeTitle = await boardPage.getBoardTitle()
    expect(activeTitle).toBe(clonedTitle)
  })

  test('TC6 & TC7: Multiple Views (Table & Calendar View)', async ({ page }) => {
    const viewBoardTitle = `Views Board ${Date.now()}`
    await dashboardPage.createBoard(viewBoardTitle)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(viewBoardTitle)
    await page.waitForTimeout(500)

    // Switch to Table View
    await page.getByRole('button', { name: 'Table', exact: true }).click()
    await page.waitForTimeout(500)
    // Avoid modal shortcut help table and other layout tables
    await expect(page.locator('table.table-zebra').first()).toBeVisible()

    // Switch to Calendar View
    await page.getByRole('button', { name: 'Calendar', exact: true }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('.fc-view, .calendar-view, .grid').first()).toBeVisible()

    // Switch back to Kanban (default)
    await page.getByRole('button', { name: 'Kanban', exact: true }).click()
    await page.waitForTimeout(500)
  })

  test('TC8: Batch Operations (Multiselect & Archive/Delete)', async ({ page }) => {
    const batchBoardTitle = `Batch Board ${Date.now()}`
    await dashboardPage.createBoard(batchBoardTitle)
    await page.waitForTimeout(500)
    await dashboardPage.selectBoard(batchBoardTitle)
    await page.waitForTimeout(500)

    // Add list
    await boardPage.addList('To Do')
    await page.waitForTimeout(500)

    const cardTitle1 = `Batch Card 1 ${Date.now()}`
    const cardTitle2 = `Batch Card 2 ${Date.now()}`

    // Add 2 temporary cards
    await boardPage.addCard('To Do', cardTitle1)
    await page.waitForTimeout(500)
    await boardPage.addCard('To Do', cardTitle2)
    await page.waitForTimeout(1000)

    // Multiselect using Shift modifier (ensure we click actual card elements or headings)
    await page.locator('[data-card-id] h4').filter({ hasText: cardTitle1 }).first().click({ modifiers: ['Shift'] })
    await page.locator('[data-card-id] h4').filter({ hasText: cardTitle2 }).first().click({ modifiers: ['Shift'] })
    await page.waitForTimeout(500)

    // Verify Floating Action Bar is visible with 2 selected
    const actionBar = page.locator('.fixed.bottom-6')
    await expect(actionBar).toBeVisible()
    await expect(actionBar.getByText('2')).toBeVisible()

    // Choose Archive option
    page.once('dialog', async (dialog) => {
      await dialog.accept()
    })
    await actionBar.getByRole('button', { name: /Archive/i }).click()
    await page.waitForTimeout(1000)

    // Verify they are no longer visible in column
    await expect(page.locator('[data-card-id]').filter({ hasText: cardTitle1 })).not.toBeVisible()
    await expect(page.locator('[data-card-id]').filter({ hasText: cardTitle2 })).not.toBeVisible()
  })

  test('TC9: Public Forms creation, link copy, submission & card generation', async ({ page, browser }) => {
    const formBoardTitle = 'Flux Development'
    await dashboardPage.selectBoard(formBoardTitle)
    await page.waitForTimeout(500)

    // Open Public Form setting dropdown
    await page.locator('summary:has-text("Public Form")').first().click()
    await page.waitForTimeout(500)
    await page.locator('details:has-text("Public Form")').evaluate(el => el.setAttribute('open', ''))

    const pfForm = page.locator('details:has-text("Public Form")')

    // Ensure Enable Public Form toggle is ON
    const toggleInput = pfForm.locator('input[type="checkbox"]').first()
    const isChecked = await toggleInput.isChecked()
    if (!isChecked) {
      const toggle = pfForm.locator('label:has-text("Enable Public Form")')
      await toggle.click()
      await page.waitForTimeout(500)
    }

    // Fill out settings
    const titleInput = pfForm.locator('input[type="text"]').first()
    await titleInput.fill('Feedback Form')
    await pfForm.locator('textarea').first().fill('Send feedback here')

    // Save configuration
    await pfForm.getByRole('button', { name: /Save Configuration/i }).click()
    await page.waitForTimeout(2000)

    // Fetch shareable link
    const linkInput = pfForm.locator('#public-form-share-url')
    await linkInput.waitFor({ state: 'attached', timeout: 15000 })
    const shareUrl = await linkInput.inputValue()
    expect(shareUrl).toContain('/public/forms/')

    // Open new unauthenticated page context
    const externalContext = await browser.newContext({ storageState: undefined })
    const externalPage = await externalContext.newPage()
    await externalPage.goto(shareUrl)
    await externalPage.waitForTimeout(2000)

    // Submit new card via public form
    const publicCardTitle = `Public Suggestion ${Date.now()}`
    await externalPage.locator('input[placeholder*="Summarize"]').first().fill(publicCardTitle)
    await externalPage.locator('textarea[placeholder*="Provide"]').first().fill('External submission')
    await externalPage.getByRole('button', { name: /Submit Entry/i }).first().click()
    await externalPage.waitForTimeout(2000)

    // Verify success message on public page
    await expect(externalPage.getByText(/Thank you/i).or(externalPage.getByText(/success/i)).or(externalPage.getByText(/submitted/i)).first()).toBeVisible()
    await externalPage.close()
    await externalContext.close()

    // Back to main browser context, verify card was created on the board
    await page.reload()
    await page.waitForTimeout(1000)
    // Re-select the board since reload may land on a different board
    await dashboardPage.selectBoard(formBoardTitle)
    await page.waitForTimeout(1000)
    await expect(page.locator('[data-card-id]').filter({ hasText: publicCardTitle }).first()).toBeVisible({ timeout: 10000 })
  })

  test('TC10: Automation Rule creation and execution', async ({ page }) => {
    const autoBoardTitle = 'Flux Development'
    await dashboardPage.selectBoard(autoBoardTitle)
    await page.waitForTimeout(500)

    // Open Automations Dropdown
    await page.locator('summary:has-text("Automations")').first().click()
    await page.waitForTimeout(500)
    await page.locator('details:has-text("Automations")').evaluate(el => el.setAttribute('open', ''))

    const autoDropdown = page.locator('details:has-text("Automations")')

    // Click Create Automation
    await autoDropdown.getByRole('button', { name: /Create Automation/i }).first().click()
    await page.waitForTimeout(500)

    // Fill name
    await autoDropdown.locator('input[placeholder*="Move to Done"]').fill('Label Bug on Done')

    // Set Trigger Event: Card is moved
    await autoDropdown.locator('select').first().selectOption('card_moved')
    await page.waitForTimeout(300)

    // Set Trigger Destination List: Done
    await autoDropdown.locator('select').nth(1).selectOption({ label: 'Done' })

    // Set Action Type: Add label to card
    await autoDropdown.locator('select').nth(2).selectOption('add_label')
    await page.waitForTimeout(300)

    // Set Action Label: Bug
    await autoDropdown.locator('select').nth(3).selectOption({ label: 'Bug' })

    // Save Automation
    await autoDropdown.getByRole('button', { name: /Save Automation/i }).click()
    await page.waitForTimeout(1000)

    // Create a new card to move
    const testCardTitle = `Auto Move Task ${Date.now()}`
    await boardPage.addCard('To Do', testCardTitle)
    await page.waitForTimeout(1000)

    // Move card to Done using batch operation action bar
    await page.locator('[data-card-id] h4').filter({ hasText: testCardTitle }).first().click({ modifiers: ['Shift'] })
    await page.waitForTimeout(300)

    // Click Move dropdown button in FloatingActionBar
    await page.locator('#batch-action-move').click()
    await page.waitForTimeout(300)

    // Click "Done" list option
    await page.locator('.dropdown:has(#batch-action-move) .dropdown-content button').filter({ hasText: 'Done' }).click()
    await page.waitForTimeout(2000) // Wait for batch move + automation action to process on server

    // Reload to ensure board data includes automation results (label added by automation)
    await page.reload()
    await page.waitForTimeout(1000)
    // Re-select the board since reload may land on a different board
    await dashboardPage.selectBoard(autoBoardTitle)
    await page.waitForTimeout(1000)

    // Verify card is now in "Done" column and labeled with "Bug"
    const cardEl = page.locator('[data-list-id]').filter({ hasText: 'Done' }).locator('[data-card-id]').filter({ hasText: testCardTitle }).first()
    await expect(cardEl).toBeVisible({ timeout: 10000 })
    await expect(cardEl.getByText('Bug')).toBeVisible({ timeout: 5000 })
  })
})
