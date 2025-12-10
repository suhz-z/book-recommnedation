import "./globals.css";
import type { ReactNode } from "react";
import { QueryProvider } from "./providers";
import { cookies } from 'next/headers';
import { Header } from "@/components/header/Header";
import { AuthProvider } from "@/hooks/AuthContext";

export const metadata = {
  title: "BookRec",
  description: "Read more books you'll love",
};

// Server function to get authenticated user
async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token');
  
  if (!token) {
    return null;
  }
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Cookie: `access_token=${token.value}`
      },
      credentials: 'include',
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider initialUser={user}>
            <div className="min-h-screen bg-linear-to-br from-neutral-50 to-neutral-100">
              <Header />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
