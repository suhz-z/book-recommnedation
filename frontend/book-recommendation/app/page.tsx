"use client";

import { Suspense } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { SearchBar } from '@/components/SearchBar';
import { SelectedBookCard } from '@/components/bookCard';
import { SimilarBooksGrid } from '@/components/SimilarBookGrid';
import { LoadingState, EmptyState } from '@/components/UIStates';

function HomeContent() {
  const {
    books,
    searchQuery,
    setSearchQuery,
    filteredBooks,
    selectedBook,
    similarBooks,
    loading,
    showDropdown,
    selectBook,
    reset,
    handleSearch
  } = useBookSearch();

  return (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={reset}
        filteredBooks={filteredBooks}
        showDropdown={showDropdown}
        onBookSelect={selectBook}
        onSearch={handleSearch}
      />

      {selectedBook && (
        <SelectedBookCard book={selectedBook} />
      )}

      {loading && <LoadingState />}

      {!loading && similarBooks.length > 0 && (
        <SimilarBooksGrid
          books={similarBooks}
          onBookClick={selectBook}
          allBooks={books}
        />
      )}

      {!selectedBook && !loading && <EmptyState />}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
