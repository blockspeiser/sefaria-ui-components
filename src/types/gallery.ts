import type { ComponentType, ReactNode } from 'react';

export interface GalleryExample<P = Record<string, unknown>> {
  title: string;
  description?: string;
  props: P;
  wrapper?: ComponentType<{ children: ReactNode }>;
}

export interface GalleryConfig<P = Record<string, unknown>> {
  name: string;
  description: string;
  /** Short noun phrase for overview cards (e.g., "Sefaria text display") */
  shortDescription?: string;
  component: ComponentType<P>;
  examples: GalleryExample<P>[];
  sourceCode: string;
  /** Ordered list of props to display on docs pages. */
  propsList?: string[];
  /** Props for a simple example shown on the overview page */
  overviewExample?: P;
}
