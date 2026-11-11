import { z } from 'zod'
import { networkSchema } from '@/api/types/common'

export const walletSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    name: z.string().min(1),
    address: z.string().min(1),
    network: networkSchema,
    isPrimary: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict()

export type Wallet = z.infer<typeof walletSchema>
