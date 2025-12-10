'use client';

import { Heart } from 'lucide-react';
import { useCheckFavorite, useAddFavorite, useRemoveFavorite } from '@/lib/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FavoriteButtonProps {
  bookId: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
}

export function FavoriteButton({ bookId, size = 'md', variant = 'icon' }: FavoriteButtonProps) {
  const { data, isLoading } = useCheckFavorite(bookId);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const [isAnimating, setIsAnimating] = useState(false);

  const isFavorite = data?.is_favorite || false;
  const isProcessing = addFavorite.isPending || removeFavorite.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(bookId);
      } else {
        await addFavorite.mutateAsync(bookId);
      }
    } catch (error) {
      console.error('Favorite action failed:', error);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={handleClick}
        disabled={isLoading || isProcessing}
        variant={isFavorite ? 'default' : 'outline'}
        className={`${isAnimating ? 'scale-110' : 'scale-100'} transition-all`}
      >
        <Heart
          size={iconSizes[size]}
          fill={isFavorite ? 'currentColor' : 'none'}
          className="mr-2"
        />
        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isProcessing}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all
        ${isFavorite 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-300'
        }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-md hover:shadow-lg`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={iconSizes[size]}
        fill={isFavorite ? 'currentColor' : 'none'}
        className="transition-all"
      />
    </button>
  );
}
