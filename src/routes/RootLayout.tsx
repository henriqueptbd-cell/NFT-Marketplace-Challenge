import { Outlet } from '@tanstack/react-router'
import { SiteFooter } from '@/components/domain/SiteFooter'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { useAuthError } from '@/hooks/useAuthError'
import { accountCopy } from '@/lib/account-copy'

export function RootLayout() {
  const { notice, dismissNotice } = useAuthError()

  return (
    <>
      <Outlet />
      <SiteFooter />
      {notice ? (
        <div className="fixed bottom-4 right-4 z-[100] w-[min(28rem,calc(100vw-2rem))]">
          <Toast
            title={notice.title}
            description={notice.description}
            variant="error"
            action={
              <Button variant="ghost" size="sm" onClick={dismissNotice}>
                {accountCopy.common.close}
              </Button>
            }
          />
        </div>
      ) : null}
    </>
  )
}
