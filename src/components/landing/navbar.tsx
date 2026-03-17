'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-findably-dark/80 backdrop-blur-md border-b border-findably-light/10 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-[1120px] mx-auto px-6 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight text-findably-light">
          <span className="bg-linear-to-br from-findably-cyan to-[hsl(200,90%,55%)] bg-clip-text text-transparent font-black tracking-[-0.08em] text-[22px]">
            F
          </span>
          <span className="tracking-[-0.01em]">indably</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a
            href="#diagnose"
            className="hover:text-findably-cyan transition-colors min-h-[44px] flex items-center"
          >
            진단하기
          </a>
          <a
            href="#features"
            className="hover:text-findably-cyan transition-colors min-h-[44px] flex items-center"
          >
            기능
          </a>
          <a
            href="#compare"
            className="hover:text-findably-cyan transition-colors min-h-[44px] flex items-center"
          >
            비교
          </a>
          <a
            href="#pricing"
            className="hover:text-findably-cyan transition-colors min-h-[44px] flex items-center"
          >
            가격
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-findably-cyan min-h-[44px] flex items-center"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="bg-findably-cyan hover:bg-findably-cyan/90 text-findably-cyan-foreground px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 min-h-[44px] flex items-center"
          >
            무료 진단 시작
          </Link>
        </div>

        <button
          className="md:hidden text-findably-light min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴 열기/닫기"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-findably-dark/95 backdrop-blur-md border-t border-findably-light/10 px-6 py-6 space-y-4">
          <a
            href="#diagnose"
            className="flex text-sm font-medium text-slate-300 hover:text-findably-cyan py-2 min-h-[44px] items-center"
            onClick={() => setMobileOpen(false)}
          >
            진단하기
          </a>
          <a
            href="#features"
            className="flex text-sm font-medium text-slate-300 hover:text-findably-cyan py-2 min-h-[44px] items-center"
            onClick={() => setMobileOpen(false)}
          >
            기능
          </a>
          <a
            href="#compare"
            className="flex text-sm font-medium text-slate-300 hover:text-findably-cyan py-2 min-h-[44px] items-center"
            onClick={() => setMobileOpen(false)}
          >
            비교
          </a>
          <a
            href="#pricing"
            className="flex text-sm font-medium text-slate-300 hover:text-findably-cyan py-2 min-h-[44px] items-center"
            onClick={() => setMobileOpen(false)}
          >
            가격
          </a>
          <Link
            href="/login"
            className="flex text-sm font-medium text-slate-300 hover:text-findably-cyan py-2 min-h-[44px] items-center"
            onClick={() => setMobileOpen(false)}
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-findably-cyan text-findably-cyan-foreground px-5 py-3 rounded-full text-sm font-bold min-h-[44px] text-center"
            onClick={() => setMobileOpen(false)}
          >
            무료 진단 시작
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
