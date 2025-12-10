'use client';

import { useUserWelcome, useFavorites } from '@/lib/api';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, BookOpen, Calendar, Star } from 'lucide-react';
import Image from 'next/image';
import { LoadingState} from '@/components/UIStates';
import Link from 'next/link';
import type { FavoriteBook } from '@/types/book';

export default function UserDashboard() {
  const { data: welcomeData, isLoading: welcomeLoading } = useUserWelcome();
  const { data: favorites, isLoading: favoritesLoading } = useFavorites();

  if (welcomeLoading) {
    return <LoadingState />;
  }

  const memberSince = welcomeData?.user.created_at 
    ? new Date(welcomeData.user.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : '';

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
             
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {welcomeData?.user.name}!
                </h1>
                <p className="text-lg opacity-90">{welcomeData?.user.email}</p>
                
              </div>
            </div>
          </CardContent>
        </div>

        {/* Stats Card */}
    

        {/* Favorites Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Heart className="text-red-500 h-8 w-8" />
              My Favorite Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading your favorites...</p>
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {favorites.map((book) => (
                  <FavoriteBookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Heart className="mx-auto text-gray-300 mb-4" size={80} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No favorite books yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start exploring and add books to your favorites!
                </p>
                <Link
                  href="/"
                  className="inline-block bg-neutral-700 text-white px-6 py-3 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Browse Books
                </Link>
              </div>
            )}
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
  iconColor 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: number;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FavoriteBookCard({ book } : { book: FavoriteBook }) {
  const addedDate = new Date(book.favorited_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="group hover:shadow-xl transition-shadow">
      <div className="relative aspect-2/3 bg-muted overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton bookId={book.id} size="sm" />
        </div>
        <Image
          src={book.cover_image_url}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 16vw"
        />
      </div>
      
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-black transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-0.5 text-xs">
            {book.genre}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="px-2 py-0.5 text-xs flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {book.rating.toFixed(1)}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
          <Calendar className="h-3 w-3" />
          <span>Added {addedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
