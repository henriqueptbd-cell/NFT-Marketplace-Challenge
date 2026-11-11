import { expect, test } from '@playwright/test'

test('serves the Kurio application shell without requiring NFT image assets', async ({
  page,
}) => {
  const response = await page.goto('/')

  expect(response?.ok()).toBe(true)
  await expect(page).toHaveTitle('Kurio')
  await expect(page.locator('#root')).toBeVisible()

  const apiResult = await page.evaluate(async () => {
    const response = await fetch('/api/nfts')
    const body: unknown = await response.json()
    return { status: response.status, body }
  })

  expect(apiResult.status).toBe(200)
  expect(apiResult.body).toHaveLength(9)
  expect(apiResult.body).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'emerald-ape-042',
        image: '/nfts/emerald-ape-042.webp',
      }),
    ]),
  )
})
