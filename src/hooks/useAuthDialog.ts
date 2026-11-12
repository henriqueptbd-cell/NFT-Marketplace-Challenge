import { useSyncExternalStore } from 'react'
import {
  closeAuthDialog,
  getAuthDialogState,
  openAuthDialog,
  setAuthDialogMode,
  subscribeAuthDialog,
} from '@/lib/auth-dialog'

export function useAuthDialog() {
  const dialog = useSyncExternalStore(
    subscribeAuthDialog,
    getAuthDialogState,
    getAuthDialogState,
  )

  return {
    dialog,
    openAuthDialog,
    closeAuthDialog,
    setAuthDialogMode,
  }
}
