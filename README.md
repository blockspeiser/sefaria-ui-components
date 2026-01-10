# Sefaria UI Components

A collection of reusable React components for building Torah study applications, powered by the Sefaria API.

## Installation

```bash
npm install sefaria-ui-components
```

or with yarn:

```bash
yarn add sefaria-ui-components
```

## Quick Start

```tsx
import { TextBlock } from 'sefaria-ui-components';

function App() {
  return (
    <TextBlock
      ref="Genesis 1:1"
      sefariaData={apiResponse}
    />
  );
}
```

## Components

### TextBlock

Displays a Sefaria text source with a colored border indicating its category. Supports loading states, single verses, verse ranges, and chapters.

### DictionaryBlock

Displays lexicon entries from the Sefaria Word API with a light grey background. Shows dictionary definitions, morphology, and related word information for Hebrew and Aramaic words.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `ref` | `string` | Sefaria citation reference (e.g., "Genesis 1:1", "Berakhot 2a") |
| `sefariaData` | `SefariaTextResponse` | Data from Sefaria Text API. If provided, renders full text. |
| `showFollowup` | `boolean` | Show the "Follow up" button with action menu |
| `onEvent` | `EventHandler<TextBlockEvent>` | Event handler for component events |
| `className` | `string` | Additional CSS class name |
| `style` | `CSSProperties` | Additional inline styles |

#### Basic Usage

```tsx
import { TextBlock } from 'sefaria-ui-components';

// Loading state - shows "Loading..." until data arrives
<TextBlock ref="Genesis 1:1" />

// With data - renders the full text
<TextBlock
  ref="Genesis 1:1"
  sefariaData={fetchedData}
/>

// With followup button
<TextBlock
  ref="Genesis 1:1"
  sefariaData={fetchedData}
  showFollowup
/>
```

#### Fetching Data from Sefaria API

```tsx
import { TextBlock, type SefariaTextResponse } from 'sefaria-ui-components';
import { useState, useEffect } from 'react';

function SefariaText({ citation }: { citation: string }) {
  const [data, setData] = useState<SefariaTextResponse | null>(null);

  useEffect(() => {
    const encoded = encodeURIComponent(citation);
    fetch(`https://www.sefaria.org/api/v3/texts/${encoded}`)
      .then(res => res.json())
      .then(json => {
        // Transform API v3 response
        const englishVersion = json.versions?.find(
          (v: { language: string }) => v.language === 'en'
        );
        setData({
          ref: json.ref,
          heRef: json.heRef,
          text: englishVersion?.text ?? json.text,
          he: json.he,
          sections: json.sections,
          toSections: json.toSections,
          primary_category: json.primary_category,
          type: json.type,
          categories: json.categories,
        });
      });
  }, [citation]);

  return <TextBlock ref={citation} sefariaData={data ?? undefined} />;
}
```

#### Handling Events

TextBlock emits events for user interactions:

```tsx
import { TextBlock, type TextBlockEvent } from 'sefaria-ui-components';

function App() {
  const handleEvent = (event: TextBlockEvent) => {
    switch (event.type) {
      case 'TextBlock:click':
        console.log('Clicked:', event.data.ref);
        break;
      case 'TextBlock:linkClick':
        console.log('Link clicked:', event.data.ref, event.data.href);
        break;
      case 'TextBlock:followup':
        console.log('Followup action:', event.data.action, event.data.ref);
        // Handle followup actions like 'explain', 'summarize', 'translate', etc.
        break;
    }
  };

  return (
    <TextBlock
      ref="Genesis 1:1"
      sefariaData={data}
      showFollowup
      onEvent={handleEvent}
    />
  );
}
```

#### Event Types

| Event | Data | Description |
|-------|------|-------------|
| `TextBlock:click` | `{ ref: string }` | Fired when the text block is clicked |
| `TextBlock:linkClick` | `{ ref: string, href: string }` | Fired when the citation link is clicked |
| `TextBlock:followup` | `{ ref: string, action: FollowupAction }` | Fired when a followup action is selected |

#### Followup Actions

When `showFollowup` is enabled, users can select from these actions:

- `explain` - Explain the plain meaning
- `summarize` - Summarize in bullet points
- `translate` - Translate to English
- `suggest_questions` - Suggest follow-up questions
- `commentary_top` - Show most-cited commentary
- `commentary_consensus` - Show points of agreement among commentaries
- `commentary_disagreements` - Show points of disagreement
- `commentary_unusual` - Show lesser-known commentary
- `connect_to_life` - Connect to modern life
- `trace_usage` - Trace how the text is understood in later sources

### DictionaryBlock

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `word` | `string` | The word to look up in the Sefaria lexicon (required) |
| `sefariaData` | `SefariaWordResponse` | Data from Sefaria Word API. If provided, renders lexicon entries. |
| `fetchData` | `boolean` | If true, fetches data from the Sefaria API when `sefariaData` is not provided. |
| `onEvent` | `EventHandler<DictionaryBlockEvent>` | Event handler for component events |
| `className` | `string` | Additional CSS class name |
| `style` | `CSSProperties` | Additional inline styles |

#### Basic Usage

```tsx
import { DictionaryBlock } from 'sefaria-ui-components';

// Loading state - fetchData is false and no data provided
<DictionaryBlock word="תורה" />

// Auto-fetch data
<DictionaryBlock word="שלום" fetchData={true} />

// With pre-fetched data
<DictionaryBlock
  word="תורה"
  sefariaData={fetchedData}
/>
```

#### Fetching Data from Sefaria API

```tsx
import { DictionaryBlock, type SefariaWordResponse } from 'sefaria-ui-components';
import { useState, useEffect } from 'react';

function SefariaWord({ word }: { word: string }) {
  const [data, setData] = useState<SefariaWordResponse | null>(null);

  useEffect(() => {
    const encoded = encodeURIComponent(word);
    fetch(`https://www.sefaria.org/api/words/${encoded}`)
      .then(res => res.json())
      .then(json => setData(json));
  }, [word]);

  return <DictionaryBlock word={word} sefariaData={data ?? undefined} />;
}
```

#### Handling Events

DictionaryBlock emits events for user interactions:

```tsx
import { DictionaryBlock, type DictionaryBlockEvent } from 'sefaria-ui-components';

function App() {
  const handleEvent = (event: DictionaryBlockEvent) => {
    if (event.type === 'DictionaryBlock:click') {
      console.log('Clicked word:', event.data.word);
    }
  };

  return (
    <DictionaryBlock
      word="תורה"
      sefariaData={data}
      onEvent={handleEvent}
    />
  );
}
```

#### Event Types

| Event | Data | Description |
|-------|------|-------------|
| `DictionaryBlock:click` | `{ word: string }` | Fired when the dictionary block is clicked |

## Types

### SefariaTextResponse

Response from the Sefaria Text API (`https://www.sefaria.org/api/v3/texts/{ref}`).

```typescript
interface SefariaTextResponse {
  ref?: string;
  heRef?: string;
  text?: unknown;
  he?: unknown;
  versions?: Array<{
    text?: unknown;
    language?: string;
    versionTitle?: string;
    isPrimary?: boolean;
  }>;
  sections?: unknown;
  toSections?: unknown;
  primary_category?: unknown;
  type?: unknown;
  categories?: unknown;
  [key: string]: unknown;
}
```

### FollowupAction

```typescript
type FollowupAction =
  | 'explain'
  | 'summarize'
  | 'translate'
  | 'suggest_questions'
  | 'commentary_top'
  | 'commentary_consensus'
  | 'commentary_disagreements'
  | 'commentary_unusual'
  | 'connect_to_life'
  | 'trace_usage';
```

### SefariaWordResponse

Response from the Sefaria Word API (`https://www.sefaria.org/api/words/{word}`).

```typescript
type SefariaWordResponse = LexiconEntry[];

interface LexiconEntry {
  headword?: string;
  parent_lexicon?: string;
  content?: LexiconContent;
  rid?: string;
  refs?: string[];
  derivatives?: string;
  notes?: string;
  [key: string]: unknown;
}

interface LexiconContent {
  morphology?: string;
  senses?: LexiconSense[];
  [key: string]: unknown;
}

interface LexiconSense {
  definition?: string;
  number?: string;
  language_code?: string;
  plural_form?: string;
  senses?: LexiconSense[]; // Nested senses for hierarchical definitions
  [key: string]: unknown;
}
```

## Utilities

### Followup Prompts

Build followup prompts for AI assistants:

```tsx
import {
  buildFollowupUserMessage,
  renderFollowupTemplate,
  FOLLOWUP_TEMPLATES,
  type FollowupAction,
} from 'sefaria-ui-components';

// Get the template for an action
const template = FOLLOWUP_TEMPLATES['explain'];
// "Explain in clear language what the plain meaning of {citation} is."

// Render with a specific citation
const prompt = renderFollowupTemplate('explain', 'Genesis 1:1');
// "Explain in clear language what the plain meaning of Genesis 1:1 is."

// Build a full user message (for chat interfaces)
const message = buildFollowupUserMessage({
  action: 'explain',
  citation: 'Genesis 1:1',
  includeRePrefix: false,
});
```

## Styling

TextBlock uses inline styles with sensible defaults. The left border color is automatically determined by the text's category (Tanakh, Talmud, Midrash, etc.).

To customize styles, use the `className` and `style` props:

```tsx
<TextBlock
  ref="Genesis 1:1"
  sefariaData={data}
  className="my-custom-class"
  style={{ maxWidth: '600px' }}
/>
```

## License

MIT
