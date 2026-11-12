import { apiClient } from '@/api/client'
import {
  newsletterSubscriptionSchema,
  type NewsletterRequest,
  type NewsletterSubscription,
} from '@/api/types'

export async function subscribeToNewsletter(
  email: string,
): Promise<NewsletterSubscription> {
  const payload: NewsletterRequest = { email }
  const { data } = await apiClient.post<unknown>('/newsletter', payload)
  return newsletterSubscriptionSchema.parse(data)
}
