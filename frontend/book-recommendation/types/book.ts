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


export interface FavoriteBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  subgenre: string;
  rating: number;
  cover_image_url: string;
  favorited_at: string;
}

export interface FavoriteCheckResponse {
  is_favorite: boolean;
  book_id: number;
}

export interface FavoriteActionResponse {
  message: string;
  book_id: number;
  success: boolean;
}
