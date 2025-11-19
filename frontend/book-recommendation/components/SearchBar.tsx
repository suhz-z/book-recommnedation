"use client";

import { Book } from '@/types/book';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, BookOpen } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  filteredBooks: Book[];
  showDropdown: boolean;
  onBookSelect: (book: Book) => void;
  onSearch: () => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  onReset,
  filteredBooks,
  showDropdown,
  onBookSelect,
  onSearch,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  useEffect(() => {
    setIsDropdownVisible(showDropdown);
  }, [showDropdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBookSelect = (book: Book) => {
    setIsDropdownVisible(false);
    onBookSelect(book);
  };

  const handleSearchClick = () => {
    setIsDropdownVisible(false);
    onSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredBooks.length > 0) {
        handleBookSelect(filteredBooks[0]);
      } else {
        handleSearchClick();
      }
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.trim() && filteredBooks.length > 0) {
      setIsDropdownVisible(true);
    }
  };

  return (
    <Card className="p-6 sm:p-8 mb-8 shadow-lg">
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="book-search"
            className="block text-lg font-semibold text-gray-900 mb-4"
          >
            Search for a book to get recommendations
          </label>

          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 pointer-events-none" 
                  aria-hidden="true"
                />
                
                <Input
                  ref={inputRef}
                  id="book-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={handleInputFocus}
                  placeholder="Type a book title or author name..."
                  className="pl-12 pr-12 py-6 text-base sm:text-lg"
                  aria-label="Search for books"
                  aria-autocomplete="list"
                  aria-expanded={isDropdownVisible}
                  role="combobox"
                />

                {searchQuery && (
                  <Button
                    onClick={onReset}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <Button
                onClick={handleSearchClick}
                disabled={!searchQuery.trim()}
                className="px-6 py-6 text-base font-medium"
                size="lg"
              >
                <Search className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>

            {isDropdownVisible && filteredBooks.length > 0 && (
              <SearchDropdown 
                books={filteredBooks} 
                onSelect={handleBookSelect}
                searchQuery={searchQuery}
              />
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <span className="hidden sm:inline"> Press</span>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">Enter</kbd>
            <span className="hidden sm:inline">to select first result or</span>
            <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border hidden sm:inline">/</kbd>
            <span className="hidden sm:inline">to focus search</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

interface SearchDropdownProps {
  books: Book[];
  onSelect: (book: Book) => void;
  searchQuery: string;
}

function SearchDropdown({ books, onSelect, searchQuery }: SearchDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < books.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && books[selectedIndex]) {
        e.preventDefault();
        onSelect(books[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [books, selectedIndex, onSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <Card 
      className="absolute z-50 w-full mt-2 shadow-2xl border-2 animate-in fade-in slide-in-from-top-2 duration-200"
      id="search-results"
      role="listbox"
    >
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y">
          {books.map((book, index) => (
            <button
              key={book.id}
              onClick={() => onSelect(book)}
              className={`w-full px-4 py-3 text-left flex items-center gap-4 transition-all duration-150 focus:outline-none ${
                index === selectedIndex
                  ? 'bg-accent/80 border-l-4 border-primary'
                  : 'hover:bg-accent/50 border-l-4 border-transparent'
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden shadow-sm">
                <Image
                  src={book.cover_image_url}
                  alt={`Cover of ${book.title}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                  {highlightMatch(book.title, searchQuery)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {highlightMatch(book.author, searchQuery)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {book.genre} • {book.pub_year}
                </div>
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex items-center justify-between">
        <span>Use ↑↓ to navigate</span>
        <span>{books.length} results</span>
      </div>
    </Card>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 font-semibold">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}
