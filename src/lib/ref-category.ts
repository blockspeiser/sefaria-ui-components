import sefariaIndex from './sefaria-index.json';

export interface BookIndexEntry {
  heTitle: string;
  categories: string[];
  primary_category: string;
}

// Type assertion for the imported JSON
const bookIndex = sefariaIndex as Record<string, BookIndexEntry>;

/**
 * Extracts the book title from a Sefaria citation/ref.
 * Handles various formats:
 * - Simple: "Genesis 1:1" -> "Genesis"
 * - Commentary: "Rashi on Genesis 1:1:1" -> "Genesis"
 * - Complex: "Bereishit Rabbah 1:1" -> "Bereishit Rabbah"
 */
function extractBookTitle(ref: string): string {
  // Handle commentary format: "Commentary on Book ref"
  const commentaryMatch = ref.match(/^(.+?)\s+on\s+(.+?)(?:\s+\d|$)/);
  if (commentaryMatch) {
    // For commentaries, we want the base text's category
    return extractBookTitle(commentaryMatch[2]);
  }

  // Remove everything after the first digit or colon
  // This handles: "Genesis 1:1" -> "Genesis", "Genesis 1" -> "Genesis"
  const match = ref.match(/^([^\d:]+)/);
  if (match) {
    return match[1].trim();
  }

  return ref.trim();
}

/**
 * Gets category information for a Sefaria citation/ref.
 * Returns the top-level category (primary_category) and full category path.
 *
 * @param ref - A Sefaria citation like "Genesis 1:1" or "Rashi on Genesis 1:1:1"
 * @returns Category info or null if not found
 */
export function refCategory(ref: string): {
  title: string;
  topCategory: string;
  categories: string[];
} | null {
  const bookTitle = extractBookTitle(ref);
  const entry = bookIndex[bookTitle];

  if (!entry) {
    return null;
  }

  return {
    title: bookTitle,
    topCategory: entry.primary_category,
    categories: entry.categories,
  };
}

/**
 * Gets just the top-level category for a ref.
 * Convenience function that returns just the primary category string.
 *
 * @param ref - A Sefaria citation like "Genesis 1:1"
 * @returns The top-level category (e.g., "Tanakh", "Talmud") or null if not found
 */
export function refTopCategory(ref: string): string | null {
  const result = refCategory(ref);
  return result ? result.topCategory : null;
}
