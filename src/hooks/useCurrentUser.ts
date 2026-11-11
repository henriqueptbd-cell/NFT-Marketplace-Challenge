import { useEffect, useState } from 'react'
import { readPersistedUser, USER_STORAGE_EVENT } from '@/api/client'
import type { User } from '@/api/types'

export function useCurrentUser(): User | null {
  const [user, setUser] = useState(readPersistedUser)

  useEffect(() => {
    const syncUser = () => setUser(readPersistedUser())
    window.addEventListener(USER_STORAGE_EVENT, syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener(USER_STORAGE_EVENT, syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  return user
}
