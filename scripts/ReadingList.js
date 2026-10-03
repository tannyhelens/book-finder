// Manage the reading list using localStorage.
export default class ReadingList {
  constructor() {
    this.storageKey = "book-finder-reading-list";
    this.books = this.load();
  }

  load() {
    try {
      const savedBooks = JSON.parse(
        localStorage.getItem(this.storageKey) || "[]"
      );

      return Array.isArray(savedBooks) ? savedBooks : [];
    } catch {
      return [];
    }
  }

  save() {
    // Storage errors are handled by the calling code.
    localStorage.setItem(this.storageKey, JSON.stringify(this.books));
  }

  hasBook(id) {
    return this.books.some((book) => book.id === id);
  }

  addBook(book) {
    if (this.hasBook(book.id)) {
      return false;
    }

    const previousBooks = this.books;
    this.books = [...this.books, book];

    try {
      this.save();
    } catch (error) {
      this.books = previousBooks;
      throw error;
    }

    return true;
  }

  removeBook(id) {
    const previousBooks = this.books;
    this.books = this.books.filter((book) => book.id !== id);

    try {
      this.save();
    } catch (error) {
      this.books = previousBooks;
      throw error;
    }
  }

  getBooks() {
    return [...this.books];
  }
}