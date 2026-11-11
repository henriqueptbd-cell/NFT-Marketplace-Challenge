import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  decimalToUnits,
  addDecimalStrings,
  multiplyDecimalString,
  percentageOfDecimal,
  subtractDecimalStrings,
  unitsToDecimal,
} from '@/lib/decimal'
import { quoteSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  nowIso,
  readJsonBody,
  requireUser,
} from '@/mocks/handlers/common'
import { networkFeeFixtures } from '@/mocks/fixtures/network-fees'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { publishMockSocket } from '@/mocks/socket-bus'
import { getMockState, nextMockVersion, updateMockState } from '@/mocks/store'

const quoteRequestSchema = z
  .object({ walletId: z.string().nullable().optional() })
  .strict()

function publishNftUpdate(nftId: string): void {
  const nft = getMockState().nfts.find((item) => item.id === nftId)
  if (!nft) return
  publishMockSocket('nft.updated', {
    id: nft.id,
    version: nextMockVersion(),
    data: nft,
  })
}

export const quoteHandlers = [
  http.post('/api/quote', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, quoteRequestSchema)
    if (!parsed.ok) return parsed.response

    let state = getMockState()
    const cart = state.carts.find((item) => item.userId === user.id)
    if (!cart || cart.items.length === 0)
      return apiErrorResponse(
        422,
        'CART_EMPTY',
        'The cart has no items to quote.',
      )

    if (parsed.data.walletId) {
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
    }

    if (getActiveMockScenario() === 'price-changed-mid-checkout') {
      const firstItem = cart.items[0]
      const nft = firstItem
        ? state.nfts.find((item) => item.id === firstItem.nftId)
        : undefined
      if (nft && firstItem) {
        const revisedPrice = addDecimalStrings(nft.priceString, '0.10')
        updateMockState((draft) => {
          const target = draft.nfts.find((item) => item.id === nft.id)
          if (target) target.priceString = revisedPrice
          const cartTarget = draft.carts.find((item) => item.userId === user.id)
          const cartItem = cartTarget?.items.find(
            (item) => item.nftId === nft.id,
          )
          if (cartItem) cartItem.priceString = revisedPrice
        })
        publishNftUpdate(nft.id)
        return apiErrorResponse(
          409,
          'PRICE_CHANGED',
          'An NFT price changed while the quote was being prepared.',
        )
      }
    }

    if (getActiveMockScenario() === 'edition-sold-out') {
      const firstItem = cart.items[0]
      if (firstItem) {
        updateMockState((draft) => {
          const nft = draft.nfts.find((item) => item.id === firstItem.nftId)
          if (nft) nft.edition = { ...nft.edition, available: 0, isOpen: false }
        })
        publishNftUpdate(firstItem.nftId)
        return apiErrorResponse(
          409,
          'EDITION_SOLD_OUT',
          'An item in the cart has sold out.',
        )
      }
    }

    state = getMockState()
    const latestCart = state.carts.find((item) => item.userId === user.id)
    if (!latestCart || latestCart.items.length === 0)
      return apiErrorResponse(
        422,
        'CART_EMPTY',
        'The cart has no items to quote.',
      )

    const quoteItems = []
    let subtotalString = '0'
    for (const cartItem of latestCart.items) {
      const nft = state.nfts.find((item) => item.id === cartItem.nftId)
      if (!nft)
        return apiErrorResponse(
          404,
          'NOT_FOUND',
          'An NFT in the cart no longer exists.',
        )
      if (!nft.edition.isOpen && cartItem.quantity > nft.edition.available) {
        return apiErrorResponse(
          409,
          'EDITION_SOLD_OUT',
          'Requested quantity exceeds available editions.',
        )
      }
      if (cartItem.priceString !== nft.priceString) {
        return apiErrorResponse(
          409,
          'PRICE_CHANGED',
          'An NFT price changed; refresh the cart and request a new quote.',
        )
      }
      subtotalString = addDecimalStrings(
        subtotalString,
        multiplyDecimalString(nft.priceString, cartItem.quantity),
      )
      quoteItems.push({
        nftId: nft.id,
        name: nft.name,
        image: nft.image,
        quantity: cartItem.quantity,
        priceString: nft.priceString,
        edition: nft.edition.isOpen
          ? 'Open edition'
          : `${nft.edition.available}/${nft.edition.total}`,
        network: nft.network,
      })
    }

    let discountString = '0'
    let couponCode: string | null = null
    if (latestCart.couponCode) {
      const coupon = state.coupons.find(
        (item) => item.code === latestCart.couponCode,
      )
      if (!coupon || !coupon.active || coupon.expiresAt <= nowIso()) {
        return apiErrorResponse(
          422,
          'COUPON_EXPIRED',
          'The cart coupon is no longer valid.',
        )
      }
      couponCode = coupon.code
      if (coupon.discountType === 'percentage') {
        discountString = percentageOfDecimal(
          subtotalString,
          coupon.discountValue,
        )
      } else {
        discountString =
          decimalToUnits(coupon.discountValue) > decimalToUnits(subtotalString)
            ? subtotalString
            : coupon.discountValue
      }
    }

    const wallet = parsed.data.walletId
      ? state.wallets.find((item) => item.id === parsed.data.walletId)
      : undefined
    const feeNetwork = wallet?.network ?? quoteItems[0]?.network ?? 'Ethereum'
    const networkFeeString = networkFeeFixtures[feeNetwork]
    const netSubtotal = subtractDecimalStrings(subtotalString, discountString)
    const totalString = unitsToDecimal(
      decimalToUnits(netSubtotal) + decimalToUnits(networkFeeString),
    )
    const quote = quoteSchema.parse({
      id: createId('quote'),
      userId: user.id,
      cartId: latestCart.id,
      walletId: wallet?.id ?? null,
      items: quoteItems,
      subtotalString,
      discountString,
      networkFeeString,
      totalString,
      couponCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      version: nextMockVersion(),
    })
    updateMockState((draft) => {
      draft.quotes.push(quote)
    })
    return HttpResponse.json(quote, { status: 201 })
  }),
]
