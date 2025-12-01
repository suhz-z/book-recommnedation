"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import { BookMarked, User, LogIn } from 'lucide-react';
import { WeatherWidget } from './WeatherW';

interface PageLayoutProps {
  children: ReactNode;
  user?: { name: string; email: string } | null;
}

export function PageLayout({ children, user }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function Header({ user }: { user?: { name: string; email: string } | null }) {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Branding + Auth */}
        <div className="flex items-center justify-between py-4">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <BookMarked className="h-7 w-7 text-neutral-500/70" strokeWidth={2.5} />
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 leading-tight">
                BookRec
              </h1>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Discover your next read
              </p>
            </div>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <WeatherWidget />
            </div>
            
            {user ? (
              // Logged-in user avatar
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 text-sm font-semibold transition-all hover:bg-blue-50 hover:shadow-inner hover:border-blue-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-neutral-700 hidden sm:inline">
                  {user.name}
                </span>
              </div>
            ) : (
              // Guest user buttons
              <div className="flex items-center gap-2">
                <Link 
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Log In</span>
                </Link>
                <Link 
                  href="/signup"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent bg-accent-foreground hover:scale-105 rounded-lg transition-all "
                >
                  <User className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Weather Widget */}
        <div className="md:hidden pb-3 border-t border-neutral-100 pt-3">
          <WeatherWidget />
        </div>
      </div>
    </header>
  );
}
