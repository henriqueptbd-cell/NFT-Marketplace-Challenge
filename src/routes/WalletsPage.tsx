import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountLayout } from '@/components/domain/AccountLayout'
import { AccountTextField } from '@/components/domain/AccountTextField'
import { ErrorState } from '@/components/domain/ErrorState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Toast } from '@/components/ui/toast'
import { addWallet, getWallets, updateWallet } from '@/api/endpoints'
import type { Wallet } from '@/api/types'
import { networkSchema, walletTypeSchema } from '@/api/types'
import { useAuthSession } from '@/hooks/useAuth'
import { accountCopy } from '@/lib/account-copy'
import {
  apiErrorMessage,
  apiFieldErrors,
  zodFieldErrors,
} from '@/lib/api-errors'
import { walletFormSchema, type WalletFormValues } from '@/lib/validation'

const walletsQueryKey = (userId: string | undefined) =>
  ['wallets', userId] as const

type WalletInput = Omit<Wallet, 'id' | 'userId' | 'isPrimary' | 'createdAt'>
type WalletMutationInput = { walletId?: string; input: WalletInput }

function emptyWallet(email: string): WalletFormValues {
  return {
    name: '',
    nickname: '',
    address: '',
    network: 'Ethereum',
    type: 'software',
    ens: '',
    referralCode: '',
    email,
  }
}

function toWalletForm(wallet: Wallet): WalletFormValues {
  return {
    name: wallet.name,
    nickname: wallet.nickname,
    address: wallet.address,
    network: wallet.network,
    type: wallet.type,
    ens: wallet.ens ?? '',
    referralCode: wallet.referralCode ?? '',
    email: wallet.email,
  }
}

function toWalletInput(values: WalletFormValues): WalletInput {
  return {
    ...values,
    ens: values.ens.trim() || null,
    referralCode: values.referralCode.trim() || null,
  }
}

interface WalletsEditorProps {
  primary?: Wallet
  secondary?: Wallet
  email: string
  primaryErrors: Record<string, string>
  secondaryErrors: Record<string, string>
  primaryMessage: string
  secondaryMessage: string
  primarySaving: boolean
  secondarySaving: boolean
  onSavePrimary: (values: WalletInput) => Promise<Wallet>
  onSaveSecondary: (values: WalletInput) => Promise<Wallet>
  onClearPrimaryError: (field: string) => void
  onClearSecondaryError: (field: string) => void
  onSaved: () => void
}

function WalletFormFields({
  prefix,
  values,
  errors,
  onTextChange,
  onNetworkChange,
  onTypeChange,
}: {
  prefix: string
  values: WalletFormValues
  errors: Record<string, string>
  onTextChange: (field: keyof WalletFormValues, value: string) => void
  onNetworkChange: (value: string) => void
  onTypeChange: (value: string) => void
}) {
  const idFor = (field: string) => `${prefix}-${field}`
  const networkId = idFor('network')
  const typeId = idFor('type')
  const networkError = errors.network
  const typeError = errors.type
  const walletTypeOptions = Object.entries(accountCopy.wallets.types).map(
    ([value, label]) => ({ value, label }),
  )

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <AccountTextField
        id={idFor('name')}
        label={accountCopy.wallets.walletName}
        value={values.name}
        onChange={(value) => onTextChange('name', value)}
        error={errors.name}
        required
      />
      <AccountTextField
        id={idFor('nickname')}
        label={accountCopy.wallets.nickname}
        value={values.nickname}
        onChange={(value) => onTextChange('nickname', value)}
        error={errors.nickname}
        required
      />
      <FormField
        id={networkId}
        label={accountCopy.wallets.network}
        error={networkError}
        required
        requiredIndicator={accountCopy.common.required}
      >
        <Select
          id={networkId}
          ariaLabel={accountCopy.wallets.network}
          ariaDescribedBy={networkError ? `${networkId}-error` : undefined}
          ariaInvalid={Boolean(networkError)}
          value={values.network}
          options={accountCopy.networkOptions}
          placeholder={accountCopy.wallets.selectNetwork}
          onValueChange={onNetworkChange}
        />
      </FormField>
      <AccountTextField
        id={idFor('address')}
        label={accountCopy.wallets.address}
        value={values.address}
        onChange={(value) => onTextChange('address', value)}
        error={errors.address}
        autoComplete="off"
        required
      />
      <FormField
        id={typeId}
        label={accountCopy.wallets.type}
        error={typeError}
        required
        requiredIndicator={accountCopy.common.required}
      >
        <Select
          id={typeId}
          ariaLabel={accountCopy.wallets.type}
          ariaDescribedBy={typeError ? `${typeId}-error` : undefined}
          ariaInvalid={Boolean(typeError)}
          value={values.type}
          options={walletTypeOptions}
          placeholder={accountCopy.wallets.selectType}
          onValueChange={onTypeChange}
        />
      </FormField>
      <AccountTextField
        id={idFor('ens')}
        label={accountCopy.wallets.ens}
        value={values.ens}
        onChange={(value) => onTextChange('ens', value)}
        error={errors.ens}
      />
      <AccountTextField
        id={idFor('referral-code')}
        label={accountCopy.wallets.referralCode}
        value={values.referralCode}
        onChange={(value) => onTextChange('referralCode', value)}
        error={errors.referralCode}
      />
      <AccountTextField
        id={idFor('email')}
        label={accountCopy.wallets.email}
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(value) => onTextChange('email', value)}
        error={errors.email}
        required
      />
    </div>
  )
}

function WalletsEditor({
  primary,
  secondary,
  email,
  primaryErrors,
  secondaryErrors,
  primaryMessage,
  secondaryMessage,
  primarySaving,
  secondarySaving,
  onSavePrimary,
  onSaveSecondary,
  onClearPrimaryError,
  onClearSecondaryError,
  onSaved,
}: WalletsEditorProps) {
  const [primaryValues, setPrimaryValues] = useState<WalletFormValues>(
    primary ? toWalletForm(primary) : emptyWallet(email),
  )
  const [secondaryValues, setSecondaryValues] = useState<WalletFormValues>(
    secondary ? toWalletForm(secondary) : emptyWallet(email),
  )
  const [secondaryEnabled, setSecondaryEnabled] = useState(Boolean(secondary))
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [primaryLocalErrors, setPrimaryLocalErrors] = useState<
    Record<string, string>
  >({})
  const [secondaryLocalErrors, setSecondaryLocalErrors] = useState<
    Record<string, string>
  >({})

  function updatePrimaryField(field: keyof WalletFormValues, value: string) {
    const nextValues = { ...primaryValues, [field]: value }
    setPrimaryValues(nextValues)
    if (sameAsPrimary) setSecondaryValues(nextValues)
    setPrimaryLocalErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    onClearPrimaryError(field)
    if (sameAsPrimary) onClearSecondaryError(field)
  }

  function updateSecondaryField(field: keyof WalletFormValues, value: string) {
    setSecondaryValues((current) => ({ ...current, [field]: value }))
    setSecondaryLocalErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    onClearSecondaryError(field)
  }

  function updateNetwork(target: 'primary' | 'secondary', value: string) {
    const parsed = networkSchema.safeParse(value)
    if (!parsed.success) return
    if (target === 'primary') updatePrimaryField('network', parsed.data)
    else updateSecondaryField('network', parsed.data)
  }

  function updateWalletType(target: 'primary' | 'secondary', value: string) {
    const parsed = walletTypeSchema.safeParse(value)
    if (!parsed.success) return
    if (target === 'primary') updatePrimaryField('type', parsed.data)
    else updateSecondaryField('type', parsed.data)
  }

  function setSameAsPrimaryState(checked: boolean) {
    setSameAsPrimary(checked)
    if (checked) {
      setSecondaryValues(primaryValues)
      setSecondaryLocalErrors({})
      onClearSecondaryError('address')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedPrimary = walletFormSchema.safeParse(primaryValues)
    if (!parsedPrimary.success) {
      setPrimaryLocalErrors(zodFieldErrors(parsedPrimary.error))
      return
    }
    const parsedSecondary = secondaryEnabled
      ? walletFormSchema.safeParse(secondaryValues)
      : null
    if (parsedSecondary && !parsedSecondary.success) {
      setSecondaryLocalErrors(zodFieldErrors(parsedSecondary.error))
      return
    }

    setPrimaryLocalErrors({})
    setSecondaryLocalErrors({})
    try {
      await onSavePrimary(toWalletInput(parsedPrimary.data))
    } catch {
      return
    }

    if (secondaryEnabled && parsedSecondary?.success) {
      const duplicateOfPrimary =
        parsedSecondary.data.address.toLowerCase() ===
          parsedPrimary.data.address.toLowerCase() &&
        parsedSecondary.data.network === parsedPrimary.data.network
      if (!duplicateOfPrimary) {
        try {
          await onSaveSecondary(toWalletInput(parsedSecondary.data))
        } catch {
          return
        }
      }
    }
    onSaved()
  }

  return (
    <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-5 font-display text-xl font-bold text-text-primary">
          {accountCopy.wallets.primaryTitle}
        </h2>
        <WalletFormFields
          prefix="primary-wallet"
          values={primaryValues}
          errors={{ ...primaryErrors, ...primaryLocalErrors }}
          onTextChange={(field, value) => updatePrimaryField(field, value)}
          onNetworkChange={(value) => updateNetwork('primary', value)}
          onTypeChange={(value) => updateWalletType('primary', value)}
        />
        {primaryMessage ? (
          <p role="alert" className="mt-4 text-sm text-text-secondary">
            {primaryMessage}
          </p>
        ) : null}
      </section>

      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-text-primary">
            {accountCopy.wallets.secondaryTitle}
          </h2>
          <span className="text-xs text-text-secondary">
            {accountCopy.wallets.optional}
          </span>
        </div>
        <Checkbox
          id="wallet-secondary-enabled"
          label={accountCopy.wallets.addSecondary}
          checked={secondaryEnabled}
          onCheckedChange={setSecondaryEnabled}
        />
        {secondaryEnabled ? (
          <div className="mt-5 grid gap-5">
            <Checkbox
              id="wallet-same-as-primary"
              label={accountCopy.wallets.sameAsPrimary}
              checked={sameAsPrimary}
              onCheckedChange={setSameAsPrimaryState}
            />
            <WalletFormFields
              prefix="secondary-wallet"
              values={secondaryValues}
              errors={{ ...secondaryErrors, ...secondaryLocalErrors }}
              onTextChange={(field, value) =>
                updateSecondaryField(field, value)
              }
              onNetworkChange={(value) => updateNetwork('secondary', value)}
              onTypeChange={(value) => updateWalletType('secondary', value)}
            />
            {secondaryMessage ? (
              <p role="alert" className="text-sm text-text-secondary">
                {secondaryMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <div>
        <Button type="submit" disabled={primarySaving || secondarySaving}>
          {primarySaving || secondarySaving
            ? accountCopy.common.saving
            : accountCopy.wallets.save}
        </Button>
      </div>
    </form>
  )
}

function SettingsSkeleton() {
  return (
    <div
      className="page-shell grid gap-6 py-10"
      role="status"
      aria-label={accountCopy.common.loading}
    >
      <Skeleton
        label={accountCopy.common.loading}
        className="h-72 rounded-card"
      />
      <Skeleton
        label={accountCopy.common.loading}
        className="h-72 rounded-card"
      />
    </div>
  )
}

export function WalletsPage() {
  const authQuery = useAuthSession()
  const userId = authQuery.data?.user.id
  const queryClient = useQueryClient()
  const walletsQuery = useQuery({
    queryKey: walletsQueryKey(userId),
    queryFn: getWallets,
    enabled: Boolean(userId),
    retry: false,
  })
  const [toastVisible, setToastVisible] = useState(false)
  const [primaryErrors, setPrimaryErrors] = useState<Record<string, string>>({})
  const [secondaryErrors, setSecondaryErrors] = useState<
    Record<string, string>
  >({})
  const [primaryMessage, setPrimaryMessage] = useState('')
  const [secondaryMessage, setSecondaryMessage] = useState('')

  function cacheWallet(wallet: Wallet) {
    queryClient.setQueryData<Wallet[]>(
      walletsQueryKey(userId),
      (current = []) => {
        const exists = current.some((item) => item.id === wallet.id)
        const next = exists
          ? current.map((item) => (item.id === wallet.id ? wallet : item))
          : [...current, wallet]
        return wallet.isPrimary
          ? next.map((item) => ({ ...item, isPrimary: item.id === wallet.id }))
          : next
      },
    )
  }

  const primaryMutation = useMutation<Wallet, unknown, WalletMutationInput>({
    mutationFn: ({ walletId, input }) =>
      walletId ? updateWallet(walletId, input) : addWallet(input),
    onSuccess: (wallet) => {
      cacheWallet(wallet)
      setPrimaryErrors({})
      setPrimaryMessage('')
    },
    onError: (error) => {
      const fields = apiFieldErrors(error)
      setPrimaryErrors(fields)
      setPrimaryMessage(
        Object.keys(fields).length === 0
          ? apiErrorMessage(error, accountCopy.common.genericError)
          : '',
      )
    },
  })
  const secondaryMutation = useMutation<Wallet, unknown, WalletMutationInput>({
    mutationFn: ({ walletId, input }) =>
      walletId ? updateWallet(walletId, input) : addWallet(input),
    onSuccess: (wallet) => {
      cacheWallet(wallet)
      setSecondaryErrors({})
      setSecondaryMessage('')
    },
    onError: (error) => {
      const fields = apiFieldErrors(error)
      setSecondaryErrors(fields)
      setSecondaryMessage(
        Object.keys(fields).length === 0
          ? apiErrorMessage(error, accountCopy.common.genericError)
          : '',
      )
    },
  })

  if (authQuery.isPending || (authQuery.data && walletsQuery.isPending)) {
    return <SettingsSkeleton />
  }
  if (!authQuery.data) {
    if (authQuery.isError) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <ErrorState
            title={accountCopy.wallets.title}
            message={apiErrorMessage(
              authQuery.error,
              accountCopy.common.genericError,
            )}
            retryLabel={accountCopy.common.retry}
            onRetry={() => void authQuery.refetch()}
          />
        </div>
      )
    }
    return null
  }
  if (walletsQuery.isError || !walletsQuery.data) {
    return (
      <div className="page-shell py-10">
        <ErrorState
          title={accountCopy.wallets.title}
          message={apiErrorMessage(
            walletsQuery.error,
            accountCopy.common.genericError,
          )}
          retryLabel={accountCopy.common.retry}
          onRetry={() => void walletsQuery.refetch()}
        />
      </div>
    )
  }

  const wallets = walletsQuery.data
  const primary = wallets.find((wallet) => wallet.isPrimary) ?? wallets[0]
  const secondary = wallets.find((wallet) => wallet.id !== primary?.id)

  return (
    <>
      <AccountLayout
        active="wallets"
        title={accountCopy.wallets.title}
        description={accountCopy.wallets.description}
        user={authQuery.data.user}
      >
        <WalletsEditor
          key={authQuery.data.user.id}
          primary={primary}
          secondary={secondary}
          email={authQuery.data.user.email}
          primaryErrors={primaryErrors}
          secondaryErrors={secondaryErrors}
          primaryMessage={primaryMessage}
          secondaryMessage={secondaryMessage}
          primarySaving={primaryMutation.isPending}
          secondarySaving={secondaryMutation.isPending}
          onSavePrimary={(input) =>
            primaryMutation.mutateAsync({ walletId: primary?.id, input })
          }
          onSaveSecondary={(input) =>
            secondaryMutation.mutateAsync({ walletId: secondary?.id, input })
          }
          onClearPrimaryError={(field) => {
            setPrimaryErrors((current) => {
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onClearSecondaryError={(field) => {
            setSecondaryErrors((current) => {
              const next = { ...current }
              delete next[field]
              return next
            })
          }}
          onSaved={() => setToastVisible(true)}
        />
      </AccountLayout>
      {toastVisible ? (
        <div className="fixed bottom-4 right-4 z-[100] w-[min(28rem,calc(100vw-2rem))]">
          <Toast
            title={accountCopy.common.successTitle}
            description={accountCopy.wallets.saved}
          />
        </div>
      ) : null}
    </>
  )
}
