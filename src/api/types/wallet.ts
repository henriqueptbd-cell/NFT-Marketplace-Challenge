import { z } from 'zod'
import { networkSchema, type Network } from '@/api/types/common'

export const walletTypeSchema = z.enum(['software', 'hardware', 'custodial'])

const evmAddressPattern = /^0x[a-fA-F0-9]{40}$/
const solanaAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidWalletAddress(
  address: string,
  network: Network,
): boolean {
  return network === 'Solana'
    ? solanaAddressPattern.test(address)
    : evmAddressPattern.test(address)
}

export function walletAddressesEqual(
  left: string,
  right: string,
  network: Network,
): boolean {
  return network === 'Solana'
    ? left === right
    : left.toLowerCase() === right.toLowerCase()
}

function validateWalletAddress(
  value: { address: string; network: Network },
  context: z.RefinementCtx,
) {
  if (isValidWalletAddress(value.address, value.network)) return
  context.addIssue({
    code: 'custom',
    path: ['address'],
    message: 'Wallet address format does not match the selected network.',
  })
}

const walletInputObjectSchema = z
  .object({
    name: z.string().trim().min(1).max(64),
    nickname: z.string().trim().min(1).max(48),
    address: z.string().trim().min(1),
    network: networkSchema,
    type: walletTypeSchema,
    ens: z.string().nullable(),
    referralCode: z.string().nullable(),
    email: z.string().trim().email(),
  })
  .strict()

export const walletInputSchema = walletInputObjectSchema.superRefine(
  validateWalletAddress,
)
export const walletPatchSchema = walletInputObjectSchema.partial().strict()

export const walletSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    name: z.string().min(1),
    nickname: z.string().min(1).max(48),
    address: z.string().min(1),
    network: networkSchema,
    type: walletTypeSchema,
    ens: z.string().nullable(),
    referralCode: z.string().nullable(),
    email: z.string().email(),
    isPrimary: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict()
  .superRefine(validateWalletAddress)

export type WalletType = z.infer<typeof walletTypeSchema>
export type Wallet = z.infer<typeof walletSchema>
