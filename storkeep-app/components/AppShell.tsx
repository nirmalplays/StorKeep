'use client'

import { usePathname } from 'next/navigation'
import { AppSideNav } from '@/components/AppSideNav'
import { SiteNav } from '@/components/SiteNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isDocs = pathname.startsWith('/dev-docs')

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <SiteNav />
      {isDocs ? (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">{children}</div>
      ) : (
        <div className="flex flex-1 min-h-0 min-w-0 flex-col lg:flex-row">
          <AppSideNav />
          <div className="flex-1 flex flex-col min-w-0">{children}</div>
        </div>
      )}
    </div>
  )
}
