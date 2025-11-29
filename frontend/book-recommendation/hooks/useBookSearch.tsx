import { useState, useEffect, useCallback, useMemo } from 'react';
import { Book, SimilarBook } from '@/types/book';
import { bookService } from '@/lib/api';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useBookSearch() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const bookIdFromUrl = searchParams.get('bookId');
  const searchFromUrl = searchParams.get('search');

  // Load all books first
  const loadBooks = useCallback(async () => {
    try {
      const fetchedBooks = await bookService.fetchAllBooks();
      setBooks(fetchedBooks);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Initialize from URL after books are loaded
  useEffect(() => {
    if (books.length > 0 && !isInitialized) {
      if (bookIdFromUrl) {
        const book = books.find(b => b.id === Number (bookIdFromUrl));
        if (book) {
          selectBookInternal(book);
        }
      }
      if (searchFromUrl) {
        setSearchQuery(searchFromUrl);
      }
      setIsInitialized(true);
    }
  }, [books, bookIdFromUrl, searchFromUrl, isInitialized,]);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return books
      .filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [searchQuery, books]);

  const showDropdown = filteredBooks.length > 0 && searchQuery.trim() !== '' && !selectedBook;

  // Internal select without URL update (for initialization)
  const selectBookInternal = useCallback(async (book: Book) => {
    setSelectedBook(book);
    setSearchQuery(book.title);
    setLoading(true);

    try {
      const similar = await bookService.fetchSimilarBooks(book.id, 12);
      setSimilarBooks(similar);
    } catch (error) {
      console.error('Failed to fetch similar books:', error);
      setSimilarBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Select book and update URL
  const selectBook = useCallback(async (book: Book) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bookId', String(book.id));
    params.set('search', book.title);
    router.push(`${pathname}?${params.toString()}`);

    await selectBookInternal(book);
  }, [searchParams, pathname, router, selectBookInternal]);

  const handleSearch = useCallback(() => {
    if (filteredBooks.length > 0 && !selectedBook) {
      selectBook(filteredBooks[0]);
    }
  }, [filteredBooks, selectedBook, selectBook]);

  // Reset and clear URL params
  const reset = useCallback(() => {
    router.push(pathname);
    setSearchQuery('');
    setSelectedBook(null);
    setSimilarBooks([]);
    setIsInitialized(false);
  }, [pathname, router]);

  return {
    books,
    searchQuery,
    setSearchQuery,
    filteredBooks,
    selectedBook,
    similarBooks,
    loading,
    showDropdown,
    selectBook,
    handleSearch,
    reset,
  };
}
