export function resolveInternalRedirect(
  redirect: string | undefined,
  fallback = '/',
): string {
  if (
    !redirect ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.includes('\\')
  ) {
    return fallback
  }
  return redirect
}
