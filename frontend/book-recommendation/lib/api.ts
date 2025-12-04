import { useQuery } from '@tanstack/react-query';

// Use relative paths so Next.js rewrites can proxy the requests to the backend.
// In production set `NEXT_PUBLIC_API_URL` on Vercel (or your host) to the backend
// so the rewrite destination targets the correct backend URL.
export const bookService = {
  async fetchAllBooks(page = 1, pageSize = 500) {
    try {
      const response = await fetch(`/api/books?page=${page}&page_size=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      return data.books;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  async fetchSimilarBooks(bookId: number, limit = 12) {
    try {
      const response = await fetch(`/api/books/${bookId}/similar?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch similar books');
      return await response.json();
    } catch (error) {
      console.error('Error fetching similar books:', error);
      throw error;
    }
  }
};

// React Query hooks
export const useAllBooks = (page = 1, pageSize = 500) => {
  return useQuery({
    queryKey: ['books', page, pageSize],
    queryFn: () => bookService.fetchAllBooks(page, pageSize),
    staleTime: 10 * 60 * 1000, // 10 minutes - books don't change often
  });
};

export const useSimilarBooks = (bookId: number | null, limit = 12) => {
  return useQuery({
    queryKey: ['similar-books', bookId, limit],
    queryFn: () => bookService.fetchSimilarBooks(bookId!, limit),
    enabled: !!bookId, // Only run when bookId exists
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};
