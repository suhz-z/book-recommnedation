"use client";

import { SimilarBook, Book } from '@/types/book';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';

interface SimilarBooksGridProps {
  books: SimilarBook[];
  onBookClick: (book: Book) => void;
  allBooks: Book[];
}

export function SimilarBooksGrid({ books, onBookClick, allBooks }: SimilarBooksGridProps) {
  const handleBookClick = (similarBook: SimilarBook) => {
    const fullBook = allBooks.find(b => b.id === similarBook.id);
    if (fullBook) {
      onBookClick(fullBook);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
           Recommended Similar Books
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BookCard({ book, onClick }: { book: SimilarBook; onClick: () => void }) {
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="hover:shadow-xl h-full pb-3 transition-shadow">
        <div className="relative aspect-2/3 bg-muted">
          <Image
            src={book.cover_image_url}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 16vw"
          />
        </div>
        
        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
          
          {/* Genre Badge added here */}
          <Badge variant="outline" className="px-2 py-0.5 text-xs">
            {book.genre}
          </Badge>
          
          <div className="flex items-center justify-between gap-2 mt-1">
            <Badge variant="secondary" className="px-2 py-0.5 text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {book.rating.toFixed(1)}
            </Badge>
            
            <Badge variant="outline" className="px-2 py-0.5 text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {Math.round(book.similarity_score * 100)}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

