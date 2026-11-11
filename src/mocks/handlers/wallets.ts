import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { networkSchema, walletSchema, walletTypeSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  nowIso,
  readJsonBody,
  requireUser,
} from '@/mocks/handlers/common'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { getMockState, updateMockState } from '@/mocks/store'

const walletInputSchema = z
  .object({
    name: z.string().trim().min(1).max(64),
    nickname: z.string().trim().min(1).max(48),
    address: z
      .string()
      .trim()
      .regex(/^0x[a-fA-F0-9]{40}$/),
    network: networkSchema,
    type: walletTypeSchema,
    ens: z.string().nullable(),
    referralCode: z.string().nullable(),
    email: z.string().trim().email(),
  })
  .strict()
const walletPatchSchema = walletInputSchema.partial().strict()

export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    if (getActiveMockScenario() === 'empty') return HttpResponse.json([])
    return HttpResponse.json(
      getMockState().wallets.filter((wallet) => wallet.userId === user.id),
    )
  }),

  http.post('/api/wallets', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, walletInputSchema)
    if (!parsed.ok) return parsed.response
    const state = getMockState()
    if (
      state.wallets.some(
        (item) =>
          item.userId === user.id &&
          item.address.toLowerCase() === parsed.data.address.toLowerCase() &&
          item.network === parsed.data.network,
      )
    ) {
      return apiErrorResponse(
        409,
        'WALLET_ALREADY_CONNECTED',
        'This wallet is already connected.',
        { address: ['Esta carteira já está conectada.'] },
      )
    }
    const wallet = walletSchema.parse({
      id: createId('wallet'),
      userId: user.id,
      ...parsed.data,
      isPrimary: !state.wallets.some(
        (item) => item.userId === user.id && item.isPrimary,
      ),
      createdAt: nowIso(),
    })
    updateMockState((draft) => {
      draft.wallets.push(wallet)
    })
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch('/api/wallets/:walletId', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, walletPatchSchema)
    if (!parsed.ok) return parsed.response
    const walletId = String(params.walletId)
    const wallet = getMockState().wallets.find((item) => item.id === walletId)
    if (!wallet)
      return apiErrorResponse(404, 'NOT_FOUND', 'Wallet was not found.')
    if (wallet.userId !== user.id)
      return apiErrorResponse(
        403,
        'FORBIDDEN',
        'Wallet belongs to another user.',
      )
    const duplicate = getMockState().wallets.some(
      (item) =>
        item.id !== walletId &&
        item.userId === user.id &&
        item.network === (parsed.data.network ?? wallet.network) &&
        item.address.toLowerCase() ===
          (parsed.data.address ?? wallet.address).toLowerCase(),
    )
    if (duplicate)
      return apiErrorResponse(
        409,
        'WALLET_ALREADY_CONNECTED',
        'Esta carteira já está conectada.',
        { address: ['Esta carteira já está conectada.'] },
      )
    const updated = walletSchema.parse({ ...wallet, ...parsed.data })
    updateMockState((draft) => {
      const index = draft.wallets.findIndex((item) => item.id === walletId)
      if (index >= 0) draft.wallets[index] = updated
    })
    return HttpResponse.json(updated)
  }),

  http.delete('/api/wallets/:walletId', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const walletId = String(params.walletId)
    const state = getMockState()
    const wallet = state.wallets.find((item) => item.id === walletId)
    if (!wallet)
      return apiErrorResponse(404, 'NOT_FOUND', 'Wallet was not found.')
    if (wallet.userId !== user.id)
      return apiErrorResponse(
        403,
        'FORBIDDEN',
        'Wallet belongs to another user.',
      )
    const ownedWallets = state.wallets.filter((item) => item.userId === user.id)
    if (ownedWallets.length === 1)
      return apiErrorResponse(
        409,
        'LAST_WALLET',
        'The last connected wallet cannot be removed.',
      )
    updateMockState((draft) => {
      draft.wallets = draft.wallets.filter((item) => item.id !== walletId)
      if (wallet.isPrimary) {
        const replacement = draft.wallets.find(
          (item) => item.userId === user.id,
        )
        if (replacement) replacement.isPrimary = true
      }
    })
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/wallets/:walletId/primary', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const walletId = String(params.walletId)
    const wallet = getMockState().wallets.find((item) => item.id === walletId)
    if (!wallet)
      return apiErrorResponse(404, 'NOT_FOUND', 'Wallet was not found.')
    if (wallet.userId !== user.id)
      return apiErrorResponse(
        403,
        'FORBIDDEN',
        'Wallet belongs to another user.',
      )
    updateMockState((draft) => {
      draft.wallets = draft.wallets.map((item) => ({
        ...item,
        isPrimary:
          item.userId === user.id && item.id === walletId
            ? true
            : item.userId === user.id
              ? false
              : item.isPrimary,
      }))
    })
    const updated = getMockState().wallets.find((item) => item.id === walletId)
    return updated
      ? HttpResponse.json(updated)
      : apiErrorResponse(
          500,
          'INTERNAL_ERROR',
          'Could not set the primary wallet.',
        )
  }),
]
