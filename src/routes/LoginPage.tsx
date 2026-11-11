import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AccountTextField } from '@/components/domain/AccountTextField'
import { AuthPageShell } from '@/components/domain/AuthPageShell'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { accountCopy } from '@/lib/account-copy'
import {
  apiErrorMessage,
  apiFieldErrors,
  zodFieldErrors,
} from '@/lib/api-errors'
import { resolveInternalRedirect } from '@/lib/account-routing'
import { loginFormSchema, type LoginFormValues } from '@/lib/validation'
import { authSessionQueryKey } from '@/hooks/useAuth'
import { login } from '@/api/endpoints'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
  rememberMe: false,
}

export function LoginPage() {
  const search = useSearch({ from: '/login' })
  const queryClient = useQueryClient()
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      queryClient.setQueryData(authSessionQueryKey, response)
      window.location.assign(resolveInternalRedirect(search.redirect))
    },
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

  return (
    <AuthPageShell
      title={accountCopy.auth.loginTitle}
      description={accountCopy.auth.loginDescription}
    >
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
        <Checkbox
          id="login-remember-me"
          label={accountCopy.auth.rememberMe}
          checked={values.rememberMe}
          onCheckedChange={(checked) => updateField('rememberMe', checked)}
        />
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
      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          to="/register"
          search={{ redirect: search.redirect }}
          className="underline decoration-primary underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {accountCopy.auth.registerSwitch}
        </Link>
      </p>
    </AuthPageShell>
  )
}
