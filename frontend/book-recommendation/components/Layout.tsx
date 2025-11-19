"use client";

import { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { BookMarked, Sparkles } from 'lucide-react';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <BookMarked className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">
            Book Recommendation System
          </h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <p className="text-center text-muted-foreground">
            Find similar books based on AI-powered recommendations
          </p>
        </div>
      </div>
    </header>
  );
}


