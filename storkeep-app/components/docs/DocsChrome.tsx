'use client'

import { useState } from 'react'
import { DocsHeader } from './DocsHeader'
import { DocsSidebar } from './DocsSidebar'
import { DocsToc } from './DocsToc'

export function DocsChrome({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      <DocsHeader onOpenSidebar={() => setMobileNav(true)} />
      <div className="flex flex-1 min-h-0 min-w-0 relative">
        {mobileNav && (
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/60 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
        )}
        <div
          className={[
            'fixed z-[56] inset-y-0 left-0 lg:static lg:z-0',
            'transform transition-transform duration-200 ease-out',
            mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <DocsSidebar onNavigate={() => setMobileNav(false)} />
        </div>
        <div className="flex flex-1 min-w-0 min-h-0">
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          <DocsToc />
        </div>
      </div>
    </div>
  )
}
