import { useEffect, useRef, useState } from 'react'
import {
  API_UNAUTHORIZED_EVENT,
  clearPersistedUser,
  readPersistedUser,
  USER_STORAGE_EVENT,
} from '@/api/client'
import { disconnectRealtimeClient } from '@/api/realtime'
import { accountCopy } from '@/lib/account-copy'
import { openAuthDialog } from '@/lib/auth-dialog'
import { resetQueryCache } from '@/lib/query-client'

export interface AuthNotice {
  title: string
  description: string
}

export function useAuthError() {
  const [notice, setNotice] = useState<AuthNotice | null>(null)
  const handledRef = useRef(false)

  useEffect(() => {
    const resetGuard = () => {
      if (readPersistedUser()) handledRef.current = false
    }
    const handleUnauthorized = () => {
      if (handledRef.current) return
      handledRef.current = true
      clearPersistedUser()
      resetQueryCache()
      disconnectRealtimeClient()
      setNotice({
        title: accountCopy.session.expiredTitle,
        description: accountCopy.session.expiredDescription,
      })
      const { pathname, search, hash } = window.location
      if (pathname !== '/login' && pathname !== '/register') {
        openAuthDialog({
          mode: 'login',
          redirect: `${pathname}${search}${hash}`,
        })
      }
    }

    window.addEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized)
    window.addEventListener(USER_STORAGE_EVENT, resetGuard)
    return () => {
      window.removeEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized)
      window.removeEventListener(USER_STORAGE_EVENT, resetGuard)
    }
  }, [])

  return {
    notice,
    dismissNotice: () => setNotice(null),
  }
}
