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
  await page.goto('/login')
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
    page.getByRole('heading', { name: 'Detalhes do NFT' }),
  ).toBeVisible()
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
