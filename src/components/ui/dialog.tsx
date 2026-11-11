import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  closeLabel: string
  description?: string
  children: ReactNode
  className?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  closeLabel,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-background/80" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-card border border-border bg-surface p-6 text-text-primary shadow-lg focus:outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <DialogPrimitive.Title className="font-display text-xl font-bold">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-text-secondary">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={closeLabel}>
                <X aria-hidden="true" className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
