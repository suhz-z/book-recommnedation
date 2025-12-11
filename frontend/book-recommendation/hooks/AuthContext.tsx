// hooks/AuthContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: number;  
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: ReactNode; 
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const fetchUser = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched user data:', data);
        console.log('is_admin value:', data.is_admin);
        
        // Check if user changed (different ID)
        if (user && user.id !== data.id) {
          console.log('User changed, clearing cache');
          queryClient.clear(); // Clear cache when different user logs in
        }
        
        setUser(data);
      } else {
        console.log('Auth failed, clearing user and cache');
        setUser(null);
        queryClient.clear(); // Clear cache on auth failure
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      queryClient.clear(); // Clear cache on error
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out, clearing cache');
    setUser(null);
    
    // CRITICAL: Clear ALL React Query cache on logout
    queryClient.clear();
    
    // Alternative: Clear specific queries only
    // queryClient.removeQueries({ queryKey: ['favorites'] });
    // queryClient.removeQueries({ queryKey: ['favorite-check'] });
    // queryClient.removeQueries({ queryKey: ['favorites-count'] });
    // queryClient.removeQueries({ queryKey: ['user-welcome'] });
  };

  useEffect(() => {
    // Only fetch if no initial user provided
    if (!initialUser) {
      fetchUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
