"use client";

import Link from "next/link";
import { BookMarked, User, LogIn } from "lucide-react";
import { WeatherWidget } from "./WeatherW";
import { UserMenu } from "./UserMenu";
import { useEffect, useState } from "react";

interface HeaderProps {
  // Optional server-provided user can be passed, but client will verify
  user?: { name: string; email: string } | null;
}

export function Header({ user: initialUser }: HeaderProps) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    initialUser || null
  );

  useEffect(() => {
    // Fetch current user from backend on the client so the browser sends cookies
    async function fetchUser() {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user on client:", err);
        setUser(null);
      }
    }

    // Only fetch if we don't already have a server-provided user
    if (!initialUser) fetchUser();
  }, [initialUser]);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Branding + Auth */}
        <div className="flex items-center justify-between py-4">
          {/* Logo & Title */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <BookMarked
              className="h-7 w-7 text-neutral-500/70"
              strokeWidth={2.5}
            />
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
              <UserMenu user={user} />
            ) : (
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-neutral-500 hover:bg-neutral-700 rounded-lg transition-all"
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
