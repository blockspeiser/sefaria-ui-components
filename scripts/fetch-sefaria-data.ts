/**
 * Script to fetch data from Sefaria Text API and Word API and update the datastore.
 *
 * Usage: npx tsx scripts/fetch-sefaria-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEFARIA_API_BASE = 'https://www.sefaria.org/api/v3/texts/';
const SEFARIA_WORD_API_BASE = 'https://www.sefaria.org/api/words/';

const REFS_TO_FETCH = [
  'Genesis 1:1',
  'Genesis 1',
  'Genesis 1:1-3',
  'Berakhot 2a',
  'Berakhot 2a:1',
  'Pirkei Avot 1:1',
  'Pirkei Avot 1',
  'Rashi on Genesis 1:1:1',
];

const WORDS_TO_FETCH = [
  'תורה',    // Torah
  'שלום',    // Shalom
  'חכמה',    // Chochmah
  'צדקה',    // Tzedakah
  'אוריתא',  // Oraita (Aramaic)
  'אמת',     // Cubit (Hebrew/Aramaic)
];

interface SefariaV3Response {
  [key: string]: unknown;
}

interface SefariaWordResponse {
  [key: string]: unknown;
}

async function fetchSefariaText(ref: string): Promise<SefariaV3Response | null> {
  const encodedRef = encodeURIComponent(ref);
  // Request both English and Hebrew versions
  const url = `${SEFARIA_API_BASE}${encodedRef}?version=english&version=hebrew`;

  console.log(`Fetching text: ${ref}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`  Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const v3Data: SefariaV3Response = await response.json();
    const dataRef = typeof v3Data.ref === 'string' ? v3Data.ref : ref;
    console.log(`  Success: ${dataRef || ref}`);
    return v3Data;
  } catch (error) {
    console.error(`  Error fetching ${ref}:`, error);
    return null;
  }
}

async function fetchSefariaWord(word: string): Promise<SefariaWordResponse | null> {
  const encodedWord = encodeURIComponent(word);
  const url = `${SEFARIA_WORD_API_BASE}${encodedWord}`;

  console.log(`Fetching word: ${word}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`  Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const wordData: SefariaWordResponse = await response.json();
    console.log(`  Success: ${word}`);
    return wordData;
  } catch (error) {
    console.error(`  Error fetching word ${word}:`, error);
    return null;
  }
}

async function main() {
  console.log('Fetching Sefaria data...\n');

  const datastore: Record<string, SefariaV3Response> = {};
  const wordDatastore: Record<string, SefariaWordResponse> = {};

  // Fetch text data
  console.log('=== Fetching Text Data ===\n');
  for (const ref of REFS_TO_FETCH) {
    const data = await fetchSefariaText(ref);
    if (data) {
      // Use the canonical ref from the response if available
      const canonicalRef = typeof data.ref === 'string' ? data.ref : ref;
      datastore[canonicalRef] = data;

      // Also store under the original ref if different
      if (canonicalRef !== ref) {
        datastore[ref] = data;
      }
    }

    // Small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Fetch word data
  console.log('\n=== Fetching Word Data ===\n');
  for (const word of WORDS_TO_FETCH) {
    const data = await fetchSefariaWord(word);
    if (data) {
      wordDatastore[word] = data;
    }

    // Small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate the datastore file
  const outputPath = path.join(__dirname, '../gallery/src/datastore.ts');

  const fileContent = `/**
 * Datastore for Sefaria Text API and Word API responses.
 * Pre-fetched data for use in gallery examples.
 *
 * Generated: ${new Date().toISOString()}
 * To regenerate: npm run datastore:fetch
 */

import type { SefariaTextResponse } from '../../src/components/TextBlock/TextBlock';
import type { SefariaWordResponse } from '../../src/components/DictionaryBlock/DictionaryBlock';

// Pre-fetched data from Sefaria Text API
export const sefariaData: Record<string, SefariaTextResponse> = ${JSON.stringify(datastore, null, 2)};

// Pre-fetched data from Sefaria Word API
export const sefariaWordData: Record<string, SefariaWordResponse> = ${JSON.stringify(wordDatastore, null, 2)};

/**
 * Get Sefaria text data for a ref.
 * Returns undefined if not in datastore.
 */
export function getData(ref: string): SefariaTextResponse | undefined {
  return sefariaData[ref];
}

/**
 * Get Sefaria word data for a word.
 * Returns undefined if not in datastore.
 */
export function getWordData(word: string): SefariaWordResponse | undefined {
  return sefariaWordData[word];
}

/**
 * Get all available refs in the datastore.
 */
export function getAvailableRefs(): string[] {
  return Object.keys(sefariaData);
}

/**
 * Get all available words in the datastore.
 */
export function getAvailableWords(): string[] {
  return Object.keys(sefariaWordData);
}

/**
 * Check if a ref is available in the datastore.
 */
export function hasData(ref: string): boolean {
  return ref in sefariaData;
}

/**
 * Check if a word is available in the datastore.
 */
export function hasWordData(word: string): boolean {
  return word in sefariaWordData;
}
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`\nDatastore written to: ${outputPath}`);
  console.log(`Total text refs stored: ${Object.keys(datastore).length}`);
  console.log(`Total words stored: ${Object.keys(wordDatastore).length}`);
}

main().catch(console.error);
