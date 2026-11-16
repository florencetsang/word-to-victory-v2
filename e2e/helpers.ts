import { expect, type Page } from '@playwright/test'

const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'

export const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

async function latestEmailText(email: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`)
    const { messages } = (await res.json()) as { messages: { ID: string }[] }
    if (messages.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string }
      return msg.Text
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`No email for ${email}`)
}

export async function emailCode(email: string) {
  const code = (await latestEmailText(email)).match(/\b\d{6}\b/)?.[0]
  if (!code) throw new Error('No code in email')
  return code
}

export async function magicLink(email: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`)
    const { messages } = (await res.json()) as { messages: { ID: string }[] }
    if (messages.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string }
      const link = msg.Text.match(/https?:\/\/\S+verify\S+/)?.[0]
      if (link) return link.replace(/[)\]>]+$/, '')
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`No magic link for ${email}`)
}

/** Signs in through the real magic-link flow using the local Mailpit inbox. */
export async function requestEmail(page: Page, email: string, path = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(path)}`)
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click()
  await expect(page.getByText('Check your email')).toBeVisible()
}

export async function signIn(page: Page, email: string, path = '/') {
  await page.goto(`/login?redirect=${encodeURIComponent(path)}`)
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click()
  await expect(page.getByText('Check your email')).toBeVisible()
  await page.goto(await magicLink(email))
  await expect(page).not.toHaveURL(/\/login/)
}
