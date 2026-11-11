import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { accountCopy } from '@/lib/account-copy'

interface AuthPageShellProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-soft via-background to-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg">
        <Link
          to="/"
          search={{
            q: undefined,
            collections: [],
            networks: [],
            sort: 'relevance',
            page: 1,
          }}
          className="mx-auto block w-fit font-display text-2xl font-bold tracking-wide text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {accountCopy.brand}
        </Link>
        <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-lg sm:p-10">
          <header className="mb-8 grid gap-3">
            <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm leading-6 text-text-secondary">
              {description}
            </p>
          </header>
          {children}
        </section>
      </div>
    </main>
  )
}
