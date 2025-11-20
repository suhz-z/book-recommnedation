const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const bookService = {
  /**
   * Fetches all books with pagination
   * @param page - Page number
   * @param pageSize - Number of books per page
   */
  async fetchAllBooks(page = 1, pageSize = 500) {
    try {
      const response = await fetch(`${API_URL}/api/books?page=${page}&page_size=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      return data.books;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  /**
   * Fetches similar books based on a given book ID
   * @param bookId - The ID of the book to find similar books for
   * @param limit - Maximum number of similar books to return
   */
  async fetchSimilarBooks(bookId: number, limit = 12) {
    try {
      const response = await fetch(`${API_URL}/api/books/${bookId}/similar?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch similar books');
      return await response.json();
    } catch (error) {
      console.error('Error fetching similar books:', error);
      throw error;
    }
  }
};
