"use client";

import { useBookSearch } from '@/hooks/useBookSearch';
import { PageLayout } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { SelectedBookCard } from '@/components/BookCard';
import { SimilarBooksGrid } from '@/components/SimilarBookGrid';
import { LoadingState, EmptyState } from '@/components/UIStates';

export default function Home() {
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
    <PageLayout>
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
    </PageLayout>
  );
}
