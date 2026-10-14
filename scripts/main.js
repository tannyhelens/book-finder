import ReadingList from "./ReadingList.js";
import BookService from "./BookService.js";

const readingList = new ReadingList();
const bookService = new BookService();

const form = document.querySelector("#search-form");

const searchFields = {
  title: document.querySelector("#title-input"),
  author: document.querySelector("#author-input"),
  subject: document.querySelector("#subject-input"),
};

const searchButton = form.querySelector("button");
const searchStatus = document.querySelector("#search-status");
const searchResults = document.querySelector("#search-results");
const listStatus = document.querySelector("#reading-list-status");
const listContainer = document.querySelector("#reading-list");

let currentResults = [];

document.querySelector("#current-year").textContent =
  new Date().getFullYear();

// Display API information safely using textContent.
function createText(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function createBookCard(book, isReadingList = false) {
  const card = document.createElement("article");
  card.className = "book-card";

  if (book.cover) {
    const image = document.createElement("img");
    image.src = book.cover;
    image.alt = `Cover of ${book.title}`;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      image.replaceWith(createText("p", "Cover unavailable."));
    });

    card.append(image);
  } else {
    card.append(createText("p", "Cover unavailable."));
  }

  card.append(
    createText("h3", book.title),
    createText("p", `Author: ${book.authors}`),
    createText("p", `Published: ${book.published}`),
    createText("p", `Source: ${book.source}`)
  );

 const details = document.createElement("details");

details.addEventListener("toggle", () => {
  const summary = details.querySelector("summary");

  summary.textContent = details.open
    ? "Hide book description"
    : "Book description";
});

details.append(
  createText("summary", "Book description"),
  createText("p", book.description)
);
card.append(details);

  // Only create external links with a valid HTTPS address.
  try {
    const url = new URL(book.link);

    if (url.protocol === "https:") {
      const link = createText(
        "a",
        `View book information on ${book.source}`
      );

      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link);
    }
  } catch {
    // Books without a valid link can still be saved.
  }

  const button = document.createElement("button");
  button.type = "button";

  const alreadySaved = readingList.hasBook(book.id);

  button.textContent = isReadingList
    ? "Remove from Reading List"
    : alreadySaved
      ? "Already Saved"
      : "Add to Reading List";

  button.disabled = !isReadingList && alreadySaved;

  button.addEventListener("click", () => {
    try {
      if (isReadingList) {
        readingList.removeBook(book.id);
      } else {
        readingList.addBook(book);
      }

      renderReadingList();
      renderSearchResults();

      listStatus.textContent += isReadingList
        ? ` Removed: ${book.title}.`
        : ` Added: ${book.title}.`;
    } catch {
      listStatus.textContent =
        "Unable to save changes. Please check your browser storage settings.";
    }
  });

  card.append(button);
  return card;
}

function renderSearchResults() {
  searchResults.replaceChildren(
    ...currentResults.map((book) => createBookCard(book))
  );
}

function renderReadingList() {
  const books = readingList.getBooks();

  listContainer.replaceChildren(
    ...books.map((book) => createBookCard(book, true))
  );

  listStatus.textContent = books.length
    ? `Books in your reading list: ${books.length}.`
    : "Your reading list is empty. Search for a book to get started.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const filters = Object.fromEntries(
    Object.entries(searchFields).map(([name, input]) => [
      name,
      input.value.trim(),
    ])
  );

  if (!Object.values(filters).some(Boolean)) {
    searchStatus.textContent =
      "Please enter a title, author, or subject.";
    searchFields.title.focus();
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  searchResults.setAttribute("aria-busy", "true");
  searchStatus.textContent = "Searching for books...";

  currentResults = [];
  renderSearchResults();

  try {
    const result = await bookService.search(filters);

    currentResults = result.books;
    renderSearchResults();

    searchStatus.textContent = currentResults.length
      ? `Found ${currentResults.length} results.`
      : "No books found. Try different search terms.";

    if (result.partial) {
      searchStatus.textContent +=
        " One book service is unavailable; showing results from the other.";
    }
  } catch (error) {
    searchStatus.textContent =
      error.message || "Unable to search. Please try again.";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
    searchResults.setAttribute("aria-busy", "false");
  }
});

Object.values(searchFields).forEach((input) => {
  input.addEventListener("input", () => {
    if (
      searchStatus.textContent ===
      "Please enter a title, author, or subject."
    ) {
      searchStatus.textContent = "";
    }
  });
});

Object.values(searchFields).forEach((input) => {
  input.addEventListener("input", () => {
    if (
      searchStatus.textContent ===
      "Please enter a title, author, or subject."
    ) {
      searchStatus.textContent = "";
    }
  });
});

Object.values(searchFields).forEach((input) => {
  input.addEventListener("input", () => {
    if (
      searchStatus.textContent ===
      "Please enter a title, author, or subject."
    ) {
      searchStatus.textContent = "";
    }
  });
});
renderReadingList();