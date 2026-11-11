import { z } from 'zod'
import { networkSchema } from '@/api/types/common'

export const walletTypeSchema = z.enum(['software', 'hardware', 'custodial'])

export const walletSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    name: z.string().min(1),
    nickname: z.string().min(1).max(48),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    network: networkSchema,
    type: walletTypeSchema,
    ens: z.string().nullable(),
    referralCode: z.string().nullable(),
    email: z.string().email(),
    isPrimary: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict()

export type WalletType = z.infer<typeof walletTypeSchema>
export type Wallet = z.infer<typeof walletSchema>
