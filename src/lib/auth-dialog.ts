export type AuthDialogMode = 'login' | 'register'

export interface AuthDialogState {
  mode: AuthDialogMode
  redirect?: string
}

let currentState: AuthDialogState | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function getAuthDialogState(): AuthDialogState | null {
  return currentState
}

export function subscribeAuthDialog(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function openAuthDialog(next: AuthDialogState): void {
  currentState = next
  emit()
}

export function setAuthDialogMode(mode: AuthDialogMode): void {
  if (!currentState || currentState.mode === mode) return
  currentState = { ...currentState, mode }
  emit()
}

export function closeAuthDialog(): void {
  if (!currentState) return
  currentState = null
  emit()
}
