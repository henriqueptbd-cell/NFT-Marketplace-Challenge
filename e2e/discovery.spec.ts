import { expect, test, type Page } from '@playwright/test'

async function waitForApp(page: Page) {
  await page.waitForFunction(() => {
    const browserWindow = window as unknown as {
      __mswScenario?: (name: string) => void
    }
    return (
      typeof browserWindow.__mswScenario === 'function' &&
      document.querySelector('#root main') !== null
    )
  })
}

async function openApp(page: Page, path: string) {
  await page.goto('/')
  await waitForApp(page)
  await page.goto(path)
  await waitForApp(page)
  await page.evaluate(() => {
    const browserWindow = window as unknown as {
      __mswReset: () => void
      __mswScenario: (name: string) => void
    }
    browserWindow.__mswReset()
    browserWindow.__mswScenario('default')
  })
}

test('mobile filters update the URL, survive reload, and restore with browser back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openApp(page, '/?sort=relevance')
  await expect(page.getByRole('tab', { name: 'Todos os NFTs' })).toBeVisible()

  await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const ethereumFilter = page.getByRole('checkbox', { name: /Ethereum/ })
  await expect(ethereumFilter).toBeVisible()
  await ethereumFilter.click()
  await expect(ethereumFilter).toBeChecked()
  await expect
    .poll(() => new URL(page.url()).searchParams.getAll('networks').join(' '))
    .toContain('Ethereum')

  await page.reload()
  await page.getByRole('button', { name: 'Abrir filtros' }).click()
  await expect(page.getByRole('checkbox', { name: /Ethereum/ })).toBeChecked()

  await page.goBack()
  await expect
    .poll(() =>
      new URL(page.url()).searchParams
        .getAll('networks')
        .some((value) => value.includes('Ethereum')),
    )
    .toBe(false)
  await expect(
    page.getByRole('checkbox', { name: /Ethereum/ }),
  ).not.toBeChecked()
})

test('catalog pagination loads distinct server pages', async ({ page }) => {
  await openApp(page, '/')
  const nftGrid = page.locator('main .grid.grid-cols-2')
  const headings = nftGrid.getByRole('heading', { level: 2 })
  await expect(headings).toHaveCount(12)
  const firstPageNames = await headings.allTextContents()

  await page.getByRole('button', { name: 'Ir para a página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(headings).toHaveCount(12)
  await expect
    .poll(() => headings.allTextContents())
    .not.toEqual(firstPageNames)
})

test('detail renders API data and disables purchase for a sold-out edition', async ({
  page,
}) => {
  await openApp(page, '/nft/neon-vessel-552')
  await expect(
    page.getByRole('heading', { name: 'Neon Vessel #552' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Esgotado' })).toBeDisabled()
  await expect(page.getByText('ID do token')).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Detalhes do NFT', selected: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: /Avaliações de colecionadores/ }),
  ).toBeVisible()
})

test('detail switches between the details and reviews tabs', async ({
  page,
}) => {
  await openApp(page, '/nft/neon-vessel-552')

  const reviewsTab = page.getByRole('tab', {
    name: /Avaliações de colecionadores/,
  })
  await reviewsTab.click()
  await expect(reviewsTab).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByRole('list', { name: 'Avaliações de colecionadores' }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('list', { name: 'Avaliações de colecionadores' })
      .locator('li'),
  ).not.toHaveCount(0)

  await page.getByRole('tab', { name: 'Detalhes do NFT' }).click()
  await expect(page.getByText('ID do token')).toBeVisible()
})

test('detail displays the not-found state for an unknown NFT ID', async ({
  page,
}) => {
  await openApp(page, '/nft/nft-inexistente')
  await expect(
    page.getByRole('heading', { name: 'NFT não encontrado' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Voltar ao marketplace' }),
  ).toBeVisible()
})
