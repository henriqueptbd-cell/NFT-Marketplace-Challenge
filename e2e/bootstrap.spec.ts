import { expect, test, type Page } from '@playwright/test'

interface ApiOptions {
  method?: string
  body?: unknown
  accessToken?: string
  idempotencyKey?: string
}

interface ApiResult {
  status: number
  body: unknown
}

interface TestWindow extends Window {
  __mswReset: () => void
  __mswScenario: (name: string) => void
}

async function apiRequest(
  page: Page,
  path: string,
  options: ApiOptions = {},
): Promise<ApiResult> {
  return page.evaluate(
    async ({ requestPath, requestOptions }) => {
      const headers = new Headers()
      let body: string | undefined
      if (requestOptions.body !== undefined) {
        headers.set('Content-Type', 'application/json')
        body = JSON.stringify(requestOptions.body)
      }
      if (requestOptions.accessToken)
        headers.set('Authorization', `Bearer ${requestOptions.accessToken}`)
      if (requestOptions.idempotencyKey)
        headers.set('Idempotency-Key', requestOptions.idempotencyKey)
      const response = await fetch(requestPath, {
        method: requestOptions.method ?? 'GET',
        headers,
        body,
      })
      const responseBody: unknown = await response.json()
      return { status: response.status, body: responseBody }
    },
    { requestPath: path, requestOptions: options },
  )
}

async function openApp(page: Page): Promise<void> {
  const response = await page.goto('/')
  expect(response?.ok()).toBe(true)
  await page.waitForFunction(() => {
    const browserWindow = window as unknown as TestWindow
    return (
      typeof browserWindow.__mswScenario === 'function' &&
      document.querySelector('#root > main') !== null
    )
  })
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Expected an object response')
  }
  return value as Record<string, unknown>
}

async function login(page: Page, email = 'user@kurio.io'): Promise<string> {
  const result = await apiRequest(page, '/api/auth/login', {
    method: 'POST',
    body: { email, password: 'demo1234' },
  })
  expect(result.status).toBe(200)
  const auth = asObject(result.body)
  const session = asObject(auth.session)
  expect(typeof session.accessToken).toBe('string')
  return session.accessToken as string
}

async function createPendingOrder(
  page: Page,
  accessToken: string,
  key: string,
) {
  const cart = await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken,
    body: { nftId: 'emerald-ape-042', quantity: 1 },
  })
  expect(cart.status).toBe(201)

  const quote = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken,
    body: { walletId: 'wallet-user-ethereum' },
  })
  expect(quote.status).toBe(201)
  const quoteBody = asObject(quote.body)

  const order = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken,
    idempotencyKey: key,
    body: { quoteId: quoteBody.id, walletId: 'wallet-user-ethereum' },
  })
  expect(order.status).toBe(201)
  return asObject(order.body)
}

test('serves the shell and a 24-NFT catalog without image assets', async ({
  page,
}) => {
  await openApp(page)
  await expect(page).toHaveTitle('Kurio')
  await expect(page.locator('#root')).toBeVisible()

  const result = await apiRequest(page, '/api/nfts')
  expect(result.status).toBe(200)
  const nfts = result.body as Array<Record<string, unknown>>
  expect(nfts).toHaveLength(24)
  expect(new Set(nfts.map((nft) => nft.collection)).size).toBe(5)
  expect(new Set(nfts.map((nft) => nft.network)).size).toBe(3)
  expect(nfts.every((nft) => typeof nft.priceString === 'string')).toBe(true)
  expect(nfts.map((nft) => nft.priceString)).toContain('0.02')
  expect(nfts.map((nft) => nft.priceString)).toContain('12.30')
  expect(nfts.some((nft) => asObject(nft.edition).available === 0)).toBe(true)
  expect(nfts.some((nft) => nft.isRare === true)).toBe(true)
  expect(nfts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Emerald Ape #042',
        image: '/nfts/emerald-ape-042.webp',
      }),
      expect.objectContaining({
        name: 'Sage Nomad #089',
        image: '/nfts/sage-nomad-089.webp',
      }),
      expect.objectContaining({ name: 'Neon Vessel #552' }),
      expect.objectContaining({ name: 'Cosmic Bloom #118' }),
      expect.objectContaining({ name: 'Violet Nomad #314' }),
      expect.objectContaining({ name: 'Ivory Baron #088' }),
      expect.objectContaining({ name: 'Golden Beat #207' }),
      expect.objectContaining({ name: 'Golden Frequency #071' }),
      expect.objectContaining({ name: 'Golden Signal #160' }),
    ]),
  )
})

test('supports authenticated resource endpoints and idempotent order creation', async ({
  page,
}) => {
  await openApp(page)
  const accessToken = await login(page)

  const session = await apiRequest(page, '/api/auth/session', { accessToken })
  expect(session.status).toBe(200)
  expect(asObject(session.body)).not.toHaveProperty('password')

  const profile = await apiRequest(page, '/api/profile', { accessToken })
  expect(profile.status).toBe(200)
  const wallets = await apiRequest(page, '/api/wallets', { accessToken })
  expect(wallets.status).toBe(200)

  const favorite = await apiRequest(page, '/api/favorites/emerald-ape-042', {
    method: 'POST',
    accessToken,
  })
  expect(favorite.status).toBe(201)
  const favorites = await apiRequest(page, '/api/favorites', { accessToken })
  expect(favorites.status).toBe(200)
  expect(favorites.body).toHaveLength(1)

  const cart = await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken,
    body: { nftId: 'emerald-ape-042', quantity: 2 },
  })
  expect(cart.status).toBe(201)
  const coupon = await apiRequest(page, '/api/cart/coupon', {
    method: 'POST',
    accessToken,
    body: { code: 'KURIO10' },
  })
  expect(coupon.status).toBe(200)

  const quoteResult = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken,
    body: { walletId: 'wallet-user-ethereum' },
  })
  expect(quoteResult.status).toBe(201)
  const quote = asObject(quoteResult.body)
  expect(quote.subtotalString).toBe('2.38')
  expect(quote.discountString).toBe('0.238')
  expect(quote.networkFeeString).toBe('0.004')
  expect(quote.totalString).toBe('2.146')
  expect(typeof quote.totalString).toBe('string')

  const orderInput = { quoteId: quote.id, walletId: 'wallet-user-ethereum' }
  const missingKey = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken,
    body: orderInput,
  })
  expect(missingKey.status).toBe(400)
  expect(asObject(missingKey.body).code).toBe('IDEMPOTENCY_KEY_REQUIRED')

  const first = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken,
    idempotencyKey: 'e2e-order-key',
    body: orderInput,
  })
  expect(first.status).toBe(201)
  const firstOrder = asObject(first.body)
  expect(firstOrder.status).toBe('pending')

  const retry = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken,
    idempotencyKey: 'e2e-order-key',
    body: orderInput,
  })
  expect(retry.status).toBe(200)
  expect(asObject(retry.body).id).toBe(firstOrder.id)

  const conflict = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken,
    idempotencyKey: 'e2e-order-key',
    body: { quoteId: 'different-quote', walletId: 'wallet-user-ethereum' },
  })
  expect(conflict.status).toBe(409)
  expect(asObject(conflict.body).code).toBe('IDEMPOTENCY_CONFLICT')

  const confirmed = await apiRequest(
    page,
    `/api/orders/${String(firstOrder.id)}/confirm`,
    {
      method: 'POST',
      accessToken,
    },
  )
  expect(confirmed.status).toBe(200)
  expect(asObject(confirmed.body).status).toBe('confirmed')
  expect(typeof asObject(confirmed.body).transactionId).toBe('string')
  expect(
    (await apiRequest(page, '/api/orders', { accessToken })).body,
  ).toHaveLength(1)
  expect(
    asObject((await apiRequest(page, '/api/cart', { accessToken })).body).items,
  ).toHaveLength(0)
})

test('returns consistent error shapes and activates global scenarios', async ({
  page,
}) => {
  await openApp(page)
  const unauthenticated = await apiRequest(page, '/api/profile')
  expect(unauthenticated.status).toBe(401)
  expect(asObject(unauthenticated.body)).toMatchObject({ code: 'UNAUTHORIZED' })

  const badPage = await apiRequest(page, '/api/nfts?page=0')
  expect(badPage.status).toBe(400)
  expect(asObject(badPage.body)).toHaveProperty('message')
  const badNetwork = await apiRequest(page, '/api/nfts?network=Unknown')
  expect(badNetwork.status).toBe(400)
  expect(asObject(badNetwork.body).code).toBe('BAD_REQUEST')

  const missingNft = await apiRequest(page, '/api/nfts/not-a-real-nft')
  expect(missingNft.status).toBe(404)
  expect(asObject(missingNft.body).code).toBe('NOT_FOUND')

  const duplicateRegistration = await apiRequest(page, '/api/auth/register', {
    method: 'POST',
    body: {
      email: 'user@kurio.io',
      password: 'demo1234',
      displayName: 'Duplicate',
    },
  })
  expect(duplicateRegistration.status).toBe(409)
  expect(asObject(duplicateRegistration.body).code).toBe(
    'EMAIL_ALREADY_REGISTERED',
  )

  const accessToken = await login(page)
  const invalidCartItem = await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken,
    body: { nftId: 'emerald-ape-042', quantity: 0 },
  })
  expect(invalidCartItem.status).toBe(422)
  expect(asObject(invalidCartItem.body)).toHaveProperty('fieldErrors')

  const validCartItem = await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken,
    body: { nftId: 'emerald-ape-042', quantity: 1 },
  })
  expect(validCartItem.status).toBe(201)

  const forbiddenQuote = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken,
    body: { walletId: 'wallet-collector-polygon' },
  })
  expect(forbiddenQuote.status).toBe(403)
  expect(asObject(forbiddenQuote.body).code).toBe('FORBIDDEN')

  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('empty'),
  )
  expect((await apiRequest(page, '/api/nfts')).body).toEqual([])

  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('flaky-500'),
  )
  expect((await apiRequest(page, '/api/nfts')).status).toBe(200)
  const flaky = await apiRequest(page, '/api/nfts')
  expect(flaky.status).toBe(500)
  expect(asObject(flaky.body)).toMatchObject({ code: 'INTERNAL_ERROR' })

  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('session-expired'),
  )
  const expired = await apiRequest(page, '/api/profile', { accessToken })
  expect(expired.status).toBe(401)
  expect(asObject(expired.body)).toMatchObject({ code: 'UNAUTHORIZED' })
  await page.evaluate(() => (window as unknown as TestWindow).__mswReset())
})

test('simulates mid-checkout price changes, stock exhaustion and coupon expiry', async ({
  page,
}) => {
  await openApp(page)
  const accessToken = await login(page)
  const cart = await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken,
    body: { nftId: 'emerald-ape-042', quantity: 1 },
  })
  expect(cart.status).toBe(201)

  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario(
      'price-changed-mid-checkout',
    ),
  )
  const priceChange = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken,
    body: { walletId: 'wallet-user-ethereum' },
  })
  expect(priceChange.status).toBe(409)
  expect(asObject(priceChange.body).code).toBe('PRICE_CHANGED')
  const updatedNft = await apiRequest(page, '/api/nfts/emerald-ape-042')
  expect(asObject(updatedNft.body).priceString).toBe('1.29')

  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('default'),
  )
  const refreshedQuote = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken,
    body: { walletId: 'wallet-user-ethereum' },
  })
  expect(refreshedQuote.status).toBe(201)

  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('edition-sold-out'),
  )
  const soldOut = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken,
    body: { walletId: 'wallet-user-ethereum' },
  })
  expect(soldOut.status).toBe(409)
  expect(asObject(soldOut.body).code).toBe('EDITION_SOLD_OUT')

  await page.evaluate(() => (window as unknown as TestWindow).__mswReset())
  const resetToken = await login(page)
  await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken: resetToken,
    body: { nftId: 'emerald-ape-042', quantity: 1 },
  })
  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('coupon-expired'),
  )
  const expiredCoupon = await apiRequest(page, '/api/cart/coupon', {
    method: 'POST',
    accessToken: resetToken,
    body: { code: 'KURIO10' },
  })
  expect(expiredCoupon.status).toBe(422)
  expect(asObject(expiredCoupon.body).code).toBe('COUPON_EXPIRED')
})

test('models payment decline and timeout-after-order-create without duplicate orders', async ({
  page,
}) => {
  await openApp(page)
  const accessToken = await login(page)
  const order = await createPendingOrder(page, accessToken, 'e2e-declined-key')
  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('payment-declined'),
  )
  const declined = await apiRequest(
    page,
    `/api/orders/${String(order.id)}/confirm`,
    {
      method: 'POST',
      accessToken,
    },
  )
  expect(declined.status).toBe(200)
  expect(asObject(declined.body).status).toBe('declined')
  expect(asObject(declined.body).transactionId).toBeNull()

  await page.evaluate(() => (window as unknown as TestWindow).__mswReset())
  const resetToken = await login(page)
  const cart = await apiRequest(page, '/api/cart/items', {
    method: 'POST',
    accessToken: resetToken,
    body: { nftId: 'emerald-ape-042', quantity: 1 },
  })
  expect(cart.status).toBe(201)
  const quoteResponse = await apiRequest(page, '/api/quote', {
    method: 'POST',
    accessToken: resetToken,
    body: { walletId: 'wallet-user-ethereum' },
  })
  const quote = asObject(quoteResponse.body)
  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario(
      'timeout-after-order-create',
    ),
  )
  const input = { quoteId: quote.id, walletId: 'wallet-user-ethereum' }
  const timedOut = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken: resetToken,
    idempotencyKey: 'e2e-timeout-key',
    body: input,
  })
  expect(timedOut.status).toBe(500)
  expect(asObject(timedOut.body).code).toBe('TIMEOUT_AFTER_CREATE')

  const retried = await apiRequest(page, '/api/orders', {
    method: 'POST',
    accessToken: resetToken,
    idempotencyKey: 'e2e-timeout-key',
    body: input,
  })
  expect(retried.status).toBe(200)
  expect(asObject(retried.body).status).toBe('pending')
  expect(
    (await apiRequest(page, '/api/orders', { accessToken: resetToken })).body,
  ).toHaveLength(1)
})

test('delays REST responses by three seconds in slow-3s scenario', async ({
  page,
}) => {
  await openApp(page)
  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('slow-3s'),
  )
  const responsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/nfts',
  )
  const startedAt = Date.now()
  await page.evaluate(() => {
    void fetch('/api/nfts')
  })
  const response = await responsePromise
  const elapsed = Date.now() - startedAt
  expect(response.status()).toBe(200)
  expect(elapsed).toBeGreaterThanOrEqual(2_900)
})

test('delivers versioned Socket.IO updates out of order when requested', async ({
  page,
}) => {
  await openApp(page)
  await page.evaluate(() =>
    (window as unknown as TestWindow).__mswScenario('out-of-order'),
  )
  await page.addScriptTag({
    type: 'module',
    content: `
      import { createRealtimeClient } from '/src/api/realtime.ts';
      window.__kurioSocketEvents = [];
      const socket = createRealtimeClient();
      socket.on('nft.updated', (payload) => window.__kurioSocketEvents.push(payload));
      socket.on('connect', () => socket.emit('nft.subscribe', 'emerald-ape-042'));
      socket.connect();
    `,
  })
  await page.waitForFunction(
    () => {
      const events = (
        window as unknown as {
          __kurioSocketEvents?: Array<{ version: number }>
        }
      ).__kurioSocketEvents
      return events?.length === 2
    },
    { timeout: 10_000 },
  )
  const versions = await page.evaluate(() => {
    const events = (
      window as unknown as { __kurioSocketEvents: Array<{ version: number }> }
    ).__kurioSocketEvents
    return events.map((event) => event.version)
  })
  expect(versions[0]).toBeGreaterThan(versions[1] ?? Number.POSITIVE_INFINITY)
})
