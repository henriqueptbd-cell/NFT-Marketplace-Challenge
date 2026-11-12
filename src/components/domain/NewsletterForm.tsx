import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { subscribeToNewsletter } from '@/api/endpoints'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Feedback = { tone: 'success' | 'error'; message: string } | null

export interface NewsletterFormProps {
  className?: string
}

/** Inscrição na newsletter; a validação final acontece na camada de mocks. */
export function NewsletterForm({ className }: NewsletterFormProps) {
  const inputId = useId()
  const feedbackId = useId()
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const copy = discoveryCopy.newsletter

  const mutation = useMutation({
    mutationFn: subscribeToNewsletter,
    onSuccess: () => {
      setEmail('')
      setFeedback({ tone: 'success', message: copy.success })
    },
    onError: () => setFeedback({ tone: 'error', message: copy.error }),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = email.trim()
    if (!EMAIL_PATTERN.test(value)) {
      setFeedback({ tone: 'error', message: copy.invalid })
      return
    }
    setFeedback(null)
    mutation.mutate(value)
  }

  return (
    <form
      className={cn('flex flex-col gap-3', className)}
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="sr-only" htmlFor={inputId}>
        {copy.label}
      </label>
      <div className="flex">
        <Input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={copy.placeholder}
          value={email}
          disabled={mutation.isPending}
          aria-invalid={feedback?.tone === 'error'}
          aria-describedby={feedback ? feedbackId : undefined}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-r-none"
        />
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-l-none"
        >
          {mutation.isPending ? copy.submitting : copy.submit}
        </Button>
      </div>
      {feedback ? (
        <p
          id={feedbackId}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'text-xs leading-5',
            feedback.tone === 'error' ? 'text-primary' : 'text-text-secondary',
          )}
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  )
}
