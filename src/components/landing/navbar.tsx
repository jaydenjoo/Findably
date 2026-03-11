'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl text-gray-900 hover:text-blue-600 transition-colors"
          >
            Findably
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
              기능
            </Link>
            <Link href="#pricing" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
              가격
            </Link>
            <Link href="#faq" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
              FAQ
            </Link>
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:translate-y-[-2px] shadow-md"
            >
              무료로 시작하기
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200/50 py-4 space-y-3">
            <Link
              href="#features"
              className="block px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              기능
            </Link>
            <Link
              href="#pricing"
              className="block px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              가격
            </Link>
            <Link
              href="#faq"
              className="block px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/signup"
              className="block px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
