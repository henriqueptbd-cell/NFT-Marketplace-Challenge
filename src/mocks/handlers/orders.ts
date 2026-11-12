import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { orderSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  nowIso,
  readJsonBody,
  requireUser,
} from '@/mocks/handlers/common'
import { consumeMockScenario, getActiveMockScenario } from '@/mocks/scenarios'
import { publishMockSocket } from '@/mocks/socket-bus'
import { getMockState, nextMockVersion, updateMockState } from '@/mocks/store'

const createOrderRequestSchema = z
  .object({ quoteId: z.string().min(1), walletId: z.string().min(1) })
  .strict()

function stableFingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableFingerprint).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const entries = Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableFingerprint(record[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function publishOrderUpdate(orderId: string): void {
  const order = getMockState().orders.find((item) => item.id === orderId)
  if (!order) return
  publishMockSocket('order.updated', {
    id: order.id,
    version: order.version,
    data: order,
  })
}

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    if (!idempotencyKey)
      return apiErrorResponse(
        400,
        'IDEMPOTENCY_KEY_REQUIRED',
        'Idempotency-Key header is required.',
      )

    const parsed = await readJsonBody(request, createOrderRequestSchema)
    if (!parsed.ok) return parsed.response
    const fingerprint = stableFingerprint(parsed.data)
    const state = getMockState()
    const existingRecord = state.idempotencyRecords.find(
      (record) => record.key === idempotencyKey,
    )
    if (existingRecord) {
      if (
        existingRecord.userId !== user.id ||
        existingRecord.bodyFingerprint !== fingerprint
      ) {
        return apiErrorResponse(
          409,
          'IDEMPOTENCY_CONFLICT',
          'This Idempotency-Key was already used with a different request body.',
        )
      }
      const existingOrder = state.orders.find(
        (order) =>
          order.id === existingRecord.orderId && order.userId === user.id,
      )
      if (!existingOrder)
        return apiErrorResponse(
          500,
          'INTERNAL_ERROR',
          'The idempotent order record is unavailable.',
        )
      return HttpResponse.json(existingOrder)
    }

    const quote = state.quotes.find(
      (item) => item.id === parsed.data.quoteId && item.userId === user.id,
    )
    if (!quote)
      return apiErrorResponse(404, 'NOT_FOUND', 'Quote was not found.')
    if (quote.expiresAt <= nowIso())
      return apiErrorResponse(422, 'QUOTE_EXPIRED', 'The quote has expired.')
    const wallet = state.wallets.find(
      (item) => item.id === parsed.data.walletId,
    )
    if (!wallet)
      return apiErrorResponse(404, 'NOT_FOUND', 'Wallet was not found.')
    if (wallet.userId !== user.id)
      return apiErrorResponse(
        403,
        'FORBIDDEN',
        'Wallet belongs to another user.',
      )

    for (const item of quote.items) {
      const nft = state.nfts.find((entry) => entry.id === item.nftId)
      if (!nft)
        return apiErrorResponse(
          404,
          'NOT_FOUND',
          'An NFT in the quote no longer exists.',
        )
      if (!nft.edition.isOpen && item.quantity > nft.edition.available) {
        return apiErrorResponse(
          409,
          'EDITION_SOLD_OUT',
          'An edition in the quote is no longer available.',
        )
      }
      if (nft.priceString !== item.priceString) {
        return apiErrorResponse(
          409,
          'PRICE_CHANGED',
          'An NFT price changed after the quote was created.',
        )
      }
    }

    const order = orderSchema.parse({
      id: createId('order'),
      userId: user.id,
      quoteId: quote.id,
      status: 'pending',
      snapshot: {
        items: quote.items,
        subtotalString: quote.subtotalString,
        discountString: quote.discountString,
        networkFeeString: quote.networkFeeString,
        totalString: quote.totalString,
        couponCode: quote.couponCode,
        walletAddress: wallet.address,
      },
      transactionId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      version: nextMockVersion(),
    })
    updateMockState((draft) => {
      draft.orders.push(order)
      draft.idempotencyRecords.push({
        key: idempotencyKey,
        userId: user.id,
        bodyFingerprint: fingerprint,
        orderId: order.id,
      })
    })
    publishOrderUpdate(order.id)

    if (consumeMockScenario('timeout-after-order-create')) {
      return apiErrorResponse(
        500,
        'TIMEOUT_AFTER_CREATE',
        'The request timed out after the order was created; retry with the same Idempotency-Key.',
      )
    }
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    if (getActiveMockScenario() === 'empty') return HttpResponse.json([])
    return HttpResponse.json(
      getMockState().orders.filter((order) => order.userId === user.id),
    )
  }),

  http.get('/api/orders/:orderId', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const order = getMockState().orders.find(
      (item) => item.id === String(params.orderId),
    )
    if (!order)
      return apiErrorResponse(404, 'NOT_FOUND', 'Order was not found.')
    if (order.userId !== user.id)
      return apiErrorResponse(
        403,
        'FORBIDDEN',
        'Order belongs to another user.',
      )
    return HttpResponse.json(order)
  }),

  http.post('/api/orders/:orderId/confirm', async ({ request, params }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const orderId = String(params.orderId)
    const state = getMockState()
    const order = state.orders.find((item) => item.id === orderId)
    if (!order)
      return apiErrorResponse(404, 'NOT_FOUND', 'Order was not found.')
    if (order.userId !== user.id)
      return apiErrorResponse(
        403,
        'FORBIDDEN',
        'Order belongs to another user.',
      )
    if (order.status !== 'pending') return HttpResponse.json(order)

    const declined = consumeMockScenario('payment-declined')
    const updatedOrder = orderSchema.parse({
      ...order,
      status: declined ? 'declined' : 'confirmed',
      transactionId: declined
        ? null
        : `0x${crypto.randomUUID().replaceAll('-', '')}`,
      updatedAt: nowIso(),
      version: nextMockVersion(),
    })
    updateMockState((draft) => {
      const target = draft.orders.find((item) => item.id === orderId)
      if (target) Object.assign(target, updatedOrder)
      if (!declined) {
        const purchasedQuantities = new Map<string, number>()
        for (const orderItem of updatedOrder.snapshot.items) {
          purchasedQuantities.set(
            orderItem.nftId,
            (purchasedQuantities.get(orderItem.nftId) ?? 0) +
              orderItem.quantity,
          )
        }
        for (const orderItem of updatedOrder.snapshot.items) {
          const nft = draft.nfts.find((item) => item.id === orderItem.nftId)
          if (nft && !nft.edition.isOpen) {
            nft.edition.available = Math.max(
              0,
              nft.edition.available - orderItem.quantity,
            )
          }
        }
        const cart = draft.carts.find((item) => item.userId === user.id)
        if (cart) {
          cart.items = cart.items.flatMap((cartItem) => {
            const quantityToRemove =
              purchasedQuantities.get(cartItem.nftId) ?? 0
            const removedQuantity = Math.min(
              cartItem.quantity,
              quantityToRemove,
            )
            purchasedQuantities.set(
              cartItem.nftId,
              quantityToRemove - removedQuantity,
            )
            const remainingQuantity = cartItem.quantity - removedQuantity
            return remainingQuantity > 0
              ? [{ ...cartItem, quantity: remainingQuantity }]
              : []
          })
          if (cart.items.length === 0) cart.couponCode = null
          cart.updatedAt = nowIso()
          cart.version += 1
        }
      }
    })
    publishOrderUpdate(orderId)
    return HttpResponse.json(updatedOrder)
  }),
]
