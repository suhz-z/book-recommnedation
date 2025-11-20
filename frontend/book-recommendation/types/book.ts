export interface Book {
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

export interface SimilarBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  rating: number;
  cover_image_url: string;
  similarity_score: number;
}
