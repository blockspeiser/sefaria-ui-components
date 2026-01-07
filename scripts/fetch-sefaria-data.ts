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
  ref?: string;
  heRef?: string;
  versions?: Array<{
    text?: unknown;
    language?: string;
    versionTitle?: string;
    isPrimary?: boolean;
  }>;
  sections?: (number | string)[];
  toSections?: (number | string)[];
  primary_category?: string;
  type?: string;
  categories?: string[];
  [key: string]: unknown;
}

interface SefariaTextResponse {
  ref?: string;
  heRef?: string;
  text?: unknown;
  he?: unknown;
  sections?: unknown;
  toSections?: unknown;
  primary_category?: unknown;
  type?: unknown;
  categories?: unknown;
  [key: string]: unknown;
}

function transformV3Response(v3Response: SefariaV3Response): SefariaTextResponse {
  const versions = v3Response.versions || [];

  // Find English and Hebrew versions
  const englishVersion = versions.find(v => v.language === 'en');
  const hebrewVersion = versions.find(v => v.language === 'he');

  // Convert sections to numbers
  const sections = v3Response.sections?.map(s => typeof s === 'string' ? parseInt(s, 10) : s);
  const toSections = v3Response.toSections?.map(s => typeof s === 'string' ? parseInt(s, 10) : s);

  return {
    ref: v3Response.ref,
    heRef: v3Response.heRef,
    text: englishVersion?.text,
    he: hebrewVersion?.text,
    sections,
    toSections,
    primary_category: v3Response.primary_category,
    type: v3Response.type,
    categories: v3Response.categories,
  };
}

async function fetchSefariaText(ref: string): Promise<SefariaTextResponse | null> {
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
    const transformed = transformV3Response(v3Data);
    console.log(`  Success: ${transformed.ref || ref}`);
    return transformed;
  } catch (error) {
    console.error(`  Error fetching ${ref}:`, error);
    return null;
  }
}

async function main() {
  console.log('Fetching Sefaria data...\n');

  const datastore: Record<string, SefariaTextResponse> = {};

  for (const ref of REFS_TO_FETCH) {
    const data = await fetchSefariaText(ref);
    if (data) {
      // Use the canonical ref from the response if available
      const canonicalRef = data.ref || ref;
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
  const outputPath = path.join(__dirname, '../portfolio/src/datastore.ts');

  const fileContent = `/**
 * Datastore for Sefaria Text API responses.
 * Pre-fetched data for use in portfolio examples.
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
