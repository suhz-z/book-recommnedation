'use client';

import { useUserWelcome, useFavorites, useFavoritesCount } from '@/lib/api';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, BookOpen, Calendar, Star } from 'lucide-react';
import Image from 'next/image';
import { LoadingState } from '@/components/UIStates';
import Link from 'next/link';
import type { FavoriteBook } from '@/types/book';
import { Suspense, memo } from 'react';

// Skeleton for loading state
function FavoriteBookSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="aspect-[2/3] bg-gray-200" />
      <CardContent className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </CardContent>
    </Card>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {[...Array(10)].map((_, i) => (
        <FavoriteBookSkeleton key={i} />
      ))}
    </div>
  );
}

export default function UserDashboard() {
  const { data: welcomeData, isLoading: welcomeLoading } = useUserWelcome();
  const { data: favorites, isLoading: favoritesLoading } = useFavorites();
  const { data: countData } = useFavoritesCount();

  if (welcomeLoading) {
    return <LoadingState />;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        
            <div className="flex items-center gap-2 mb-8">
              <div className="">
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {welcomeData?.user.name}!
                </h1>
                <p className="text-lg text-gray-600">{welcomeData?.user.email}</p>
              
              </div>
            </div>
        

      

        {/* Favorites Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Heart className="text-black h-8 w-8" />
                My Favorite Books
              </CardTitle>
              {countData && countData.count > 0 && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {countData.count} {countData.count === 1 ? 'book' : 'books'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingGrid />}>
              {favoritesLoading ? (
                <LoadingGrid />
              ) : favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {favorites.map((book) => (
                    <FavoriteBookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <EmptyFavorites />
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  value, 
  bgColor, 
  iconColor,
  isLoading = false
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: number;
  bgColor: string;
  iconColor: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`${bgColor} ${iconColor} p-3 rounded-lg flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            {isLoading ? (
              <div className="h-9 w-16 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoized to prevent unnecessary re-renders
const FavoriteBookCard = memo(function FavoriteBookCard({ book }: { book: FavoriteBook }) {
  const addedDate = new Date(book.favorited_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="group hover:shadow-xl transition-shadow h-full">
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        <div 
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking button
        >
          <FavoriteButton bookId={book.id} size="sm" initialIsFavorite={true} />
        </div>
        <Image
          src={book.cover_image_url}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          loading="lazy"
          quality={85}
        />
      </div>
      
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 transition-colors min-h-10">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        
        <Badge variant="outline" className="px-2 py-0.5 text-xs">
          {book.genre}
        </Badge>

        <div className="flex items-center justify-between pt-1">
          <Badge variant="secondary" className="px-2 py-0.5 text-xs flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {book.rating.toFixed(1)}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{addedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function EmptyFavorites() {
  return (
    <div className="text-center py-16">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <Heart className="absolute inset-0 text-gray-200" size={80} />
        <Heart 
          className="absolute inset-0 text-gray-300 animate-pulse" 
          size={80} 
          style={{ animationDelay: '0.5s' }}
        />
      </div>
      <h3 className="text-2xl font-semibold text-gray-700 mb-3">
        No favorite books yet
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Discover amazing books and start building your personal collection of favorites!
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-gradient-to-r bg-neutral-700 hover:bg-neutral-900 text-white px-8 py-3 rounded-lg  transition-all"
      >
        <BookOpen className="h-5 w-5" />
        Browse Books
      </Link>
    </div>
  );
}
