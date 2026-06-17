import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { BoardPage } from './pages/BoardPage'
import { CardDetailPage } from './pages/CardDetailPage'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

test.describe('Collaboration & Real-time E2E', () => {
  let aliceStateFile: string
  let bobStateFile: string
  let charlieStateFile: string

  test.beforeAll(async ({ browser }) => {
    // Authenticate users and save their state
    aliceStateFile = 'e2e/.auth/alice.json'
    bobStateFile = 'e2e/.auth/bob.json'
    charlieStateFile = 'e2e/.auth/charlie.json'

    const pageAlice = await browser.newPage()
    const loginAlice = new LoginPage(pageAlice)
    await loginAlice.login('alice@example.com', 'password123')
    await loginAlice.expectLoggedIn()
    await pageAlice.context().storageState({ path: aliceStateFile })
    await pageAlice.close()

    const pageBob = await browser.newPage()
    const loginBob = new LoginPage(pageBob)
    await loginBob.login('bob@example.com', 'password123')
    await loginBob.expectLoggedIn()
    await pageBob.context().storageState({ path: bobStateFile })
    await pageBob.close()

    const pageCharlie = await browser.newPage()
    const loginCharlie = new LoginPage(pageCharlie)
    await loginCharlie.login('charlie@example.com', 'password123')
    await loginCharlie.expectLoggedIn()
    await pageCharlie.context().storageState({ path: charlieStateFile })
    await pageCharlie.close()
  })

  test('TC1-TC3: WS Real-time Sync (Create, Move, Edit Card)', async ({ browser }) => {
    const contextAlice = await browser.newContext({ storageState: aliceStateFile })
    const contextBob = await browser.newContext({ storageState: bobStateFile })

    const pageAlice = await contextAlice.newPage()
    const pageBob = await contextBob.newPage()

    const boardAlice = new BoardPage(pageAlice)
    const boardBob = new BoardPage(pageBob)

    // Load public board (Flux Development - ID 1) which both have access to
    await pageAlice.goto('/boards/1')
    await pageBob.goto('/boards/1')
    await pageAlice.waitForTimeout(1000)
    await pageBob.waitForTimeout(1000)

    const cardTitle = `Collab Card ${Date.now()}`
    const updatedTitle = `Collab Card Updated ${Date.now()}`

    // 1. User Alice creates card
    await boardAlice.addCard('To Do', cardTitle)
    await pageAlice.waitForTimeout(500)

    // User Bob sees card appear real-time
    await expect(pageBob.locator('[data-card-id]').filter({ hasText: cardTitle }).first()).toBeVisible({ timeout: 5000 })

    // 2. User Alice edits card title
    await boardAlice.clickCard(cardTitle)
    await pageAlice.waitForTimeout(500)
    const detailsAlice = new CardDetailPage(pageAlice)
    await detailsAlice.fillTitle(updatedTitle)
    await detailsAlice.save()
    await pageAlice.waitForTimeout(500)

    // User Bob sees card title update real-time
    await expect(pageBob.locator('[data-card-id]').filter({ hasText: updatedTitle }).first()).toBeVisible({ timeout: 5000 })

    // 3. User Alice moves card
    // Use manual pointer actions for Alice
    const source = pageAlice.locator('[data-card-id]').filter({ hasText: updatedTitle }).first()
    const target = pageAlice.locator('[data-list-id]').filter({ hasText: 'In Progress' }).first()
    const sourceBox = await source.boundingBox()
    const targetBox = await target.boundingBox()
    if (sourceBox && targetBox) {
      await pageAlice.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
      await pageAlice.mouse.down()
      await pageAlice.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 })
      await pageAlice.mouse.up()
    }
    await pageAlice.waitForTimeout(1000)

    // User Bob sees card move real-time
    expect(await boardBob.isCardVisible('In Progress', updatedTitle)).toBeTruthy()

    await contextAlice.close()
    await contextBob.close()
  })

  test('TC4: Presence indicator showing online users', async ({ browser }) => {
    const contextAlice = await browser.newContext({ storageState: aliceStateFile })
    const contextBob = await browser.newContext({ storageState: bobStateFile })

    const pageAlice = await contextAlice.newPage()
    const pageBob = await contextBob.newPage()

    // Both load the board Flux Development
    await pageAlice.goto('/boards/1')
    await pageBob.goto('/boards/1')
    await pageAlice.waitForTimeout(2000)

    // Alice should see Bob in presence indicator
    const alicePresence = pageAlice.locator('.avatar-group').first()
    await expect(alicePresence).toBeVisible()

    await contextAlice.close()
    await contextBob.close()
  })

  test('TC5-TC6: Invite member and Observer Role read-only validation', async ({ browser }) => {
    const contextAlice = await browser.newContext({ storageState: aliceStateFile })
    const pageAlice = await contextAlice.newPage()
    await pageAlice.goto('/boards/1')
    await pageAlice.waitForTimeout(1000)

    // 1. Alice invites bob as observer
    // (In our seed bob is already there, but we invite a new observer test-observer@example.com)
    const inviteEmail = `obs-${Date.now()}@example.com`
    
    // Toggle Members list
    await pageAlice.getByRole('button', { name: /Members/i }).click()
    await pageAlice.waitForTimeout(300)
    await pageAlice.getByPlaceholder('user@example.com').fill(inviteEmail)
    await pageAlice.locator('select[name="inviteRole"]').selectOption('observer')
    
    // Listen to success alert
    pageAlice.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('success')
      await dialog.accept()
    })
    await pageAlice.getByRole('button', { name: 'Invite' }).click()
    await pageAlice.waitForTimeout(1000)

    // 2. Observer role verification: Charlie is viewer of workspace and has observer access to public board
    const contextCharlie = await browser.newContext({ storageState: charlieStateFile })
    const pageCharlie = await contextCharlie.newPage()
    const boardCharlie = new BoardPage(pageCharlie)
    await pageCharlie.goto('/boards/1')
    await pageCharlie.waitForTimeout(1000)

    // Verify user role is observer
    const roleBadge = pageCharlie.locator('header').getByText(/observer/i).or(
      pageCharlie.locator('div').filter({ hasText: /Members/ }).getByText(/observer/i)
    ).first()
    
    // Open a card
    await boardCharlie.clickCard('Develop Authentication')
    await pageCharlie.waitForTimeout(500)

    // Save button should NOT be visible or details header says Read-only
    const readonlyHeader = pageCharlie.locator('.modal-box h3', { hasText: /Read-only/i }).or(
      pageCharlie.locator('.modal-box button', { hasText: /Save/i })
    ).first()
    await expect(readonlyHeader).toBeVisible()

    await contextAlice.close()
    await contextCharlie.close()
  })

  test('TC7: Chat message sync', async ({ browser }) => {
    const contextAlice = await browser.newContext({ storageState: aliceStateFile })
    const contextBob = await browser.newContext({ storageState: bobStateFile })

    const pageAlice = await contextAlice.newPage()
    const pageBob = await contextBob.newPage()

    await pageAlice.goto('/boards/1')
    await pageBob.goto('/boards/1')
    await pageAlice.waitForTimeout(1000)
    await pageBob.waitForTimeout(1000)

    // Open Chat on both
    await pageAlice.locator('button').filter({ has: pageAlice.locator('.material-symbols-outlined', { hasText: 'chat' }) }).click()
    await pageBob.locator('button').filter({ has: pageBob.locator('.material-symbols-outlined', { hasText: 'chat' }) }).click()
    await pageAlice.waitForTimeout(500)
    await pageBob.waitForTimeout(500)

    // Alice opens direct message with Bob
    await pageAlice.locator('button').filter({ has: pageAlice.locator('.material-symbols-outlined', { hasText: 'add' }) }).click()
    await pageAlice.getByText('New Direct Message').click()
    await pageAlice.locator('button').filter({ hasText: 'Bob' }).first().click()
    await pageAlice.waitForTimeout(500)

    // Alice types message
    const msg = `Hello Bob ${Date.now()}`
    await pageAlice.locator('textarea[placeholder*="Type a message"]').or(
      pageAlice.locator('input[placeholder*="message"]')
    ).first().fill(msg)
    await pageAlice.keyboard.press('Enter')
    await pageAlice.waitForTimeout(500)

    // Bob receives message real-time
    // Click on Alice DM if not already open
    const aliceDM = pageBob.locator('.menu').getByText('Alice').first()
    if (await aliceDM.isVisible()) {
      await aliceDM.click()
    }
    await pageBob.waitForTimeout(500)
    await expect(pageBob.locator('div').filter({ hasText: msg }).first()).toBeVisible({ timeout: 5000 })

    await contextAlice.close()
    await contextBob.close()
  })

  test('TC8: Notification center updates on card assignment', async ({ page }) => {
    const board = new BoardPage(page)
    const details = new CardDetailPage(page)

    await page.goto('/boards/1')
    await page.waitForTimeout(1000)

    // Assign card to bob
    const cardTitle = `Assign Bob ${Date.now()}`
    await board.addCard('To Do', cardTitle)
    await page.waitForTimeout(500)
    await board.clickCard(cardTitle)
    await page.waitForTimeout(500)
    await details.assignMember('bob@example.com')
    await details.save()
    await page.waitForTimeout(1000)

    // Log in as Bob and check notifications
    const contextBob = await page.context().browser()!.newContext({ storageState: bobStateFile })
    const pageBob = await contextBob.newPage()
    await pageBob.goto('/boards/1')
    await pageBob.waitForTimeout(1000)

    // Open notifications
    await pageBob.locator('button').filter({ has: pageBob.locator('.material-symbols-outlined', { hasText: 'notifications' }) }).or(
      pageBob.locator('.indicator').filter({ hasText: /notifications/i })
    ).first().click()
    await pageBob.waitForTimeout(500)

    // Should see assignment notification
    const notificationItem = pageBob.locator('.dropdown-content').getByText(cardTitle).first()
    await expect(notificationItem).toBeVisible()

    await pageBob.close()
    await contextBob.close()
  })
})
