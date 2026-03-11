"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-400 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-sm font-medium text-gray-400">
            © 2026 Findably. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex gap-6 text-sm">
            <Link
              href="#terms"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              이용약관
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="#privacy"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              개인정보처리방침
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="mailto:contact@findably.com"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              문의하기
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
