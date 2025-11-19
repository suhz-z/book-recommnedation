import { useState, useEffect, useCallback, useMemo } from 'react';
import { Book, SimilarBook } from '@/types/book';
import { bookService } from '@/lib/api';

export function useBookSearch() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
  const [loading, setLoading] = useState(false);

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

  const selectBook = useCallback(async (book: Book) => {
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

  const handleSearch = useCallback(() => {
    if (filteredBooks.length > 0 && !selectedBook) {
      selectBook(filteredBooks[0]);
    }
  }, [filteredBooks, selectedBook, selectBook]);

  const reset = useCallback(() => {
    setSearchQuery('');
    setSelectedBook(null);
    setSimilarBooks([]);
  }, []);

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
