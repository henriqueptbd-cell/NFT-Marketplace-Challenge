import { useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountLayout } from '@/components/domain/AccountLayout'
import { AccountTextField } from '@/components/domain/AccountTextField'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Toast } from '@/components/ui/toast'
import { useAuthSession, authSessionQueryKey } from '@/hooks/useAuth'
import { persistUser } from '@/api/client'
import {
  changePassword,
  getProfile,
  updateProfile,
  type AuthResponse,
} from '@/api/endpoints'
import type { CollectorProfile } from '@/api/types'
import { accountCopy } from '@/lib/account-copy'
import {
  apiErrorMessage,
  apiFieldErrors,
  zodFieldErrors,
} from '@/lib/api-errors'
import {
  passwordChangeSchema,
  profileFormSchema,
  type PasswordChangeValues,
  type ProfileFormValues,
} from '@/lib/validation'
import { ErrorState } from '@/components/domain/ErrorState'

interface ProfileEditorProps {
  profile: CollectorProfile
  profileErrors: Record<string, string>
  profileMessage: string
  profileSaving: boolean
  onSaveProfile: (values: ProfileFormValues, avatar: string | null) => void
  onClearProfileError: (field: string) => void
  passwordErrors: Record<string, string>
  passwordMessage: string
  passwordSaving: boolean
  onSavePassword: (values: PasswordChangeValues) => Promise<void>
  onClearPasswordError: (field: string) => void
}

const emptyPassword: PasswordChangeValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function ProfileEditor({
  profile,
  profileErrors,
  profileMessage,
  profileSaving,
  onSaveProfile,
  onClearProfileError,
  passwordErrors,
  passwordMessage,
  passwordSaving,
  onSavePassword,
  onClearPasswordError,
}: ProfileEditorProps) {
  const [values, setValues] = useState<ProfileFormValues>({
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ens: profile.ens ?? '',
    walletNickname: profile.walletNickname,
  })
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const [profileLocalErrors, setProfileLocalErrors] = useState<
    Record<string, string>
  >({})
  const [avatarError, setAvatarError] = useState('')
  const [passwordValues, setPasswordValues] =
    useState<PasswordChangeValues>(emptyPassword)
  const [passwordLocalErrors, setPasswordLocalErrors] = useState<
    Record<string, string>
  >({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updateProfileField<K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setProfileLocalErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    onClearProfileError(field)
  }

  function updatePasswordField<K extends keyof PasswordChangeValues>(
    field: K,
    value: PasswordChangeValues[K],
  ) {
    setPasswordValues((current) => ({ ...current, [field]: value }))
    setPasswordLocalErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    onClearPasswordError(field)
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = profileFormSchema.safeParse(values)
    if (!parsed.success) {
      setProfileLocalErrors(zodFieldErrors(parsed.error))
      return
    }
    setProfileLocalErrors({})
    onSaveProfile(parsed.data, avatar)
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = passwordChangeSchema.safeParse(passwordValues)
    if (!parsed.success) {
      setPasswordLocalErrors(zodFieldErrors(parsed.error))
      return
    }
    setPasswordLocalErrors({})
    try {
      await onSavePassword(parsed.data)
      setPasswordValues(emptyPassword)
    } catch {
      // API field errors are displayed by the parent form state.
    }
  }

  function handleAvatarChange(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 1_000_000) {
      setAvatarError(accountCopy.profile.avatarError)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(typeof reader.result === 'string' ? reader.result : null)
      setAvatarError('')
      onClearProfileError('avatar')
    }
    reader.onerror = () => setAvatarError(accountCopy.profile.avatarError)
    reader.readAsDataURL(file)
  }

  function profileError(field: keyof ProfileFormValues): string | undefined {
    return profileLocalErrors[field] ?? profileErrors[field]
  }

  function passwordError(
    field: keyof PasswordChangeValues,
  ): string | undefined {
    return passwordLocalErrors[field] ?? passwordErrors[field]
  }

  const initials = profile.displayName
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 1))
    .join('')
    .slice(0, 2)

  return (
    <div className="grid gap-6">
      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        <form className="grid gap-5" noValidate onSubmit={handleProfileSubmit}>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar
              src={avatar ?? undefined}
              alt={profile.displayName}
              fallback={initials}
              className="size-16"
            />
            <div className="grid gap-2">
              <FormField
                id="profile-avatar"
                label={accountCopy.profile.avatar}
                description={accountCopy.profile.avatarHint}
                error={avatarError || profileErrors.avatar}
              >
                <Input
                  ref={fileInputRef}
                  id="profile-avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-describedby={
                    avatarError || profileErrors.avatar
                      ? 'profile-avatar-description profile-avatar-error'
                      : 'profile-avatar-description'
                  }
                  aria-invalid={Boolean(avatarError || profileErrors.avatar)}
                  onChange={(event) =>
                    handleAvatarChange(event.currentTarget.files?.[0])
                  }
                />
              </FormField>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={accountCopy.profile.avatarUpload}
                onClick={() => fileInputRef.current?.click()}
              >
                {accountCopy.profile.avatarUpload}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <AccountTextField
              id="profile-display-name"
              label={accountCopy.profile.displayName}
              autoComplete="name"
              value={values.displayName}
              onChange={(value) => updateProfileField('displayName', value)}
              error={profileError('displayName')}
              required
            />
            <AccountTextField
              id="profile-username"
              label={accountCopy.profile.username}
              autoComplete="username"
              value={values.username}
              onChange={(value) => updateProfileField('username', value)}
              error={profileError('username')}
              required
            />
            <AccountTextField
              id="profile-email"
              label={accountCopy.profile.email}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(value) => updateProfileField('email', value)}
              error={profileError('email')}
              required
            />
            <AccountTextField
              id="profile-ens"
              label={accountCopy.profile.ens}
              value={values.ens}
              onChange={(value) => updateProfileField('ens', value)}
              error={profileError('ens')}
            />
            <AccountTextField
              id="profile-wallet-nickname"
              label={accountCopy.profile.walletNickname}
              value={values.walletNickname}
              onChange={(value) => updateProfileField('walletNickname', value)}
              error={profileError('walletNickname')}
            />
          </div>

          {profileMessage ? (
            <p role="alert" className="text-sm text-text-secondary">
              {profileMessage}
            </p>
          ) : null}
          <div>
            <Button type="submit" disabled={profileSaving}>
              {profileSaving
                ? accountCopy.common.saving
                : accountCopy.common.save}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-card border border-border bg-surface p-4 sm:p-6">
        <h2 className="mb-5 font-display text-xl font-bold text-text-primary">
          {accountCopy.profile.passwordTitle}
        </h2>
        <form className="grid gap-5" noValidate onSubmit={handlePasswordSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <AccountTextField
              id="profile-current-password"
              label={accountCopy.profile.currentPassword}
              type="password"
              autoComplete="current-password"
              value={passwordValues.currentPassword}
              onChange={(value) =>
                updatePasswordField('currentPassword', value)
              }
              error={passwordError('currentPassword')}
              required
            />
            <AccountTextField
              id="profile-new-password"
              label={accountCopy.profile.newPassword}
              type="password"
              autoComplete="new-password"
              value={passwordValues.newPassword}
              onChange={(value) => updatePasswordField('newPassword', value)}
              error={passwordError('newPassword')}
              required
            />
            <AccountTextField
              id="profile-confirm-password"
              label={accountCopy.profile.confirmPassword}
              type="password"
              autoComplete="new-password"
              value={passwordValues.confirmPassword}
              onChange={(value) =>
                updatePasswordField('confirmPassword', value)
              }
              error={passwordError('confirmPassword')}
              required
            />
          </div>
          {passwordMessage ? (
            <p role="alert" className="text-sm text-text-secondary">
              {passwordMessage}
            </p>
          ) : null}
          <div>
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving
                ? accountCopy.common.saving
                : accountCopy.profile.passwordSave}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div
      className="grid gap-6"
      role="status"
      aria-label={accountCopy.common.loading}
    >
      <Skeleton
        label={accountCopy.common.loading}
        className="h-72 rounded-card"
      />
      <Skeleton
        label={accountCopy.common.loading}
        className="h-56 rounded-card"
      />
    </div>
  )
}

export function ProfilePage() {
  const authQuery = useAuthSession()
  const userId = authQuery.data?.user.id
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: getProfile,
    enabled: Boolean(userId),
    retry: false,
  })
  const queryClientInstance = useQueryClient()
  const [toastMessage, setToastMessage] = useState('')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  )
  const [passwordMessage, setPasswordMessage] = useState('')

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      queryClientInstance.setQueryData(
        ['profile', updatedProfile.userId],
        updatedProfile,
      )
      const currentAuth =
        queryClientInstance.getQueryData<AuthResponse>(authSessionQueryKey)
      if (currentAuth) {
        const updatedUser = {
          ...currentAuth.user,
          displayName: updatedProfile.displayName,
          username: updatedProfile.username,
          email: updatedProfile.email,
        }
        const updatedAuth: AuthResponse = {
          ...currentAuth,
          user: updatedUser,
          profile: updatedProfile,
        }
        queryClientInstance.setQueryData(authSessionQueryKey, updatedAuth)
        persistUser(updatedUser)
      }
      setProfileErrors({})
      setProfileMessage('')
      setToastMessage(accountCopy.profile.saved)
    },
    onError: (error) => {
      const fields = apiFieldErrors(error)
      setProfileErrors(fields)
      setProfileMessage(
        Object.keys(fields).length === 0
          ? apiErrorMessage(error, accountCopy.common.genericError)
          : '',
      )
    },
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordErrors({})
      setPasswordMessage('')
      setToastMessage(accountCopy.profile.passwordSaved)
    },
    onError: (error) => {
      const fields = apiFieldErrors(error)
      setPasswordErrors(fields)
      setPasswordMessage(
        Object.keys(fields).length === 0
          ? apiErrorMessage(error, accountCopy.common.genericError)
          : '',
      )
    },
  })

  if (authQuery.isPending || (authQuery.data && profileQuery.isPending)) {
    return <SettingsSkeleton />
  }
  if (!authQuery.data) {
    if (authQuery.isError) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <ErrorState
            title={accountCopy.profile.title}
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
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="page-shell py-10">
        <ErrorState
          title={accountCopy.profile.title}
          message={apiErrorMessage(
            profileQuery.error,
            accountCopy.common.genericError,
          )}
          retryLabel={accountCopy.common.retry}
          onRetry={() => void profileQuery.refetch()}
        />
      </div>
    )
  }

  const profile = profileQuery.data
  const handleProfileSave = (
    values: ProfileFormValues,
    avatar: string | null,
  ) => {
    setProfileErrors({})
    setProfileMessage('')
    profileMutation.mutate({
      ...values,
      ens: values.ens.trim() || null,
      avatar,
    })
  }

  const handlePasswordSave = (values: PasswordChangeValues) => {
    setPasswordErrors({})
    setPasswordMessage('')
    return passwordMutation.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
  }

  return (
    <>
      <AccountLayout
        active="profile"
        title={accountCopy.profile.title}
        description={accountCopy.profile.description}
        user={authQuery.data.user}
      >
        <ProfileEditor
          key={profile.userId}
          profile={profile}
          profileErrors={profileErrors}
          profileMessage={profileMessage}
          profileSaving={profileMutation.isPending}
          onSaveProfile={handleProfileSave}
          onClearProfileError={(field) =>
            setProfileErrors((current) => {
              const next = { ...current }
              delete next[field]
              return next
            })
          }
          passwordErrors={passwordErrors}
          passwordMessage={passwordMessage}
          passwordSaving={passwordMutation.isPending}
          onSavePassword={handlePasswordSave}
          onClearPasswordError={(field) =>
            setPasswordErrors((current) => {
              const next = { ...current }
              delete next[field]
              return next
            })
          }
        />
      </AccountLayout>
      {toastMessage ? (
        <div className="fixed bottom-4 right-4 z-[100] w-[min(28rem,calc(100vw-2rem))]">
          <Toast
            title={accountCopy.common.successTitle}
            description={toastMessage}
          />
        </div>
      ) : null}
    </>
  )
}
