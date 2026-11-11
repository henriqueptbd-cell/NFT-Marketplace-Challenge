import { z } from 'zod'
import { apiClient } from '@/api/client'
import {
  networkSchema,
  walletSchema,
  walletTypeSchema,
  type Wallet,
} from '@/api/types'

const walletListSchema = z.array(walletSchema)
const walletInputSchema = z
  .object({
    name: z.string().trim().min(1).max(64),
    nickname: z.string().trim().min(1).max(48),
    address: z
      .string()
      .trim()
      .regex(/^0x[a-fA-F0-9]{40}$/),
    network: networkSchema,
    type: walletTypeSchema,
    ens: z.string().nullable(),
    referralCode: z.string().nullable(),
    email: z.string().trim().email(),
  })
  .strict()
const walletPatchSchema = walletInputSchema.partial().strict()

export async function getWallets(): Promise<Wallet[]> {
  const { data } = await apiClient.get<unknown>('/wallets')
  return walletListSchema.parse(data)
}

export async function addWallet(
  input: z.infer<typeof walletInputSchema>,
): Promise<Wallet> {
  const { data } = await apiClient.post<unknown>(
    '/wallets',
    walletInputSchema.parse(input),
  )
  return walletSchema.parse(data)
}

export async function updateWallet(
  walletId: string,
  input: z.infer<typeof walletPatchSchema>,
): Promise<Wallet> {
  const { data } = await apiClient.patch<unknown>(
    `/wallets/${encodeURIComponent(walletId)}`,
    walletPatchSchema.parse(input),
  )
  return walletSchema.parse(data)
}

export async function removeWallet(walletId: string): Promise<void> {
  await apiClient.delete(`/wallets/${encodeURIComponent(walletId)}`)
}

export async function setPrimaryWallet(walletId: string): Promise<Wallet> {
  const { data } = await apiClient.post<unknown>(
    `/wallets/${encodeURIComponent(walletId)}/primary`,
  )
  return walletSchema.parse(data)
}
