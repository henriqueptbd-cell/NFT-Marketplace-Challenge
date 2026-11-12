import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { readPersistedUser } from '@/api/client'
import { openAuthDialog, type AuthDialogMode } from '@/lib/auth-dialog'
import { resolveInternalRedirect } from '@/lib/account-routing'

/**
 * `/login` e `/register` continuam aceitando `?redirect=`, mas apenas abrem o
 * card sobreposto e devolvem o usuário para a página de origem.
 */
function useAuthDialogRedirect(mode: AuthDialogMode, redirect?: string) {
  const navigate = useNavigate()

  useEffect(() => {
    const href = resolveInternalRedirect(redirect)
    if (!readPersistedUser()) openAuthDialog({ mode, redirect })
    void navigate({ href, replace: true })
  }, [mode, redirect, navigate])

  return null
}

export function LoginDialogRoute() {
  const search = useSearch({ from: '/login' })
  return useAuthDialogRedirect('login', search.redirect)
}

export function RegisterDialogRoute() {
  const search = useSearch({ from: '/register' })
  return useAuthDialogRedirect('register', search.redirect)
}
