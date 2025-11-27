"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { WeatherWidget } from './WeatherW';

export function LoadingState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">Finding similar books...</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16">
        <div className=" space-y-4">
          <div className="flex text-center">
            <WeatherWidget />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
