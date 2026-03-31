'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

type Props = {
  onOpenSidebar?: () => void
}

function pill(active: boolean): string {
  return [
    'px-3 py-1.5 rounded-full text-sm transition-colors border',
    active
      ? 'bg-zinc-800/90 text-zinc-50 border-zinc-700/80'
      : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/80',
  ].join(' ')
}

export function DocsHeader({ onOpenSidebar }: Props) {
  const pathname = usePathname() ?? ''
  const isGuide = pathname === '/dev-docs'
  const isQuickstart = pathname === '/dev-docs/sdk-quickstart'

  return (
    <header className="sticky top-0 z-[60] h-14 shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="h-full px-4 flex items-center justify-between gap-4 max-w-[100vw]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dev-docs" className="font-semibold text-zinc-100 tracking-tight truncate">
            StorKeep <span className="text-zinc-500 font-normal">Docs</span>
          </Link>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/dev-docs" className={pill(isGuide)}>
            Developer guide
          </Link>
          <Link href="/dev-docs/sdk-quickstart" className={pill(isQuickstart)}>
            SDK Quickstart
          </Link>
          <Link href="/dashboard" className={pill(false)}>
            App
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-500 max-w-[180px]">
            <span className="truncate">Search docs…</span>
            <kbd className="hidden sm:inline shrink-0 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              ⌘K
            </kbd>
          </div>
          <Link href="/" className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors hidden sm:inline">
            Home
          </Link>
        </div>
      </div>
    </header>
  )
}
