// Retrieve book information from Google Books and Open Library.
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

  async searchGoogle(filters) {
    const prefixes = {
      title: "intitle",
      author: "inauthor",
      subject: "subject",
    };

    const url = new URL(
      "https://www.googleapis.com/books/v1/volumes"
    );

    const query = Object.entries(filters)
      .map(([type, value]) => {
        const cleanValue = value.replaceAll('"', " ");
        return `${prefixes[type]}:"${cleanValue}"`;
      })
      .join(" ");

    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("printType", "books");

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

  async searchOpenLibrary(filters) {
    const url = new URL("https://openlibrary.org/search.json");

    Object.entries(filters).forEach(([type, value]) => {
      url.searchParams.set(type, value);
    });

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

  async search(filters) {
    const allowedFields = ["title", "author", "subject"];

    const searchTerms = Object.fromEntries(
      Object.entries(filters)
        .filter(
          ([type, value]) =>
            allowedFields.includes(type) &&
            typeof value === "string" &&
            value.trim()
        )
        .map(([type, value]) => [type, value.trim()])
    );

    if (!Object.keys(searchTerms).length) {
      throw new Error("Please enter a title, author, or subject.");
    }

    // Keep available results if one provider fails.
    const results = await Promise.allSettled([
      this.searchGoogle(searchTerms),
      this.searchOpenLibrary(searchTerms),
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