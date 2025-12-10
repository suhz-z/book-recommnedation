"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';


interface UserMenuProps {
  user: { 
    name: string; 
    email: string;
    is_admin?: boolean;
  };
}


export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        logout(); // Clears user from context
        router.push('/login');
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };


  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-black text-sm font-semibold transition-all hover:bg-blue-50">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-neutral-700 hidden sm:inline">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {user.email}
            </p>
            {user.is_admin && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                Admin
              </span>
            )}
          </div>
          
          {/* Navigation Links - Only show if admin */}
          {user.is_admin && (
            <div className="py-1">
              <button
                onClick={() => { router.push('/dashboard'); setIsOpen(false); }}
                
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin Dashboard
              </button>
              
            </div>
          )}

          {/* Logout Button */}
          <div className="border-t border-neutral-100 pt-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
