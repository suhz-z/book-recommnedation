"use client";

import { Book } from '@/types/book';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Calendar, BookOpen } from 'lucide-react';

interface SelectedBookCardProps {
  book: Book;
}

export function SelectedBookCard({ book }: SelectedBookCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">Selected Book</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8">
          <BookCover 
            src={book.cover_image_url} 
            alt={book.title} 
          />
          
          <BookDetails book={book} />
        </div>
      </CardContent>
    </Card>
  );
}

function BookCover({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="shrink-0">
      <div className="relative w-48 h-72 rounded-lg overflow-hidden shadow-md">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          loading="lazy"
          quality={85}
        />
      </div>
    </div>
  );
}

function BookDetails({ book }: { book: Book }) {
  return (
    <div className="flex-1 space-y-4">
      <div>
        <h3 className="text-2xl font-bold  mb-2">{book.title}</h3>
        <p className="text-lg text-muted-foreground">by {book.author}</p>
      </div>

      <BookMetadata 
        rating={book.rating}
        genre={book.genre}
        subgenre={book.subgenre}
        year={book.pub_year}
        pages={book.pages}
      />

      <Separator />

      <p className="text-gray-700 leading-relaxed">{book.description}</p>
    </div>
  );
}

function BookMetadata({ rating, genre, subgenre, year, pages }: { 
  rating: number; 
  genre: string;
  subgenre: string;
  year: number; 
  pages: number;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold">{rating.toFixed(2)}</span>
      </Badge>
      
      <Badge variant="default" className="px-3 py-1.5">
        {genre}
      </Badge>

      <Badge variant="outline" className="px-3 py-1.5">
        {subgenre}
      </Badge>
      
      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {year}
      </Badge>
      
      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        {pages} pages
      </Badge>
    </div>
  );
}
