'use client'

import React from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NavLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  locked: boolean
  ariaLabel: string
  onClick?: () => void
}

export function NavLink({
  href,
  icon: Icon,
  label,
  active,
  locked,
  ariaLabel,
  onClick,
}: NavLinkProps): React.JSX.Element {
  return (
    <Link
      href={href}
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-primary-50 font-semibold text-primary-700'
          : 'font-normal text-slate-600 hover:bg-slate-50'
      } ${locked ? 'text-slate-400' : ''}`}
      onClick={onClick}
      {...(active ? { 'aria-current': 'page' as const } : {})}
      aria-label={ariaLabel}
    >
      <Icon className="size-4" />
      <span>{label}</span>
      {locked && (
        <>
          <Badge
            variant="secondary"
            className="ml-auto h-4 px-1.5 text-[10px] font-semibold"
          >
            PRO
          </Badge>
          <Lock className="size-3" />
        </>
      )}
    </Link>
  )
}
