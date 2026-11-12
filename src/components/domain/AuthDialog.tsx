import { useMutation } from '@tanstack/react-query'
import { AuthLoginForm } from '@/components/domain/AuthLoginForm'
import { AuthRegisterForm } from '@/components/domain/AuthRegisterForm'
import { SocialIcon } from '@/components/domain/SocialIcon'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthDialog } from '@/hooks/useAuthDialog'
import { useCompleteAuth } from '@/hooks/useCompleteAuth'
import { accountCopy } from '@/lib/account-copy'
import { apiErrorMessage } from '@/lib/api-errors'
import { socialLogin, type AuthResponse } from '@/api/endpoints'
import type { AuthDialogMode } from '@/lib/auth-dialog'

const socialProviders = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
] as const

interface SocialAuthButtonsProps {
  pendingProvider: 'google' | 'facebook' | null
  error: string
  disabled: boolean
  onSelect: (provider: 'google' | 'facebook') => void
}

function SocialAuthButtons({
  pendingProvider,
  error,
  disabled,
  onSelect,
}: SocialAuthButtonsProps) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-text-secondary">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        {accountCopy.auth.socialDivider}
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {socialProviders.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            disabled={disabled}
            onClick={() => onSelect(provider.id)}
          >
            <SocialIcon id={provider.id} />
            {pendingProvider === provider.id
              ? accountCopy.auth.socialPending
              : provider.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-text-secondary">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Card de autenticação sobreposto à rota atual, conforme o design system
 * (páginas 6 e 7). O estado vive fora do router para que a página de trás
 * permaneça montada durante o login.
 */
export function AuthDialog() {
  const { dialog, closeAuthDialog, setAuthDialogMode } = useAuthDialog()
  const mode = dialog?.mode ?? 'login'
  const { complete, mergePending, mergeRetrying, mergeError, retryCartMerge } =
    useCompleteAuth({ redirect: dialog?.redirect, onClose: closeAuthDialog })

  const socialMutation = useMutation({
    mutationFn: socialLogin,
    onSuccess: (response: AuthResponse) => void complete(response),
  })

  function handleAuthenticated(response: AuthResponse) {
    void complete(response)
  }

  const socialError = socialMutation.isError
    ? apiErrorMessage(socialMutation.error, accountCopy.auth.socialError)
    : ''

  const socialSection = (
    <SocialAuthButtons
      pendingProvider={
        socialMutation.isPending
          ? (socialMutation.variables?.provider ?? null)
          : null
      }
      error={socialError}
      disabled={socialMutation.isPending}
      onSelect={(provider) => socialMutation.mutate({ provider })}
    />
  )

  return (
    <Dialog
      open={Boolean(dialog)}
      onOpenChange={(open) => {
        if (!open) closeAuthDialog()
      }}
      title={
        mode === 'login'
          ? accountCopy.auth.loginTitle
          : accountCopy.auth.registerTitle
      }
      description={
        mode === 'login'
          ? accountCopy.auth.loginDescription
          : accountCopy.auth.registerDescription
      }
      closeLabel={accountCopy.common.close}
    >
      <Tabs
        value={mode}
        onValueChange={(value) => setAuthDialogMode(value as AuthDialogMode)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            {accountCopy.auth.loginTab}
          </TabsTrigger>
          <TabsTrigger value="register" className="flex-1">
            {accountCopy.auth.registerTab}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <AuthLoginForm onAuthenticated={handleAuthenticated} />
          {socialSection}
        </TabsContent>
        <TabsContent value="register">
          <AuthRegisterForm onAuthenticated={handleAuthenticated} />
          {socialSection}
        </TabsContent>
      </Tabs>
      {mergeError ? (
        <div
          role="alert"
          className="grid gap-3 rounded-button border border-border bg-elevated p-3 text-sm text-text-secondary"
        >
          <p>{mergeError}</p>
          {mergePending ? (
            <Button
              variant="outline"
              size="sm"
              disabled={mergeRetrying}
              onClick={() => void retryCartMerge()}
            >
              {mergeRetrying
                ? accountCopy.auth.cartMergeRetrying
                : accountCopy.auth.cartMergeRetry}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  )
}
