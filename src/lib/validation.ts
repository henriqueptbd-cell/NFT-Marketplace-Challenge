import { z } from 'zod'

export const marketplaceSearchSchema = z
  .object({
    q: z.string().trim().optional(),
    category: z.string().optional(),
    sort: z.enum(['recent', 'price-asc', 'price-desc']).default('recent'),
    page: z.coerce.number().int().positive().default(1),
  })
  .strict()

export const loginFormSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict()

export const registerFormSchema = z
  .object({
    username: z.string().trim().min(2).max(32),
    email: z.string().trim().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type MarketplaceSearch = z.infer<typeof marketplaceSearchSchema>
export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
