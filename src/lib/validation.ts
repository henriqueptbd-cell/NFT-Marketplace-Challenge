import { z } from 'zod'
import { networkSchema, decimalStringSchema } from '@/api/types/common'
import { walletTypeSchema } from '@/api/types/wallet'
import { nftSortSchema } from '@/api/types/nft'
import { decimalToUnits } from '@/lib/decimal'
import { accountCopy } from '@/lib/account-copy'

const ensNamePattern = /^(?:[a-z0-9-]+\.)*[a-z0-9-]+\.eth$/i

export const marketplaceSearchSchema = z
  .object({
    q: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    collections: z.array(z.string().trim().min(1)).default([]),
    networks: z.array(networkSchema).default([]),
    priceMin: decimalStringSchema.optional(),
    priceMax: decimalStringSchema.optional(),
    sort: nftSortSchema.default('relevance'),
    page: z.coerce.number().int().positive().default(1),
  })
  .strict()
  .superRefine((search, context) => {
    if (
      search.priceMin !== undefined &&
      search.priceMax !== undefined &&
      decimalToUnits(search.priceMin) > decimalToUnits(search.priceMax)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Minimum price cannot exceed maximum price',
        path: ['priceMin'],
      })
    }
  })

export const loginFormSchema = z
  .object({
    email: z.string().trim().email(accountCopy.validation.invalidEmail),
    password: z.string().min(1, accountCopy.validation.required),
    rememberMe: z.boolean(),
  })
  .strict()

export const registerFormSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, accountCopy.validation.required)
      .max(80),
    email: z.string().trim().email(accountCopy.validation.invalidEmail),
    password: z.string().min(8, accountCopy.validation.passwordLength),
    confirmPassword: z.string().min(8, accountCopy.validation.passwordLength),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: accountCopy.validation.passwordMismatch,
  })

export const authRedirectSearchSchema = z
  .object({ redirect: z.string().optional() })
  .strict()

export const profileFormSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, accountCopy.validation.required)
      .max(80),
    username: z
      .string()
      .trim()
      .min(2, accountCopy.validation.usernameLength)
      .max(32),
    email: z.string().trim().email(accountCopy.validation.invalidEmail),
    ens: z
      .string()
      .trim()
      .refine((value) => value === '' || ensNamePattern.test(value), {
        message: accountCopy.validation.ens,
      }),
    walletNickname: z.string().trim().max(48),
  })
  .strict()

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, accountCopy.validation.required),
    newPassword: z.string().min(8, accountCopy.validation.passwordLength),
    confirmPassword: z.string().min(8, accountCopy.validation.passwordLength),
  })
  .strict()
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: accountCopy.validation.passwordMismatch,
  })

export const walletFormSchema = z
  .object({
    name: z.string().trim().min(1, accountCopy.validation.required).max(64),
    nickname: z.string().trim().min(1, accountCopy.validation.required).max(48),
    network: networkSchema,
    address: z
      .string()
      .trim()
      .regex(/^0x[a-fA-F0-9]{40}$/, accountCopy.validation.walletAddress),
    type: walletTypeSchema,
    ens: z
      .string()
      .trim()
      .refine((value) => value === '' || ensNamePattern.test(value), {
        message: accountCopy.validation.ens,
      }),
    referralCode: z.string().trim().max(48),
    email: z.string().trim().email(accountCopy.validation.invalidEmail),
  })
  .strict()

export type MarketplaceSearch = z.infer<typeof marketplaceSearchSchema>
export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type ProfileFormValues = z.infer<typeof profileFormSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>
export type WalletFormValues = z.infer<typeof walletFormSchema>
