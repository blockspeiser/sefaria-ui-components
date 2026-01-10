import type { GalleryConfig } from '../../types/gallery';
import { DictionaryBlock, type DictionaryBlockProps } from './DictionaryBlock';
import { getWordData } from '../../../gallery/src/datastore';

const sourceCode = `import type { CSSProperties } from 'react';
import type { ComponentEventOf, EventHandler } from '../../lib/events';

// Response from https://www.sefaria.org/api/words/{word}
export type SefariaWordResponse = LexiconEntry[];

export interface LexiconEntry {
  headword?: string;
  parent_lexicon?: string;
  content?: LexiconContent;
  rid?: string;
  derivatives?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface LexiconContent {
  morphology?: string;
  senses?: LexiconSense[];
  [key: string]: unknown;
}

export interface LexiconSense {
  definition?: string;
  number?: string;
  language_code?: string;
  plural_form?: string;
  senses?: LexiconSense[];
  [key: string]: unknown;
}

export type DictionaryBlockClickEvent = ComponentEventOf<'DictionaryBlock', 'click', { word: string }>;
export type DictionaryBlockEvent = DictionaryBlockClickEvent;

export interface DictionaryBlockProps {
  word: string;
  sefariaData?: SefariaWordResponse;
  fetchData?: boolean;
  onEvent?: EventHandler<DictionaryBlockEvent>;
  className?: string;
  style?: CSSProperties;
}

export function DictionaryBlock(props: DictionaryBlockProps) {
  // Displays lexicon entries from the Sefaria Word API with:
  // - Light grey background
  // - Hebrew/Aramaic word left-aligned
  // - Pill tabs to toggle between different lexicon sources
  // - Morphology information (part of speech)
  // - Numbered definitions with nested senses
  // - Language codes and notes
  // ...
}`;

export const dictionaryBlockGallery: GalleryConfig<DictionaryBlockProps> = {
  name: 'DictionaryBlock',
  description:
    'Displays lexicon entries from the Sefaria Word API with a light grey background. Shows dictionary definitions, morphology, and related word information for Hebrew and Aramaic words.',
  shortDescription:
    'A dictionary block displaying lexicon entries for Hebrew and Aramaic words from Sefaria.',
  component: DictionaryBlock,
  sourceCode,
  propsList: ['word', 'sefariaData', 'fetchData', 'onEvent', 'className', 'style'],
  overviewExample: {
    word: 'תורה',
    sefariaData: getWordData('תורה'),
  },
  examples: [
    {
      title: 'Loading State',
      description:
        'When <code>fetchData</code> is false and no <code>sefariaData</code> is provided, shows "Loading..." state',
      props: {
        word: 'תורה',
        fetchData: false,
      },
    },
    {
      title: 'Auto-fetch Data',
      description:
        'Set <code>fetchData</code> to true to automatically fetch lexicon data from the Sefaria API',
      props: {
        word: 'שלום',
        fetchData: true,
      },
    },
    {
      title: 'Hebrew: תורה (Torah)',
      description: 'The word "Torah" - instruction, teaching, the Five Books',
      props: {
        word: 'תורה',
        sefariaData: getWordData('תורה'),
      },
    },
    {
      title: 'Hebrew: שלום (Shalom)',
      description: 'The word "Shalom" - peace, well-being, completeness',
      props: {
        word: 'שלום',
        sefariaData: getWordData('שלום'),
      },
    },
    {
      title: 'Hebrew: חכמה (Chochmah)',
      description: 'The word "Chochmah" - wisdom, skill, shrewdness',
      props: {
        word: 'חכמה',
        sefariaData: getWordData('חכמה'),
      },
    },
    {
      title: 'Hebrew: צדקה (Tzedakah)',
      description: 'The word "Tzedakah" - righteousness, justice',
      props: {
        word: 'צדקה',
        sefariaData: getWordData('צדקה'),
      },
    },
    {
      title: 'Aramaic: אוריתא (Oraita)',
      description: 'Aramaic word for "Torah" from Talmudic texts',
      props: {
        word: 'אוריתא',
        sefariaData: getWordData('אוריתא'),
      },
    },
    {
      title: 'Hebrew/Aramaic: אמת (Cubit)',
      description: 'Unit of measurement - cubit, showing both Hebrew and Aramaic entries',
      props: {
        word: 'אמת',
        sefariaData: getWordData('אמת'),
      },
    },
    {
      title: 'With Event Handler',
      description: 'Handle click events on the dictionary block',
      props: {
        word: 'תורה',
        sefariaData: getWordData('תורה'),
        onEvent: (event: any) => {
          if (event.type === 'DictionaryBlock:click') {
            console.log('Clicked word:', event.data.word);
          }
        },
      },
    },
  ],
};

export default dictionaryBlockGallery;
