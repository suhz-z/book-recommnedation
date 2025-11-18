'use client';
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import BookCard from '../components/bookCard';
import Sidebar from '../components/sidebar';
import { Book } from '../types/types';
import { call } from '../lib/api';

export default function HomePage() {
  const [isbnQuery, setIsbnQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [friends, setFriends] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readingList, setReadingList] = useState<Book[]>([]);

  useEffect(() => {
    fetchSample();
  }, []);

  async function fetchSample(n = 8) {
    setError(null);
    setLoading(true);
    try {
      const data = await call<Book[]>(`/books/sample?n=${n}`);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function getBookByIsbn(isbn: string) {
    if (!isbn) return;
    setError(null);
    setLoading(true);
    try {
      const book = await call<Book>(`/books/${encodeURIComponent(isbn)}`);
      setSelectedBook(book);
      recommendSimilar(isbn);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function recommendByUser(uid: string) {
    if (!uid) return;
    setError(null);
    setLoading(true);
    try {
      const data = await call<Book[]>(`/recommend/by_user/${encodeURIComponent(uid)}?n=12`);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function recommendTrending(friendCsv: string) {
    if (!friendCsv) return;
    setError(null);
    setLoading(true);
    try {
      const data = await call<Book[]>(`/recommend/trending?friends=${encodeURIComponent(friendCsv)}&n=12`);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function recommendSimilar(isbn: string) {
    if (!isbn) return;
    setError(null);
    setLoading(true);
    try {
      const data = await call<Book[]>(`/recommend/similar/${encodeURIComponent(isbn)}?n=12`);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function addToReadingList(book: Book) {
    setReadingList((s) => {
      if (s.find((b) => b.ISBN === book.ISBN)) return s;
      return [book, ...s].slice(0, 50);
    });
  }

  function removeFromReadingList(isbn: string) {
    setReadingList((s) => s.filter((b) => b.ISBN !== isbn));
  }

  return (
    <>
      <Header />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className=" flex-col lg:col-span-2 space-y-4">
          <div className="p-4 flex-col bg-white rounded shadow-sm">
            <div className="grid-cols-1 grid gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lookup book by ISBN</label>
                <div className="flex-wrap gap-2 mt-2 flex">
                  <input value={isbnQuery} onChange={(e) => setIsbnQuery(e.target.value)} placeholder="ISBN e.g. 034545104X" className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={() => getBookByIsbn(isbnQuery)} className="px-3 py-2 bg-blue-700 text-white rounded">Get</button>
                  <button onClick={() => recommendSimilar(isbnQuery)} className="px-3 py-2 bg-blue-500 text-white rounded">Similar</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recommend by user</label>
                <div className="flex gap-2 mt-2">
                  <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={() => recommendByUser(userId)} className="px-3 py-2 bg-green-600 text-white rounded">Recommend</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Trending among friends</label>
                <div className="flex gap-2 mt-2">
                  <input value={friends} onChange={(e) => setFriends(e.target.value)} placeholder="e.g. 277427,278026" className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={() => recommendTrending(friends)} className="px-3 py-2 bg-yellow-600 text-white rounded">Trending</button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => fetchSample(12)} className="px-3 py-2 bg-gray-200 rounded">Random sample</button>
              <button onClick={() => { setResults([]); setSelectedBook(null); }} className="px-3 py-2 bg-gray-200 rounded">Clear</button>
            </div>
          </div>

          <div className="p-4 bg-white rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Results</h2>

            {loading && <div className="text-sm text-gray-600">Loading…</div>}
            {error && <div className="text-sm text-red-600">Error: {error}</div>}

            {!loading && results.length === 0 && !selectedBook && (
              <div className="text-sm text-gray-500">No results — try searching or hit "Random sample".</div>
            )}

            <div className="space-y-3 mt-3">
              {selectedBook && (
                <div className="p-3 border rounded">
                  <div className="flex gap-4">
                    <img src={selectedBook['Image-URL-L'] || selectedBook['Image-URL-M'] || selectedBook['Image-URL-S']} alt={selectedBook['Book-Title']} className="w-28 h-40 object-cover rounded" />
                    <div>
                      <h3 className="text-xl font-bold">{selectedBook['Book-Title']}</h3>
                      <p className="text-gray-700">{selectedBook['Book-Author']}</p>
                      <p className="text-sm text-gray-600 mt-2">{selectedBook['Publisher']} • {selectedBook['Year-Of-Publication']}</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => addToReadingList(selectedBook)} className="px-3 py-1 bg-indigo-600 text-white rounded">Add to list</button>
                        <button onClick={() => recommendSimilar(selectedBook.ISBN)} className="px-3 py-1 bg-gray-200 rounded">Find similar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results.map((b) => (
                <div key={b.ISBN}>
                  <BookCard book={b} onChoose={(book) => { setSelectedBook(book); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                </div>
              ))}
            </div>
          </div>

        </section>

        <Sidebar readingList={readingList} onRemove={removeFromReadingList} />
      </main>

      <footer className="mt-8 text-center text-sm text-gray-500">
        Built for the BookCrossing FastAPI demo — drop issues or feature requests in your repo.
      </footer>
    </>
  );
}