import { http, HttpResponse } from 'msw'
import { newsletterRequestSchema } from '@/api/types'
import { nowIso, readJsonBody } from '@/mocks/handlers/common'

export const newsletterHandlers = [
  http.post('/api/newsletter', async ({ request }) => {
    const body = await readJsonBody(request, newsletterRequestSchema)
    if (!body.ok) return body.response

    return HttpResponse.json(
      { email: body.data.email, subscribedAt: nowIso() },
      { status: 201 },
    )
  }),
]
