/**
 * Script to fetch data from Sefaria Text API and update the datastore.
 *
 * Usage: npx tsx scripts/fetch-sefaria-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEFARIA_API_BASE = 'https://www.sefaria.org/api/v3/texts/';

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

interface SefariaV3Response {
  [key: string]: unknown;
}

async function fetchSefariaText(ref: string): Promise<SefariaV3Response | null> {
  const encodedRef = encodeURIComponent(ref);
  // Request both English and Hebrew versions
  const url = `${SEFARIA_API_BASE}${encodedRef}?version=english&version=hebrew`;

  console.log(`Fetching: ${ref}`);

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

async function main() {
  console.log('Fetching Sefaria data...\n');

  const datastore: Record<string, SefariaV3Response> = {};

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

  // Generate the datastore file
  const outputPath = path.join(__dirname, '../gallery/src/datastore.ts');

  const fileContent = `/**
 * Datastore for Sefaria Text API responses.
 * Pre-fetched data for use in gallery examples.
 *
 * Generated: ${new Date().toISOString()}
 * To regenerate: npm run datastore:fetch
 */

import type { SefariaTextResponse } from '../../src/components/TextBlock/TextBlock';

// Pre-fetched data from Sefaria Text API
export const sefariaData: Record<string, SefariaTextResponse> = ${JSON.stringify(datastore, null, 2)};

/**
 * Get Sefaria data for a ref.
 * Returns undefined if not in datastore.
 */
export function getData(ref: string): SefariaTextResponse | undefined {
  return sefariaData[ref];
}

/**
 * Get all available refs in the datastore.
 */
export function getAvailableRefs(): string[] {
  return Object.keys(sefariaData);
}

/**
 * Check if a ref is available in the datastore.
 */
export function hasData(ref: string): boolean {
  return ref in sefariaData;
}
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`\nDatastore written to: ${outputPath}`);
  console.log(`Total refs stored: ${Object.keys(datastore).length}`);
}

main().catch(console.error);
