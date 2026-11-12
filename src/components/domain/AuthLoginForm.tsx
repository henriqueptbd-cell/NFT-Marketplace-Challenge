import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AccountTextField } from '@/components/domain/AccountTextField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { AuthResponse } from '@/api/endpoints'
import { accountCopy } from '@/lib/account-copy'
import {
  apiErrorMessage,
  apiFieldErrors,
  zodFieldErrors,
} from '@/lib/api-errors'
import { login, requestPasswordReset } from '@/api/endpoints'
import { loginFormSchema, type LoginFormValues } from '@/lib/validation'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
  rememberMe: false,
}

export interface AuthLoginFormProps {
  onAuthenticated: (response: AuthResponse) => void
}

export function AuthLoginForm({ onAuthenticated }: AuthLoginFormProps) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [resetState, setResetState] = useState<
    'idle' | 'pending' | 'sent' | 'error'
  >('idle')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: onAuthenticated,
    onError: (error) => {
      const errors = apiFieldErrors(error)
      setFieldErrors(errors)
      setFormError(
        Object.keys(errors).length === 0
          ? apiErrorMessage(error, accountCopy.auth.loginError)
          : '',
      )
    },
  })

  function updateField<K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = loginFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      setFormError('')
      return
    }
    setFieldErrors({})
    setFormError('')
    mutation.mutate(parsed.data)
  }

  async function handleForgotPassword() {
    const email = values.email.trim()
    if (!email) {
      setFieldErrors((current) => ({
        ...current,
        email: accountCopy.auth.forgotPasswordMissingEmail,
      }))
      return
    }
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.email
      return next
    })
    setResetState('pending')
    try {
      await requestPasswordReset({ email })
      setResetState('sent')
    } catch {
      setResetState('error')
    }
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <AccountTextField
        id="login-email"
        label={accountCopy.auth.email}
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(value) => updateField('email', value)}
        error={fieldErrors.email}
        required
      />
      <AccountTextField
        id="login-password"
        label={accountCopy.auth.password}
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={(value) => updateField('password', value)}
        error={fieldErrors.password}
        required
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          id="login-remember-me"
          label={accountCopy.auth.rememberMe}
          checked={values.rememberMe}
          onCheckedChange={(checked) => updateField('rememberMe', checked)}
        />
        <Button
          variant="link"
          size="sm"
          className="px-0 text-xs"
          disabled={resetState === 'pending'}
          onClick={() => void handleForgotPassword()}
        >
          {resetState === 'pending'
            ? accountCopy.auth.forgotPasswordPending
            : accountCopy.auth.forgotPassword}
        </Button>
      </div>
      {resetState === 'sent' ? (
        <p role="status" className="text-xs text-text-secondary">
          {accountCopy.auth.forgotPasswordSent}
        </p>
      ) : null}
      {resetState === 'error' ? (
        <p role="alert" className="text-xs text-text-secondary">
          {accountCopy.auth.forgotPasswordError}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="text-sm text-text-secondary">
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending
          ? accountCopy.auth.loginPending
          : accountCopy.auth.loginAction}
      </Button>
    </form>
  )
}
