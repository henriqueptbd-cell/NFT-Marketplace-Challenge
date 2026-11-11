import { z } from 'zod'
import { apiClient } from '@/api/client'
import { quoteSchema, type Quote } from '@/api/types'

const createQuoteRequestSchema = z
  .object({ walletId: z.string().nullable().optional() })
  .strict()

export async function createQuote(
  input: z.infer<typeof createQuoteRequestSchema> = {},
): Promise<Quote> {
  const { data } = await apiClient.post<unknown>(
    '/quote',
    createQuoteRequestSchema.parse(input),
  )
  return quoteSchema.parse(data)
}
