import { useState, useEffect, useCallback, useMemo } from 'react';
import { Book } from '@/types/book';
import { useAllBooks, useSimilarBooks } from '@/lib/api';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useBookSearch() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const bookIdFromUrl = searchParams.get('bookId');
  const searchFromUrl = searchParams.get('search');

  // Use React Query for fetching books (cached automatically)
  const { data: books = [], isLoading: booksLoading } = useAllBooks();
  
  // Use React Query for similar books (only fetches when selectedBook exists)
  const { 
    data: similarBooks = [], 
    isLoading: similarLoading 
  } = useSimilarBooks(selectedBook?.id ?? null, 12);

  // Initialize from URL after books are loaded
  useEffect(() => {
    if (books.length > 0 && !isInitialized) {
      if (bookIdFromUrl) {
        const book = books.find((b: Book) => b.id === Number(bookIdFromUrl));
        if (book) {
          setSelectedBook(book);
          setSearchQuery(book.title);
        }
      }
      if (searchFromUrl && !bookIdFromUrl) {
        setSearchQuery(searchFromUrl);
      }
      setIsInitialized(true);
    }
  }, [books, bookIdFromUrl, searchFromUrl, isInitialized]);

  const filteredBooks = useMemo((): Book[] => {
    if (!searchQuery.trim()) return [];
    
    return books
      .filter((book: Book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [searchQuery, books]);

  const showDropdown = filteredBooks.length > 0 && searchQuery.trim() !== '' && !selectedBook;

  // Select book and update URL
  const selectBook = useCallback((book: Book): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookId', String(book.id));
    params.set('search', book.title);
    router.push(`${pathname}?${params.toString()}`);

    setSelectedBook(book);
    setSearchQuery(book.title);
  }, [searchParams, pathname, router]);

  const handleSearch = useCallback((): void => {
    if (filteredBooks.length > 0 && !selectedBook) {
      selectBook(filteredBooks[0]);
    }
  }, [filteredBooks, selectedBook, selectBook]);

  // Reset and clear URL params
  const reset = useCallback((): void => {
    router.push(pathname);
    setSearchQuery('');
    setSelectedBook(null);
    setIsInitialized(false);
  }, [pathname, router]);

  return {
    books,
    searchQuery,
    setSearchQuery,
    filteredBooks,
    selectedBook,
    similarBooks,
    loading: booksLoading || similarLoading,
    showDropdown,
    selectBook,
    handleSearch,
    reset,
  };
}
