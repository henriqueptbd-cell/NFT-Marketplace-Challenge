import { expect, test, type Page } from '@playwright/test'

interface TestWindow extends Window {
  __mswScenario: (name: string) => void
}

async function openRoute(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForFunction(() => {
    const browserWindow = window as unknown as TestWindow
    const root = document.querySelector('#root')
    return (
      typeof browserWindow.__mswScenario === 'function' &&
      root !== null &&
      root.childElementCount > 0
    )
  })
}

function authDialog(page: Page) {
  return page.getByRole('dialog')
}

async function signInThroughForm(
  page: Page,
  email = 'user@kurio.io',
  password = 'demo1234',
  redirect?: string,
  rememberMe = false,
): Promise<void> {
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  await openRoute(page, `/login${query}`)
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  if (rememberMe) await page.locator('#login-remember-me').check()
  await expect(authDialog(page)).toBeVisible()
  await authDialog(page)
    .getByRole('button', { name: 'Entrar', exact: true })
    .click()
  await page.waitForFunction(
    () => window.localStorage.getItem('kurio:user:v1') !== null,
  )
  await expect(authDialog(page)).toBeHidden()
  if (redirect) await page.waitForURL((url) => url.pathname === redirect)
}

test('login redireciona, restaura sessão após refresh e logout remove a sessão', async ({
  page,
}) => {
  await signInThroughForm(page, 'user@kurio.io', 'demo1234', '/profile', true)
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByLabel('Nome de exibição')).toBeVisible()

  const storedUser = await page.evaluate(() => {
    const stored = window.localStorage.getItem('kurio:user:v1')
    return stored ? (JSON.parse(stored) as Record<string, unknown>) : null
  })
  expect(storedUser).not.toBeNull()
  expect(storedUser).not.toHaveProperty('password')
  expect(storedUser).not.toHaveProperty('mockSessionToken')

  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toBeVisible()
  const restoredStatus = await page.evaluate(
    async () =>
      (
        await fetch('/api/auth/session', {
          credentials: 'include',
        })
      ).status,
  )
  expect(restoredStatus).toBe(200)
  const rememberedLifetime = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    })
    const body = (await response.json()) as {
      session: { expiresAt: string }
    }
    return Date.parse(body.session.expiresAt) - Date.now()
  })
  expect(rememberedLifetime).toBeGreaterThan(29 * 24 * 60 * 60 * 1000)
  const rememberedCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'kurio_session',
  )
  expect(rememberedCookie?.expires).toBeGreaterThan(
    Date.now() / 1000 + 28 * 24 * 60 * 60,
  )

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(
    page.locator('header').getByRole('button', { name: 'Entrar' }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem('kurio:user:v1')),
    )
    .toBeNull()
  const loggedOutStatus = await page.evaluate(
    async () =>
      (
        await fetch('/api/auth/session', {
          credentials: 'include',
        })
      ).status,
  )
  expect(loggedOutStatus).toBe(401)
})

test('registro liga e-mail duplicado ao campo e-mail', async ({ page }) => {
  await openRoute(page, '/register')
  await expect(authDialog(page)).toBeVisible()
  await page.locator('#register-name').fill('Colecionador de demonstração')
  await page.locator('#register-email').fill('user@kurio.io')
  await page.locator('#register-password').fill('demo1234')
  await page.locator('#register-confirm-password').fill('demo1234')
  await authDialog(page)
    .getByRole('button', { name: 'Criar perfil', exact: true })
    .click()

  await expect(page.locator('#register-email')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
})

test('perfil e senha persistem após atualizar a conta', async ({ page }) => {
  await signInThroughForm(page)
  await openRoute(page, '/profile')
  await expect(page.getByLabel('Nome de exibição')).toBeVisible()

  await page
    .getByLabel('Nome de exibição')
    .fill('Colecionador Kurio Atualizado')
  await page.getByLabel('Nome de usuário').fill('kurio-atualizado')
  await page.getByLabel('ENS (.eth)').fill('kurio-atualizado.eth')
  await page.getByLabel('Apelido da carteira').fill('Carteira Kurio')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Seu perfil foi atualizado.')).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue(
    'Colecionador Kurio Atualizado',
  )
  await expect(page.getByLabel('Nome de usuário')).toHaveValue(
    'kurio-atualizado',
  )
  await expect(page.getByLabel('ENS (.eth)')).toHaveValue(
    'kurio-atualizado.eth',
  )

  await page.locator('#profile-current-password').fill('demo1234')
  await page.locator('#profile-new-password').fill('nova-senha-1234')
  await page.locator('#profile-confirm-password').fill('nova-senha-1234')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByText('Sua senha foi alterada.')).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(
    page.locator('header').getByRole('button', { name: 'Entrar' }),
  ).toBeVisible()
  await signInThroughForm(page, 'user@kurio.io', 'nova-senha-1234')
})

test('carteiras validam endereço, preenchem o secundário e abrem drawer mobile', async ({
  page,
}) => {
  await signInThroughForm(page, 'collector@kurio.io')
  await openRoute(page, '/wallets')
  await expect(page.locator('#primary-wallet-address')).toBeVisible()

  await page.locator('#primary-wallet-address').fill('0xinvalid')
  await page.getByRole('button', { name: 'Salvar carteiras' }).click()
  await expect(page.locator('#primary-wallet-address')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(
    page.getByText('Informe um endereço 0x válido com 42 caracteres.'),
  ).toBeVisible()

  const primaryAddress = `0x${'3'.repeat(40)}`
  await page.locator('#primary-wallet-address').fill(primaryAddress)
  await page
    .getByRole('checkbox', { name: 'Adicionar carteira secundária' })
    .check()
  await page
    .getByRole('checkbox', { name: 'Igual à carteira principal' })
    .check()
  await expect(page.locator('#secondary-wallet-address')).toHaveValue(
    primaryAddress,
  )
  await page
    .getByRole('checkbox', { name: 'Igual à carteira principal' })
    .uncheck()
  const secondaryAddress = `0x${'4'.repeat(40)}`
  await page.locator('#secondary-wallet-address').fill(secondaryAddress)
  await page.getByRole('button', { name: 'Salvar carteiras' }).click()
  await expect(
    page.getByText('Suas carteiras foram atualizadas.'),
  ).toBeVisible()

  await page.reload()
  await expect(page.locator('#primary-wallet-address')).toHaveValue(
    primaryAddress,
  )
  await expect(page.locator('#secondary-wallet-address')).toHaveValue(
    secondaryAddress,
  )

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.getByRole('button', { name: 'Abrir navegação da conta' }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
})

test('401 por sessão expirada abre o card de login sobre a rota atual', async ({
  page,
}) => {
  await signInThroughForm(page)
  const sessionLifetime = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    })
    const body = (await response.json()) as {
      session: { expiresAt: string }
    }
    return Date.parse(body.session.expiresAt) - Date.now()
  })
  expect(sessionLifetime).toBeLessThanOrEqual(60 * 60 * 1000)
  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'kurio_session',
  )
  expect(sessionCookie?.expires).toBe(-1)
  await page.evaluate(() => {
    const browserWindow = window as unknown as TestWindow
    browserWindow.__mswScenario('session-expired')
  })
  await page.goto('/profile')
  await expect(authDialog(page)).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/profile')
  await expect(page.getByText('Sua sessão expirou')).toBeVisible()
})

test('card de autenticação sobrepõe a rota, alterna abas e fecha com Esc', async ({
  page,
}) => {
  await openRoute(page, '/')
  await page.locator('header').getByRole('button', { name: 'Entrar' }).click()

  const dialog = authDialog(page)
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'Entrar', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#login-email')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/')

  await dialog.getByRole('tab', { name: 'Criar conta' }).click()
  await expect(page.locator('#register-name')).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: 'Criar perfil de colecionador' }),
  ).toBeVisible()

  await dialog.getByRole('tab', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#login-email')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('login social autentica com o provedor mockado', async ({ page }) => {
  await openRoute(page, '/')
  await page.locator('header').getByRole('button', { name: 'Entrar' }).click()
  const dialog = authDialog(page)
  await expect(dialog).toBeVisible()

  await dialog.getByRole('button', { name: 'Google' }).click()
  await page.waitForFunction(
    () => window.localStorage.getItem('kurio:user:v1') !== null,
  )
  await expect(dialog).toBeHidden()
  await expect(
    page.locator('header').getByRole('button', { name: 'Entrar' }),
  ).toBeHidden()
})
