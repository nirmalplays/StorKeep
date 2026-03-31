'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const docAnchors = [
  { href: '/dev-docs#getting-started', label: 'Getting started' },
  { href: '/dev-docs#using-sdk', label: 'Using the SDK' },
  { href: '/dev-docs#environment-variables', label: 'Environment variables' },
  { href: '/dev-docs#demo-runbook', label: 'Demo runbook' },
  { href: '/dev-docs#build-deploy', label: 'Build & deploy' },
  { href: '/dev-docs#api-routes', label: 'API routes' },
  { href: '/dev-docs#faq', label: 'FAQ' },
  { href: '/dev-docs#troubleshooting', label: 'Troubleshooting' },
] as const

function navLinkClass(active: boolean, emphasis = false): string {
  return [
    'block rounded px-2.5 py-1.5 text-sm transition-colors border-l-2',
    active
      ? 'border-green-400 bg-gray-950/90 text-green-400'
      : emphasis && !active
        ? 'border-transparent text-green-400/90 hover:border-gray-600 hover:bg-gray-950/60 hover:text-green-300'
        : 'border-transparent text-gray-400 hover:border-gray-600 hover:bg-gray-950/50 hover:text-gray-200',
  ].join(' ')
}

export function AppSideNav() {
  const pathname = usePathname() ?? ''
  const is = (path: string) => pathname === path

  return (
    <aside
      className="hidden lg:flex shrink-0 w-56 flex-col border-r border-gray-800 bg-black sticky top-0 h-screen overflow-y-auto py-8 pl-5 pr-3 font-mono"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="font-bold text-white tracking-tight px-2.5 mb-8 hover:text-green-400 transition-colors"
      >
        StorKeep
      </Link>

      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 px-2.5">App</div>
      <nav className="flex flex-col gap-0.5 mb-6">
        <Link href="/" className={navLinkClass(is('/'))}>
          Home
        </Link>
        <Link href="/dashboard" className={navLinkClass(is('/dashboard'))}>
          Dashboard
        </Link>
        <Link href="/pitch" className={navLinkClass(is('/pitch'))}>
          Pitch
        </Link>
        <Link href="/economy" className={navLinkClass(is('/economy'), true)}>
          Agent Vault
        </Link>
      </nav>

      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 px-2.5">Documentation</div>
      <nav className="flex flex-col gap-0.5 mb-2">
        <Link href="/dev-docs" className={navLinkClass(is('/dev-docs'))}>
          Overview
        </Link>
        <Link href="/dev-docs/sdk-quickstart" className={navLinkClass(is('/dev-docs/sdk-quickstart'))}>
          SDK quickstart
        </Link>
      </nav>

      <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-4 mb-2 px-2.5">Reference</div>
      <nav className="flex flex-col gap-0.5">
        {docAnchors.map(({ href, label }) => (
          <Link key={href} href={href} className={navLinkClass(false)}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
