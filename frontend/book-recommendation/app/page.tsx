"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  rating: number;
  description: string;
  cover_image_url: string;
  pub_year: number;
  pages: number;
}

interface SimilarBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  rating: number;
  cover_image_url: string;
  similarity_score: number;
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load all books on mount
  useEffect(() => {
    fetchAllBooks();
  }, []);

  const fetchAllBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/books?page=1&page_size=500`);
      const data = await response.json();
      setBooks(data.books);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  // Filter books based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setFilteredBooks(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredBooks([]);
      setShowDropdown(false);
    }
  }, [searchQuery, books]);

  const handleBookSelect = async (book: Book) => {
    setSelectedBook(book);
    setSearchQuery(book.title);
    setShowDropdown(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/books/${book.id}/similar?limit=12`);
      const data = await response.json();
      setSimilarBooks(data);
    } catch (error) {
      console.error('Error fetching similar books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedBook(null);
    setSimilarBooks([]);
    setFilteredBooks([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            📚 Book Recommendation System
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Find similar books based on AI-powered recommendations
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="relative">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Search for a book to get recommendations:
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a book title or author name..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />

              {searchQuery && (
                <button
                  onClick={handleReset}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleBookSelect(book)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-4 border-b border-gray-100 last:border-0"
                    >
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        width={40}
                        height={60}
                        className="object-cover rounded"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{book.title}</div>
                        <div className="text-sm text-gray-600">{book.author}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Book Section */}
        {selectedBook && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Selected Book</h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0">
                <Image
                  src={selectedBook.cover_image_url}
                  alt={selectedBook.title}
                  width={200}
                  height={300}
                  className="object-cover rounded-lg shadow-md"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedBook.title}</h3>
                <p className="text-lg text-gray-700 mb-4">by {selectedBook.author}</p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center text-yellow-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-2 font-semibold">{selectedBook.rating.toFixed(2)}</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedBook.genre}
                  </span>
                  <span className="text-gray-600">{selectedBook.pub_year}</span>
                  <span className="text-gray-600">{selectedBook.pages} pages</span>
                </div>

                <p className="text-gray-700 leading-relaxed">{selectedBook.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Finding similar books...</p>
          </div>
        )}

        {/* Similar Books Section */}
        {!loading && similarBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📖 Recommended Similar Books
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similarBooks.map((book) => (
                <div
                  key={book.id}
                  className="group cursor-pointer"
                  onClick={() => {
                    setSearchQuery(book.title);
                    // Find the full book object and select it
                    const fullBook = books.find(b => b.id === book.id);
                    if (fullBook) handleBookSelect(fullBook);
                  }}
                >
                  <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="relative aspect-[2/3] bg-gray-200">
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 16vw"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-yellow-500">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-xs">{book.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
                          {Math.round(book.similarity_score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedBook && !loading && (
          <div className="text-center py-16">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Start by searching for a book
            </h3>
            <p className="text-gray-500">
              Type in the search box above to find a book and get personalized recommendations
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            Powered by AI-based similarity matching using TF-IDF and Cosine Similarity
          </p>
        </div>
      </footer>
    </div>
  );
}