// Retrieve book data from two external APIs.
export default class BookService {
  async fetchData(url) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }

  async searchGoogle(query, type) {
    const prefixes = {
      title: "intitle",
      author: "inauthor",
      subject: "subject",
    };

    const url = new URL(
      "https://www.googleapis.com/books/v1/volumes"
    );

    url.searchParams.set("q", `${prefixes[type]}:${query}`);
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("printType", "books");
    url.searchParams.set("key", "AIzaSyBBtCcDELszI1hSAAzPQj5kr9stSk3wtjQ");

    const data = await this.fetchData(url);

    return (data.items || []).map((item) => {
      const info = item.volumeInfo || {};

      return {
        id: `google-${item.id}`,
        title: info.title || "Untitled book",
        authors: (info.authors || []).join(", ") || "Unknown author",
        published: info.publishedDate || "Unknown",
        description: info.description || "No description available.",
        cover: (info.imageLinks?.thumbnail || "").replace(
          /^http:/,
          "https:"
        ),
        link: `https://books.google.com/books?id=${encodeURIComponent(item.id)}`,
        source: "Google Books",
      };
    });
  }

  async searchOpenLibrary(query, type) {
    const url = new URL("https://openlibrary.org/search.json");

    url.searchParams.set(type, query);
    url.searchParams.set("limit", "12");
    url.searchParams.set(
      "fields",
      "key,title,author_name,first_publish_year,cover_i"
    );

    const data = await this.fetchData(url);

    return (data.docs || [])
      .filter((item) => /^\/works\/OL\d+W$/.test(item.key))
      .map((item) => ({
        id: `openlibrary-${item.key}`,
        title: item.title || "Untitled book",
        authors:
          (item.author_name || []).join(", ") || "Unknown author",
        published: String(item.first_publish_year || "Unknown"),
        description:
          "Visit Open Library for more information about this book.",
        cover: item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
          : "",
        link: `https://openlibrary.org${item.key}`,
        source: "Open Library",
      }));
  }

  async search(query, type = "title") {
    const searchTerms = query.trim();

    if (!searchTerms) {
      throw new Error("Please enter a title, author, or subject.");
    }

    if (!["title", "author", "subject"].includes(type)) {
      throw new Error("Please select a valid search type.");
    }

    // Keep available results if one provider fails.
    const results = await Promise.allSettled([
      this.searchGoogle(searchTerms, type),
      this.searchOpenLibrary(searchTerms, type),
    ]);

    if (results.every((result) => result.status === "rejected")) {
      throw new Error(
        "Book services are unavailable. Please try again later."
      );
    }

    const books = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    return {
      books,
      partial: results.some(
        (result) => result.status === "rejected"
      ),
    };
  }
}