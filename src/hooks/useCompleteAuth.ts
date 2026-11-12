import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { mergeGuestCart, type AuthResponse } from '@/api/endpoints'
import { getGuestCartId } from '@/api/client'
import { accountCopy } from '@/lib/account-copy'
import { resolveInternalRedirect } from '@/lib/account-routing'
import { authSessionQueryKey } from '@/hooks/useAuth'
import { cartQueryKey } from '@/hooks/useCart'

export interface UseCompleteAuthOptions {
  redirect?: string
  onClose: () => void
}

/**
 * Finaliza login, cadastro e login social: publica a sessão no cache, mescla o
 * carrinho convidado e só então fecha o modal e aplica o redirect pendente.
 */
export function useCompleteAuth({ redirect, onClose }: UseCompleteAuthOptions) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mergePending, setMergePending] = useState(false)
  const [mergeRetrying, setMergeRetrying] = useState(false)
  const [mergeError, setMergeError] = useState('')

  const complete = useCallback(
    async (response: AuthResponse) => {
      queryClient.setQueryData(authSessionQueryKey, response)
      setMergeError('')
      try {
        const cart = await mergeGuestCart()
        queryClient.removeQueries({
          queryKey: cartQueryKey(`guest:${getGuestCartId()}`),
          exact: true,
        })
        queryClient.setQueryData(cartQueryKey(cart.userId), cart)
      } catch {
        setMergePending(true)
        setMergeError(accountCopy.auth.cartMergeError)
        return
      }
      setMergePending(false)
      onClose()
      if (redirect) void navigate({ href: resolveInternalRedirect(redirect) })
    },
    [navigate, onClose, queryClient, redirect],
  )

  const retryCartMerge = useCallback(async () => {
    setMergeRetrying(true)
    setMergeError('')
    try {
      const cart = await mergeGuestCart()
      queryClient.removeQueries({
        queryKey: cartQueryKey(`guest:${getGuestCartId()}`),
        exact: true,
      })
      queryClient.setQueryData(cartQueryKey(cart.userId), cart)
      setMergePending(false)
      onClose()
      if (redirect) void navigate({ href: resolveInternalRedirect(redirect) })
    } catch {
      setMergeError(accountCopy.auth.cartMergeError)
    } finally {
      setMergeRetrying(false)
    }
  }, [navigate, onClose, queryClient, redirect])

  return {
    complete,
    mergePending,
    mergeRetrying,
    mergeError,
    setMergeError,
    retryCartMerge,
  }
}
