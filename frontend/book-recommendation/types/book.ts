export interface Book {
  id: number;
  title: string;
  author: string;
  author_nationality: string;
  genre: string;
  subgenre: string;
  language: string;
  pub_year: number;
  pages: number;
  publisher: string;
  isbn: string;
  series: string;
  series_number: number;
  rating: number;
  awards: string;
  description: string;
  keywords: string;
  cover_image_url: string;
}

export interface SimilarBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  rating: number;
  cover_image_url: string;
  similarity_score: number;
}

export interface BooksResponse {
  total: number;
  page: number;
  page_size: number;
  books: Book[];
}

export interface Genre {
  name: string;
  count: number;
}

export interface Author {
  name: string;
  book_count: number;
  nationality: string;
}
