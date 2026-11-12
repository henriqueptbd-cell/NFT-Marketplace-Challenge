import { expect, test, type Page } from '@playwright/test'

interface TestWindow extends Window {
  __mswScenario: (name: string) => void
}

async function openRoute(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForFunction(() => {
    const browserWindow = window as unknown as TestWindow
    return (
      typeof browserWindow.__mswScenario === 'function' &&
      document.querySelector('#root main') !== null
    )
  })
}

async function signIn(page: Page): Promise<void> {
  await openRoute(page, '/login')
  await page.locator('#login-email').fill('user@kurio.io')
  await page.locator('#login-password').fill('demo1234')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL((url) => url.pathname !== '/login')
}

async function addEmeraldApe(page: Page): Promise<void> {
  await openRoute(page, '/nft/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.getByText('NFT adicionado ao carrinho.')).toBeVisible()
}

async function setScenario(page: Page, scenario: string): Promise<void> {
  await page.evaluate((name) => {
    ;(window as unknown as TestWindow).__mswScenario(name)
  }, scenario)
}

async function setNFTAvailability(
  page: Page,
  nftId: string,
  available: number,
): Promise<void> {
  await page.evaluate(
    ({ id, remaining }) => {
      const state = JSON.parse(
        window.localStorage.getItem('msw:state:v1') ?? 'null',
      ) as {
        nfts: Array<{ id: string; edition: { available: number } }>
      } | null
      const nft = state?.nfts.find((item) => item.id === id)
      if (!state || !nft) throw new Error('Mock NFT was not found')
      nft.edition.available = remaining
      window.localStorage.setItem('msw:state:v1', JSON.stringify(state))
    },
    { id: nftId, remaining: available },
  )
  await page.reload()
  await expect(page.locator('#root main')).toBeVisible()
}

async function getCart(page: Page): Promise<{
  items: Array<{ nftId: string; quantity: number }>
  couponCode: string | null
}> {
  return page.evaluate(async () => {
    const response = await fetch('/api/cart', { credentials: 'include' })
    if (!response.ok) throw new Error('Cart API request failed')
    return (await response.json()) as {
      items: Array<{ nftId: string; quantity: number }>
      couponCode: string | null
    }
  })
}

async function getOrdersCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const response = await fetch('/api/orders', { credentials: 'include' })
    if (!response.ok) throw new Error('Orders API request failed')
    const orders = (await response.json()) as unknown[]
    return orders.length
  })
}

test('carrinho convidado persiste, mantém cupom/quantidade e mescla após login', async ({
  page,
}) => {
  await addEmeraldApe(page)
  await openRoute(page, '/cart')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByLabel('Quantidade no carrinho')).toHaveText('2')

  await page.locator('#cart-coupon').fill('INVALID')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.locator('#cart-coupon')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(page.getByText('Código promocional inválido.')).toBeVisible()

  await page.locator('#cart-coupon').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByText('Cupom aplicado.')).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Quantidade no carrinho')).toHaveText('2')
  await expect(page.locator('#cart-coupon')).toHaveValue('KURIO10')

  await signIn(page)
  await openRoute(page, '/cart')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
  await expect(page.getByLabel('Quantidade no carrinho')).toHaveText('2')
  await expect(page.locator('#cart-coupon')).toHaveValue('KURIO10')

  const cart = await getCart(page)
  expect(cart.items).toHaveLength(1)
  expect(cart.items[0]).toMatchObject({
    nftId: 'emerald-ape-042',
    quantity: 2,
  })
  expect(cart.couponCode).toBe('KURIO10')
})

test('checkout exige sessão, preserva redirect e mantém carrinho convidado', async ({
  page,
}) => {
  await addEmeraldApe(page)
  await openRoute(page, '/checkout')
  await page.waitForURL((url) => url.pathname === '/login')
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/checkout')

  await openRoute(page, '/cart')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
})

test('merge mantém quantidade acima do estoque e permite ajuste explícito', async ({
  page,
}) => {
  await addEmeraldApe(page)
  await openRoute(page, '/cart')
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByLabel('Quantidade no carrinho')).toHaveText('2')
  await setNFTAvailability(page, 'emerald-ape-042', 1)
  await signIn(page)
  await openRoute(page, '/cart')

  await expect(
    page.getByText(
      'Esta edição está esgotada ou não há quantidade suficiente.',
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Ir para o checkout' }),
  ).toBeDisabled()
  expect((await getCart(page)).items).toHaveLength(1)
  expect((await getCart(page)).items[0]).toMatchObject({
    nftId: 'emerald-ape-042',
    quantity: 2,
  })

  await page.getByRole('button', { name: 'Diminuir quantidade' }).click()
  await expect(page.getByLabel('Quantidade no carrinho')).toHaveText('1')
  await expect(
    page.getByRole('button', { name: 'Ir para o checkout' }),
  ).toBeEnabled()
})

test('falha transitória do merge pós-login informa e permite retry', async ({
  page,
}) => {
  await addEmeraldApe(page)
  await openRoute(page, '/login')
  await setScenario(page, 'flaky-500')
  await page.locator('#login-email').fill('user@kurio.io')
  await page.locator('#login-password').fill('demo1234')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(
    page.getByRole('alert').filter({ hasText: 'carrinho não sincronizou' }),
  ).toBeVisible()
  await setScenario(page, 'default')
  await page
    .getByRole('button', { name: 'Tentar sincronizar carrinho' })
    .click()
  await page.waitForURL((url) => url.pathname !== '/login')

  await openRoute(page, '/cart')
  await expect(
    page.getByRole('heading', { name: 'Emerald Ape #042' }),
  ).toBeVisible()
})

test('checkout cria pedido e apresenta confirmação com snapshot e transação', async ({
  page,
}) => {
  await signIn(page)
  await addEmeraldApe(page)
  await openRoute(page, '/cart')
  await page.getByRole('button', { name: 'Ir para o checkout' }).click()
  await expect(page).toHaveURL(/\/checkout$/)

  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirmButton).toBeEnabled()
  await confirmButton.click()

  const confirmation = page.getByRole('dialog', { name: 'Compra confirmada' })
  await expect(confirmation).toBeVisible()
  await expect(
    confirmation.getByText('Emerald Ape #042', { exact: true }),
  ).toBeVisible()
  await expect(
    confirmation.getByText('0.004 ETH', { exact: true }),
  ).toBeVisible()
  await expect(confirmation.getByText(/^0x[0-9a-f]{32}$/i)).toBeVisible()
  await expect(
    confirmation.getByRole('link', { name: 'Ver transação' }),
  ).toBeVisible()
  await expect.poll(() => getOrdersCount(page)).toBe(1)
  await expect.poll(async () => (await getCart(page)).items).toEqual([])

  await confirmation
    .getByRole('button', { name: 'Voltar ao marketplace' })
    .click()
  await expect(page).toHaveURL((url) => url.pathname === '/')
})

test('retry após timeout reutiliza a tentativa e cria apenas um pedido', async ({
  page,
}) => {
  await signIn(page)
  await addEmeraldApe(page)
  await openRoute(page, '/cart')
  await page.getByRole('button', { name: 'Ir para o checkout' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirmButton).toBeEnabled()

  await setScenario(page, 'timeout-after-order-create')
  await confirmButton.click()
  const retryButton = page.getByRole('button', {
    name: 'Retomar tentativa de compra',
  })
  await expect(retryButton).toBeEnabled()
  await retryButton.click()

  await expect(
    page.getByRole('dialog', { name: 'Compra confirmada' }),
  ).toBeVisible()
  await expect.poll(() => getOrdersCount(page)).toBe(1)
})

test('checkout atualiza cotação após preço mudar e informa pagamento recusado', async ({
  page,
}) => {
  await signIn(page)
  await addEmeraldApe(page)
  await setScenario(page, 'price-changed-mid-checkout')
  await openRoute(page, '/checkout')

  await expect(
    page.getByText(
      'O preço de um NFT mudou. Revise os valores atualizados antes de confirmar.',
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Atualizar cotação' }).click()
  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirmButton).toBeEnabled()

  await setScenario(page, 'payment-declined')
  await confirmButton.click()
  await expect(
    page.getByRole('alert').filter({
      hasText:
        'O pagamento foi recusado. Revise sua carteira e tente novamente.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeEnabled()
  await expect.poll(() => getOrdersCount(page)).toBe(1)
})
