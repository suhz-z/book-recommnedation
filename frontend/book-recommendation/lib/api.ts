import { Book, BooksResponse, SimilarBook, Genre } from '@/types/book';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GetBooksParams {
  page?: number;
  page_size?: number;
  genre?: string;
  language?: string;
  min_rating?: number;
}

export async function getBooks(params: GetBooksParams = {}): Promise<BooksResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', params.page.toString());
  if (params.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params.genre) searchParams.append('genre', params.genre);
  if (params.language) searchParams.append('language', params.language);
  if (params.min_rating) searchParams.append('min_rating', params.min_rating.toString());

  const response = await fetch(`${API_BASE_URL}/api/books?${searchParams}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }

  return response.json();
}

export async function getBookDetails(bookId: number): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch book details');
  }

  return response.json();
}

export async function getSimilarBooks(bookId: number, limit: number = 6): Promise<SimilarBook[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/books/${bookId}/similar?limit=${limit}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch similar books');
  }

  return response.json();
}

export async function searchBooks(query: string, page: number = 1): Promise<BooksResponse> {
  const searchParams = new URLSearchParams({
    q: query,
    page: page.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/books/search/?${searchParams}`, {
    cache: 'no-store', // Don't cache search results
  });

  if (!response.ok) {
    throw new Error('Failed to search books');
  }

  return response.json();
}

export async function getTopRatedBooks(limit: number = 20): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/api/books/top-rated?limit=${limit}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch top rated books');
  }

  return response.json();
}

export async function getGenres(): Promise<{ genres: Genre[] }> {
  const response = await fetch(`${API_BASE_URL}/api/genres`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }

  return response.json();
}

export async function getStats() {
  const response = await fetch(`${API_BASE_URL}/api/stats`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}