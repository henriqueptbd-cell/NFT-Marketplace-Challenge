import { z } from 'zod'
import { apiClient } from '@/api/client'
import { networkSchema, walletSchema, type Wallet } from '@/api/types'

const walletListSchema = z.array(walletSchema)
const walletInputSchema = z
  .object({
    name: z.string().min(1),
    address: z.string().min(1),
    network: networkSchema,
  })
  .strict()
const walletPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    network: networkSchema.optional(),
  })
  .strict()

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
