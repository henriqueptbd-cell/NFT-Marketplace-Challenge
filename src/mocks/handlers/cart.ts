import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { cartSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  nowIso,
  readJsonBody,
  requireUser,
} from '@/mocks/handlers/common'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { getMockState, updateMockState } from '@/mocks/store'

const cartItemInputSchema = z
  .object({ nftId: z.string().min(1), quantity: z.number().int().positive() })
  .strict()
const quantityInputSchema = z
  .object({ quantity: z.number().int().positive() })
  .strict()
const couponInputSchema = z.object({ code: z.string().trim().min(1) }).strict()

function getOrCreateCart(userId: string) {
  const existing = getMockState().carts.find((cart) => cart.userId === userId)
  if (existing) return existing
  const cart = cartSchema.parse({
    id: createId('cart'),
    userId,
    items: [],
    couponCode: null,
    updatedAt: nowIso(),
    version: 0,
  })
  updateMockState((draft) => {
    draft.carts.push(cart)
  })
  return cart
}

function setCart(
  userId: string,
  mutate: (cart: ReturnType<typeof cartSchema.parse>) => void,
) {
  let updated = getOrCreateCart(userId)
  updateMockState((draft) => {
    const index = draft.carts.findIndex((cart) => cart.userId === userId)
    if (index < 0) return
    const cart = draft.carts[index]
    if (!cart) return
    mutate(cart)
    cart.updatedAt = nowIso()
    cart.version += 1
    updated = cartSchema.parse(cart)
  })
  return updated
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const cart = getOrCreateCart(user.id)
    if (getActiveMockScenario() === 'empty')
      return HttpResponse.json({ ...cart, items: [], couponCode: null })
    return HttpResponse.json(cart)
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, cartItemInputSchema)
    if (!parsed.ok) return parsed.response
    const state = getMockState()
    const nft = state.nfts.find((item) => item.id === parsed.data.nftId)
    if (!nft) return apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
    const cart = getOrCreateCart(user.id)
    const existing = cart.items.find((item) => item.nftId === nft.id)
    const requestedQuantity = (existing?.quantity ?? 0) + parsed.data.quantity
    if (!nft.edition.isOpen && requestedQuantity > nft.edition.available) {
      return apiErrorResponse(
        409,
        'EDITION_SOLD_OUT',
        'Requested quantity exceeds available editions.',
      )
    }
    const updated = setCart(user.id, (draft) => {
      const item = draft.items.find((entry) => entry.nftId === nft.id)
      if (item) {
        item.quantity = requestedQuantity
        item.priceString = nft.priceString
      } else {
        draft.items.push({
          nftId: nft.id,
          quantity: parsed.data.quantity,
          priceString: nft.priceString,
        })
      }
    })
    return HttpResponse.json(updated, { status: 201 })
  }),

  http.patch('/api/cart/items/:nftId', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, quantityInputSchema)
    if (!parsed.ok) return parsed.response
    const nftId = String(params.nftId)
    const state = getMockState()
    const cart = state.carts.find((item) => item.userId === user.id)
    const item = cart?.items.find((entry) => entry.nftId === nftId)
    if (!item)
      return apiErrorResponse(404, 'NOT_FOUND', 'Cart item was not found.')
    const nft = state.nfts.find((entry) => entry.id === nftId)
    if (!nft) return apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
    if (!nft.edition.isOpen && parsed.data.quantity > nft.edition.available) {
      return apiErrorResponse(
        409,
        'EDITION_SOLD_OUT',
        'Requested quantity exceeds available editions.',
      )
    }
    return HttpResponse.json(
      setCart(user.id, (draft) => {
        const target = draft.items.find((entry) => entry.nftId === nftId)
        if (target) {
          target.quantity = parsed.data.quantity
          target.priceString = nft.priceString
        }
      }),
    )
  }),

  http.delete('/api/cart/items/:nftId', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const nftId = String(params.nftId)
    const cart = getMockState().carts.find((item) => item.userId === user.id)
    if (!cart?.items.some((item) => item.nftId === nftId)) {
      return apiErrorResponse(404, 'NOT_FOUND', 'Cart item was not found.')
    }
    return HttpResponse.json(
      setCart(user.id, (draft) => {
        draft.items = draft.items.filter((item) => item.nftId !== nftId)
      }),
    )
  }),

  http.delete('/api/cart', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    return HttpResponse.json(
      setCart(user.id, (draft) => {
        draft.items = []
        draft.couponCode = null
      }),
    )
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, couponInputSchema)
    if (!parsed.ok) return parsed.response
    if (getActiveMockScenario() === 'coupon-expired') {
      return apiErrorResponse(422, 'COUPON_EXPIRED', 'The coupon has expired.')
    }
    const code = parsed.data.code.toUpperCase()
    const coupon = getMockState().coupons.find((item) => item.code === code)
    if (!coupon)
      return apiErrorResponse(
        422,
        'COUPON_INVALID',
        'The coupon code is invalid.',
      )
    if (!coupon.active || coupon.expiresAt <= nowIso()) {
      return apiErrorResponse(422, 'COUPON_EXPIRED', 'The coupon has expired.')
    }
    return HttpResponse.json(
      setCart(user.id, (draft) => {
        draft.couponCode = coupon.code
      }),
    )
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    return HttpResponse.json(
      setCart(user.id, (draft) => {
        draft.couponCode = null
      }),
    )
  }),
]
