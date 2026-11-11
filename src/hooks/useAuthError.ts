import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  API_UNAUTHORIZED_EVENT,
  clearPersistedUser,
  readPersistedUser,
  USER_STORAGE_EVENT,
} from '@/api/client'
import { disconnectRealtimeClient } from '@/api/realtime'
import { accountCopy } from '@/lib/account-copy'
import { queryClient } from '@/lib/query-client'

export interface AuthNotice {
  title: string
  description: string
}

export function useAuthError() {
  const navigate = useNavigate()
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
      queryClient.clear()
      disconnectRealtimeClient()
      setNotice({
        title: accountCopy.session.expiredTitle,
        description: accountCopy.session.expiredDescription,
      })
      const pathname = window.location.pathname
      const redirect = `${pathname}${window.location.search}${window.location.hash}`
      if (pathname !== '/login' && pathname !== '/register') {
        void navigate({
          to: '/login',
          search: { redirect },
        })
      }
    }

    window.addEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized)
    window.addEventListener(USER_STORAGE_EVENT, resetGuard)
    return () => {
      window.removeEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized)
      window.removeEventListener(USER_STORAGE_EVENT, resetGuard)
    }
  }, [navigate])

  return {
    notice,
    dismissNotice: () => setNotice(null),
  }
}
