import type { PortfolioConfig } from '../../types/portfolio';
import { TextBlock, type TextBlockProps } from './TextBlock';
import { getData } from '../../../portfolio/src/datastore';

const sourceCode = `import type { CSSProperties } from 'react';
import { categoryColor } from '../../lib/palette';
import type { ComponentEventOf, EventHandler } from '../../lib/events';

export interface SefariaTextResponse {
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

export type TextBlockClickEvent = ComponentEventOf<'TextBlock', 'click', { ref: string }>;
export type TextBlockLinkClickEvent = ComponentEventOf<'TextBlock', 'linkClick', { ref: string; href: string }>;
export type TextBlockEvent = TextBlockClickEvent | TextBlockLinkClickEvent;

export interface TextBlockProps {
  ref?: string;
  sefariaData?: SefariaTextResponse;
  onEvent?: EventHandler<TextBlockEvent>;
  className?: string;
  style?: CSSProperties;
}

export function TextBlock(props: TextBlockProps) {
  // Displays a Sefaria text source with:
  // - Colored left border based on category (Tanakh, Talmud, etc.)
  // - Citation as a link to sefaria.org
  // - Text content (or "Loading..." if no data)
  // - Verse numbers for range citations
  // ...
}`;

export const textBlockPortfolio: PortfolioConfig<TextBlockProps> = {
  name: 'TextBlock',
  description:
    'Displays a Sefaria text source with a colored border indicating its category. Supports loading states, single verses, and verse ranges.',
  shortDescription: 'Sefaria text display',
  component: TextBlock,
  sourceCode,
  overviewExample: {
    sefRef: 'Genesis 1:1',
    sefariaData: getData('Genesis 1:1'),
  },
  examples: [
    {
      title: 'Loading State',
      description:
        'When only <code>ref</code> is provided, shows "Loading..." until <code>sefariaData</code> arrives',
      props: {
        sefRef: 'Genesis 1:1',
        showFollowup: false,
      },
    },
    {
      title: 'Tanakh Verse',
      description: 'Genesis 1:1 - A single verse from Torah',
      props: {
        sefRef: 'Genesis 1:1',
        sefariaData: getData('Genesis 1:1'),
        showFollowup: false,
      },
    },
    {
      title: 'Tanakh Range',
      description: 'Genesis 1:1-3 - Multiple verses with verse numbers',
      props: {
        sefRef: 'Genesis 1:1-3',
        sefariaData: getData('Genesis 1:1-3'),
        showFollowup: false,
      },
    },
    {
      title: 'Tanakh Chapter',
      description: 'Genesis 1 - An entire chapter (31 verses)',
      props: {
        sefRef: 'Genesis 1',
        sefariaData: getData('Genesis 1'),
        showFollowup: false,
      },
    },
    {
      title: 'Talmud Daf',
      description: 'Berakhot 2a - A full page of Talmud',
      props: {
        sefRef: 'Berakhot 2a',
        sefariaData: getData('Berakhot 2a'),
        showFollowup: false,
      },
    },
    {
      title: 'Talmud Segment',
      description: 'Berakhot 2a:1 - First segment of the daf',
      props: {
        sefRef: 'Berakhot 2a:1',
        sefariaData: getData('Berakhot 2a:1'),
        showFollowup: false,
      },
    },
    {
      title: 'Mishnah Verse',
      description: 'Pirkei Avot 1:1 - A single mishnah',
      props: {
        sefRef: 'Pirkei Avot 1:1',
        sefariaData: getData('Pirkei Avot 1:1'),
        showFollowup: false,
      },
    },
    {
      title: 'Mishnah Chapter',
      description: 'Pirkei Avot 1 - An entire chapter of mishnayot',
      props: {
        sefRef: 'Pirkei Avot 1',
        sefariaData: getData('Pirkei Avot 1'),
        showFollowup: false,
      },
    },
    {
      title: 'Commentary (Depth 3)',
      description: 'Rashi on Genesis 1:1:1 - Commentary with three-level citation',
      props: {
        sefRef: 'Rashi on Genesis 1:1:1',
        sefariaData: getData('Rashi on Genesis 1:1:1'),
        showFollowup: false,
      },
    },
  ],
};

export default textBlockPortfolio;
