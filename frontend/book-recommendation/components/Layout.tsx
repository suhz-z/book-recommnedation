"use client";

import { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { BookMarked } from 'lucide-react';
import { WeatherWidget } from './WeatherW';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen ">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-neutral-100 backdrop-blur-sm shadow-sm top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <BookMarked className="h-8 w-8 text-neutral-400" />
          <h1 className="text-3xl font-bold text-neutral-800">
            Book Recommendation System
          </h1>
        </div>
        <div className="flex-col items-center justify-center md:flex md:justify-between gap-4">
          
          <p className="text-center text-neutral-700">
            Find similar books
          </p>
          <div> <WeatherWidget /></div>
        </div>
      </div>
    </header>
  );
}


