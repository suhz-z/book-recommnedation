'use client';

import { Heart } from 'lucide-react';
import { useCheckFavorite, useAddFavorite, useRemoveFavorite } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext';

interface FavoriteButtonProps {
  bookId: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  initialIsFavorite?: boolean; // For SSR/initial render
}

export function FavoriteButton({ 
  bookId, 
  size = 'md', 
  variant = 'icon',
  initialIsFavorite = false 
}: FavoriteButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useCheckFavorite(user ? bookId : null);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  
  // Local state for instant UI feedback
  const [isAnimating, setIsAnimating] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(initialIsFavorite);

  // Sync with server state when it arrives
  useEffect(() => {
    if (data !== undefined) {
      setOptimisticFavorite(data.is_favorite);
    }
  }, [data]);

  const isFavorite = data?.is_favorite ?? optimisticFavorite;
  const isProcessing = addFavorite.isPending || removeFavorite.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Immediate visual feedback
    setIsAnimating(true);
    setOptimisticFavorite(!isFavorite);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(bookId);
      } else {
        await addFavorite.mutateAsync(bookId);
      }
    } catch (error) {
      // Rollback on error
      setOptimisticFavorite(isFavorite);
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
        disabled={isProcessing}
        variant={isFavorite ? 'default' : 'outline'}
        className={`${isAnimating ? 'scale-110' : 'scale-100'} transition-all`}
      >
        <Heart
          size={iconSizes[size]}
          fill={isFavorite ? 'currentColor' : 'none'}
          className="mr-2"
        />
        {user ? (
          isFavorite ? 'Remove from Favorites' : 'Add to Favorites'
        ) : (
          'Login to Favorite'
        )}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all
        ${isFavorite 
          ? 'bg-black hover:bg-black text-white' 
          : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-300'
        }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-md hover:shadow-lg`}
      title={user 
        ? (isFavorite ? 'Remove from favorites' : 'Add to favorites')
        : 'Login to add to favorites'
      }
    >
      <Heart
        size={iconSizes[size]}
        fill={isFavorite ? 'currentColor' : 'none'}
        className="transition-all"
      />
    </button>
  );
}
