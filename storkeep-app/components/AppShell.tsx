'use client'

import { usePathname } from 'next/navigation'
import { AppSideNav } from '@/components/AppSideNav'
import { SiteNav } from '@/components/SiteNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/dev-docs')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black text-white">
      <AppSideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-50">
          <SiteNav />
        </div>
        {children}
      </div>
    </div>
  )
}
