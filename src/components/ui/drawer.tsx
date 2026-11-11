import { Drawer as DrawerPrimitive } from 'vaul'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  closeLabel: string
  description?: string
  children: ReactNode
  direction?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Drawer({
  open,
  onOpenChange,
  title,
  closeLabel,
  description,
  children,
  direction = 'bottom',
  className,
}: DrawerProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <DrawerPrimitive.Content
          className={cn(
            'fixed z-50 flex max-h-[90vh] flex-col gap-4 overflow-y-auto border border-border bg-surface p-6 text-text-primary focus:outline-none',
            direction === 'bottom' &&
              'inset-x-0 bottom-0 rounded-t-card-mobile',
            direction === 'top' && 'inset-x-0 top-0 rounded-b-card-mobile',
            direction === 'left' &&
              'inset-y-0 left-0 w-[min(24rem,90vw)] rounded-r-card-mobile',
            direction === 'right' &&
              'inset-y-0 right-0 w-[min(24rem,90vw)] rounded-l-card-mobile',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <DrawerPrimitive.Title className="font-display text-xl font-bold">
                {title}
              </DrawerPrimitive.Title>
              {description ? (
                <DrawerPrimitive.Description className="text-sm text-text-secondary">
                  {description}
                </DrawerPrimitive.Description>
              ) : null}
            </div>
            <DrawerPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={closeLabel}>
                <X aria-hidden="true" className="size-4" />
              </Button>
            </DrawerPrimitive.Close>
          </div>
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}
