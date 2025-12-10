// hooks/AuthContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

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
        console.log('Fetched user data:', data); //
        console.log('is_admin value:', data.is_admin); //-
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

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
