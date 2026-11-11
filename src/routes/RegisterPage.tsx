import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AccountTextField } from '@/components/domain/AccountTextField'
import { AuthPageShell } from '@/components/domain/AuthPageShell'
import { Button } from '@/components/ui/button'
import { accountCopy } from '@/lib/account-copy'
import {
  apiErrorMessage,
  apiFieldErrors,
  zodFieldErrors,
} from '@/lib/api-errors'
import { resolveInternalRedirect } from '@/lib/account-routing'
import { authSessionQueryKey } from '@/hooks/useAuth'
import { register } from '@/api/endpoints'
import { registerFormSchema, type RegisterFormValues } from '@/lib/validation'

const initialValues: RegisterFormValues = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegisterPage() {
  const search = useSearch({ from: '/register' })
  const queryClient = useQueryClient()
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      queryClient.setQueryData(authSessionQueryKey, response)
      window.location.assign(resolveInternalRedirect(search.redirect))
    },
    onError: (error) => {
      const errors = apiFieldErrors(error)
      setFieldErrors(errors)
      setFormError(
        Object.keys(errors).length === 0
          ? apiErrorMessage(error, accountCopy.auth.registerError)
          : '',
      )
    },
  })

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
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
    const parsed = registerFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      setFormError('')
      return
    }
    setFieldErrors({})
    setFormError('')
    mutation.mutate({
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      password: parsed.data.password,
    })
  }

  return (
    <AuthPageShell
      title={accountCopy.auth.registerTitle}
      description={accountCopy.auth.registerDescription}
    >
      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        <AccountTextField
          id="register-name"
          label={accountCopy.auth.name}
          autoComplete="name"
          value={values.displayName}
          onChange={(value) => updateField('displayName', value)}
          error={fieldErrors.displayName}
          required
        />
        <AccountTextField
          id="register-email"
          label={accountCopy.auth.email}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(value) => updateField('email', value)}
          error={fieldErrors.email}
          required
        />
        <AccountTextField
          id="register-password"
          label={accountCopy.auth.password}
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(value) => updateField('password', value)}
          error={fieldErrors.password}
          description={accountCopy.auth.passwordHint}
          required
        />
        <AccountTextField
          id="register-confirm-password"
          label={accountCopy.auth.confirmPassword}
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(value) => updateField('confirmPassword', value)}
          error={fieldErrors.confirmPassword}
          required
        />
        {formError ? (
          <p role="alert" className="text-sm text-text-secondary">
            {formError}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending
            ? accountCopy.auth.registerPending
            : accountCopy.auth.registerAction}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          to="/login"
          search={{ redirect: search.redirect }}
          className="underline decoration-primary underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {accountCopy.auth.loginSwitch}
        </Link>
      </p>
    </AuthPageShell>
  )
}
