import type { GalleryConfig } from '../../types/gallery';
import { SheetBlock, type SheetBlockProps } from './SheetBlock';

const sourceCode = `import type { CSSProperties } from 'react';

// Response from https://www.sefaria.org/api/sheets/{id}
export interface SheetData {
  id: number;
  title: string;
  owner: number;
  sources: unknown[];
  tags?: string[];
  views?: number;
  dateCreated?: string;
  dateModified?: string;
  [key: string]: unknown;
}

export interface SheetBlockProps {
  id: number;
  className?: string;
  style?: CSSProperties;
}

export function SheetBlock(props: SheetBlockProps) {
  // Displays a Sefaria source sheet with:
  // - Owner ID in a circle
  // - Sheet title as a link to sefaria.org/sheets/{id}
  // - Summary information (source count, categories)
  // - White background with border styling
  // ...
}`;

export const sheetBlockGallery: GalleryConfig<SheetBlockProps> = {
  name: 'SheetBlock',
  description:
    'Displays a Sefaria source sheet with metadata including title, owner, source count, and categories. Fetches sheet data from the Sefaria API.',
  shortDescription:
    'A formatted display of a Sefaria source sheet with summary information and interactive link.',
  component: SheetBlock,
  sourceCode,
  propsList: ['id', 'className', 'style'],
  overviewExample: {
    id: 1,
  },
  examples: [
    {
      title: 'Sheet #1 - First Lines',
      description:
        'A sheet containing opening verses from various books of the Tanakh',
      props: {
        id: 1,
      },
    },
    {
      title: 'Custom Styling',
      description: 'Sheet block with custom styling applied',
      props: {
        id: 1,
        style: {
          maxWidth: '600px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  ],
};

export default sheetBlockGallery;
