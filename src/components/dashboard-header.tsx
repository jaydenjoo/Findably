'use client';

import Link from 'next/link';
import { signOutAction } from '@/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardHeaderProps {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
}

/**
 * Dashboard Header Component
 * Displays logo, navigation links, and user dropdown menu
 * Located at the top of authenticated pages
 */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  // Extract user initials from email
  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    await signOutAction();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      {/* 2-layer shadow for depth */}
      <style>{`
        header {
          box-shadow:
            0 1px 2px rgba(0,0,0,0.04),
            0 1px 4px rgba(0,0,0,0.03);
        }
      `}</style>

      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div
            className="text-2xl font-bold"
            style={{ color: '#2b7cff', fontFamily: 'DM Sans, sans-serif' }}
          >
            Findably
          </div>
        </Link>

        {/* Navigation Links - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8 flex-1 mx-8">
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            대시보드
          </Link>
          <Link
            href="/settings"
            className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            설정
          </Link>
        </nav>

        {/* User Menu Dropdown */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 h-auto px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Avatar className="h-8 w-8 bg-blue-100">
                <AvatarFallback className="bg-blue-100 text-blue-900 text-sm font-bold">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm text-gray-700 font-medium">
                {user.email}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-semibold text-gray-900">
                내 계정
              </DropdownMenuLabel>

              <div className="px-2 py-1.5 text-sm text-gray-600">
                {user.email}
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Link href="/settings" className="cursor-pointer w-full">
                  설정
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Link href="/help" className="cursor-pointer w-full">
                  도움말
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
              >
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
