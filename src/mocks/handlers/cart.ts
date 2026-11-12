import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { cartSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  nowIso,
  readJsonBody,
  requireCartOwner,
  requireUser,
} from '@/mocks/handlers/common'
import { consumeMockScenario, getActiveMockScenario } from '@/mocks/scenarios'
import { getMockState, updateMockState } from '@/mocks/store'

const cartItemInputSchema = z
  .object({ nftId: z.string().min(1), quantity: z.number().int().positive() })
  .strict()
const quantityInputSchema = z
  .object({ quantity: z.number().int().positive() })
  .strict()
const couponInputSchema = z.object({ code: z.string().trim().min(1) }).strict()

function getOrCreateCart(ownerId: string) {
  const existing = getMockState().carts.find((cart) => cart.userId === ownerId)
  if (existing) return existing
  const cart = cartSchema.parse({
    id: createId('cart'),
    userId: ownerId,
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
  ownerId: string,
  mutate: (cart: ReturnType<typeof cartSchema.parse>) => void,
) {
  let updated = getOrCreateCart(ownerId)
  updateMockState((draft) => {
    const index = draft.carts.findIndex((cart) => cart.userId === ownerId)
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

function isValidGuestCartId(value: string | null): value is string {
  return Boolean(value && /^[a-f\d-]{36}$/i.test(value.trim()))
}

function isCouponExpired(code: string | null): boolean {
  if (!code) return false
  const coupon = getMockState().coupons.find((item) => item.code === code)
  return !coupon || !coupon.active || coupon.expiresAt <= nowIso()
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    let cart = getOrCreateCart(ownerId)
    if (isCouponExpired(cart.couponCode)) {
      cart = setCart(ownerId, (draft) => {
        draft.couponCode = null
      })
    }
    if (getActiveMockScenario() === 'empty')
      return HttpResponse.json({ ...cart, items: [], couponCode: null })
    return HttpResponse.json(cart)
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    const parsed = await readJsonBody(request, cartItemInputSchema)
    if (!parsed.ok) return parsed.response
    const state = getMockState()
    const nft = state.nfts.find((item) => item.id === parsed.data.nftId)
    if (!nft) return apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
    const cart = getOrCreateCart(ownerId)
    const existing = cart.items.find((item) => item.nftId === nft.id)
    const requestedQuantity = (existing?.quantity ?? 0) + parsed.data.quantity
    if (!nft.edition.isOpen && requestedQuantity > nft.edition.available) {
      return apiErrorResponse(
        409,
        'EDITION_SOLD_OUT',
        'Requested quantity exceeds available editions.',
      )
    }
    const updated = setCart(ownerId, (draft) => {
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
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    const parsed = await readJsonBody(request, quantityInputSchema)
    if (!parsed.ok) return parsed.response
    const nftId = String(params.nftId)
    const state = getMockState()
    const cart = state.carts.find((item) => item.userId === ownerId)
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
      setCart(ownerId, (draft) => {
        const target = draft.items.find((entry) => entry.nftId === nftId)
        if (target) {
          target.quantity = parsed.data.quantity
          target.priceString = nft.priceString
        }
      }),
    )
  }),

  http.delete('/api/cart/items/:nftId', async ({ request, params }) => {
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    const nftId = String(params.nftId)
    const cart = getMockState().carts.find((item) => item.userId === ownerId)
    if (!cart?.items.some((item) => item.nftId === nftId)) {
      return apiErrorResponse(404, 'NOT_FOUND', 'Cart item was not found.')
    }
    return HttpResponse.json(
      setCart(ownerId, (draft) => {
        draft.items = draft.items.filter((item) => item.nftId !== nftId)
      }),
    )
  }),

  http.delete('/api/cart', async ({ request }) => {
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    return HttpResponse.json(
      setCart(ownerId, (draft) => {
        draft.items = []
        draft.couponCode = null
      }),
    )
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    const parsed = await readJsonBody(request, couponInputSchema)
    if (!parsed.ok) return parsed.response
    if (consumeMockScenario('coupon-expired')) {
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
      setCart(ownerId, (draft) => {
        draft.couponCode = coupon.code
      }),
    )
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    const ownerId = await requireCartOwner(request)
    if (ownerId instanceof Response) return ownerId
    return HttpResponse.json(
      setCart(ownerId, (draft) => {
        draft.couponCode = null
      }),
    )
  }),

  http.post('/api/cart/merge', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const guestCartId = request.headers.get('X-Guest-Cart-Id')?.trim() ?? null
    if (!isValidGuestCartId(guestCartId)) {
      return apiErrorResponse(
        400,
        'BAD_REQUEST',
        'A valid guest cart ID is required.',
      )
    }
    if (consumeMockScenario('cart-merge-fails')) {
      return apiErrorResponse(
        500,
        'INTERNAL_ERROR',
        'The guest cart could not be merged.',
      )
    }

    const guestOwnerId = `guest:${guestCartId}`
    const state = getMockState()
    const guestCart = state.carts.find((cart) => cart.userId === guestOwnerId)
    const userCart = getOrCreateCart(user.id)
    if (!guestCart || guestCart.items.length === 0) {
      return HttpResponse.json(userCart)
    }

    const validGuestCoupon = guestCart.couponCode
      ? state.coupons.find(
          (coupon) =>
            coupon.code === guestCart.couponCode &&
            coupon.active &&
            coupon.expiresAt > nowIso(),
        )
      : undefined
    let mergedCart = userCart
    updateMockState((draft) => {
      const target = draft.carts.find((cart) => cart.userId === user.id)
      const source = draft.carts.find((cart) => cart.userId === guestOwnerId)
      if (!target || !source) return
      for (const guestItem of source.items) {
        const nft = draft.nfts.find((item) => item.id === guestItem.nftId)
        const priceString = nft?.priceString ?? guestItem.priceString
        const existing = target.items.find(
          (item) => item.nftId === guestItem.nftId,
        )
        if (existing) {
          existing.quantity += guestItem.quantity
          existing.priceString = priceString
        } else {
          target.items.push({
            ...guestItem,
            priceString,
          })
        }
      }
      if (!target.couponCode && validGuestCoupon) {
        target.couponCode = validGuestCoupon.code
      }
      target.updatedAt = nowIso()
      target.version += 1
      source.items = []
      source.couponCode = null
      source.updatedAt = nowIso()
      source.version += 1
      mergedCart = cartSchema.parse(target)
    })
    return HttpResponse.json(mergedCart)
  }),
]
