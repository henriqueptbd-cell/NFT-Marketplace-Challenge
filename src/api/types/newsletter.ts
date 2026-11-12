import { z } from 'zod'

export const newsletterRequestSchema = z
  .object({
    email: z.string().email(),
  })
  .strict()

export const newsletterSubscriptionSchema = z
  .object({
    email: z.string().email(),
    subscribedAt: z.string().datetime(),
  })
  .strict()

export type NewsletterRequest = z.infer<typeof newsletterRequestSchema>
export type NewsletterSubscription = z.infer<
  typeof newsletterSubscriptionSchema
>
