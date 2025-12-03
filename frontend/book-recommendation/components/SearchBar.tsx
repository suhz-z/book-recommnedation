"use client";

import { Book } from "@/types/book";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Search, X } from "lucide-react";
import {
  useRef,
  useEffect,
  useState,
  useId,
  useCallback,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  useEffect(() => {
    setIsDropdownVisible(showDropdown);
  }, [showDropdown]);

  // Focus with "/" and close with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // If focus is already in an input/textarea/contenteditable, skip focusing
      const active = document.activeElement;
      const inEditable =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable);

      if (e.key === "/" && !inEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setIsDropdownVisible(false);
        // also blur input
        (inputRef.current as HTMLInputElement | null)?.blur();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Click outside using pointerdown (handles touch/pen/mouse consistently)
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const handleBookSelect = useCallback(
    (book: Book) => {
      setIsDropdownVisible(false);
      onBookSelect(book);
    },
    [onBookSelect]
  );

  const handleSearchClick = useCallback(() => {
    setIsDropdownVisible(false);
    onSearch();
  }, [onSearch]);

  // If Enter pressed when dropdown closed: select first or search
  const handleKeyPress = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isDropdownVisible && filteredBooks.length > 0) {
        handleBookSelect(filteredBooks[0]);
      } else if (filteredBooks.length === 1) {
        // If one result but dropdown hidden (e.g. small screen), still pick it
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
    <Card className="p-6 sm:p-8 mb-8 shadow-lg" ref={containerRef}>
      <div className="space-y-4">
        <div>
          <label htmlFor="book-search" className="block text-lg font-semibold text-gray-900 mb-4">
            Search for a book to get recommendations
          </label>

          <div className="relative">
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
                  aria-controls={listboxId}
                />

                {searchQuery && (
                  <Button
                    onClick={() => {
                      onReset();
                      setIsDropdownVisible(false);
                      inputRef.current?.focus();
                    }}
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
                listboxId={listboxId}
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
  listboxId: string;
}

function SearchDropdown({ books, onSelect, searchQuery, listboxId }: SearchDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [books, searchQuery]);

  // Keyboard navigation inside dropdown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i < books.length - 1 ? i + 1 : i));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : i));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (books[selectedIndex]) onSelect(books[selectedIndex]);
      } else if (e.key === "Escape") {
        // let parent handle close on Escape
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [books, selectedIndex, onSelect]);

  return (
    <div
      id={listboxId}
      role="listbox"
      className="absolute z-50 w-full mt-2 shadow-lg border rounded-md max-h-96 overflow-auto bg-white"
    >
      {books.map((book, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            type="button"
            key={book.id}
            id={`${listboxId}-option-${idx}`}
            role="option"
            aria-selected={isSelected}
            aria-posinset={idx + 1}
            aria-setsize={books.length}
            onClick={() => onSelect(book)}
            className={`w-full text-left p-3 ${isSelected ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}
          >
            <div className="font-semibold truncate">{highlightMatch(book.title, searchQuery)}</div>
            <div className="text-sm text-gray-600 truncate">{highlightMatch(book.author, searchQuery)}</div>
            <div className="text-xs text-gray-500">{book.pub_year}</div>
          </button>
        );
      })}
      <div className="p-2 text-xs flex justify-between text-gray-400 border-t">
        <span>Use ↑↓ to navigate</span>
        <span>
          {books.length} {books.length === 1 ? "result" : "results"}
        </span>
      </div>
    </div>
  );
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const safe = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
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
