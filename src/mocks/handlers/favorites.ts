import { http, HttpResponse } from 'msw'
import { apiErrorResponse, requireUser } from '@/mocks/handlers/common'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { createId, nowIso } from '@/mocks/handlers/common'
import { getMockState, updateMockState } from '@/mocks/store'

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    if (getActiveMockScenario() === 'empty') return HttpResponse.json([])
    return HttpResponse.json(
      getMockState().favorites.filter(
        (favorite) => favorite.userId === user.id,
      ),
    )
  }),

  http.post('/api/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const state = getMockState()
    const nft = state.nfts.find((item) => item.id === params.nftId)
    if (!nft) return apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
    const existing = state.favorites.find(
      (item) => item.userId === user.id && item.nftId === nft.id,
    )
    if (existing) return HttpResponse.json(existing)

    const favorite = {
      id: createId('favorite'),
      userId: user.id,
      nftId: nft.id,
      createdAt: nowIso(),
    }
    updateMockState((draft) => {
      draft.favorites.push(favorite)
    })
    return HttpResponse.json(favorite, { status: 201 })
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const state = getMockState()
    const favorite = state.favorites.find(
      (item) => item.userId === user.id && item.nftId === params.nftId,
    )
    if (!favorite)
      return apiErrorResponse(404, 'NOT_FOUND', 'Favorite was not found.')
    updateMockState((draft) => {
      draft.favorites = draft.favorites.filter(
        (item) => item.id !== favorite.id,
      )
    })
    return HttpResponse.json({ success: true })
  }),
]
