import { expect, test } from '@playwright/test'
import { emailCode, magicLink, requestEmail, signIn, uniqueEmail } from './helpers'

test('redirects anonymous users to login', async ({ page }) => {
  await page.goto('/stats')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fstats/)
})

test('signs in with the code from the email', async ({ page }) => {
  const email = uniqueEmail('code')
  await requestEmail(page, email, '/stats')
  await page.getByLabel('Or enter the code from the email').fill(await emailCode(email))
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/stats$/)
})

test('explains when the link is opened in another browser', async ({ page, browser }) => {
  const email = uniqueEmail('otherbrowser')
  await requestEmail(page, email)
  const other = await browser.newContext()
  const p2 = await other.newPage()
  await p2.goto(await magicLink(email))
  await expect(p2.getByRole('alert')).toContainText('different browser')
  await expect(p2).toHaveURL(/\/login/)
  await other.close()
})

test('marks chapters and syncs progress across reloads', async ({ page }) => {
  await signIn(page, uniqueEmail('reader'), '/bible')
  await page.getByPlaceholder('Search books').fill('Jude')
  const ch1 = page.getByRole('button', { name: /^Jude 1 ·/ })
  await expect(ch1).toHaveAttribute('aria-pressed', 'false')
  const saved = page.waitForResponse((r) => r.url().includes('/rest/v1/chapter_reads') && r.ok())
  await ch1.click()
  await expect(ch1).toHaveAttribute('aria-pressed', 'true')
  await saved

  await page.reload()
  await page.getByPlaceholder('Search books').fill('Jude')
  await expect(page.getByRole('button', { name: /^Jude 1 ·/ })).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/stats')
  await expect(page.getByText('1 / 1189 chapters').first()).toBeVisible()
})

test('imports progress from the legacy app', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('Genesis_1', 'true')
    localStorage.setItem('Isiah_53', 'true')
  })
  await signIn(page, uniqueEmail('legacy'))
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await expect(page.getByText('Imported 2 chapters')).toBeVisible()
  await page.goto('/stats')
  await expect(page.getByText('2 / 1189 chapters').first()).toBeVisible()
})

test('shares a record through a public link', async ({ page, browser }) => {
  await signIn(page, uniqueEmail('sharer'), '/settings')
  await page.getByRole('button', { name: 'Manage sharing' }).click()
  await page.getByRole('button', { name: 'Create link' }).click()
  const url = await page.getByRole('textbox', { name: 'Public link' }).inputValue()
  expect(url).toMatch(/\/s\//)

  const anon = await browser.newContext()
  const p2 = await anon.newPage()
  await p2.goto(url)
  await expect(p2.getByText('Read only')).toBeVisible()
  await anon.close()
})

test('creates a shared group and a second user joins it', async ({ page, browser }) => {
  await signIn(page, uniqueEmail('owner'), '/groups')
  await page.getByRole('button', { name: 'Create group' }).first().click()
  await page.getByLabel('Group name').fill('Morning Readers')
  await page.getByRole('dialog').getByRole('button', { name: 'Create group' }).click()
  await expect(page.getByRole('heading', { name: 'Morning Readers' })).toBeVisible()

  await page.getByRole('button', { name: 'Invite' }).click()
  const invite = await page.getByRole('textbox', { name: 'Invite link' }).inputValue()

  const ctx = await browser.newContext()
  const p2 = await ctx.newPage()
  const path = new URL(invite).pathname
  await signIn(p2, uniqueEmail('member'), path)
  await p2.getByRole('button', { name: 'Join group' }).click()
  await expect(p2.getByRole('heading', { name: 'Morning Readers' })).toBeVisible()
  await expect(p2.getByText('2 members')).toBeVisible()
  await ctx.close()
})
