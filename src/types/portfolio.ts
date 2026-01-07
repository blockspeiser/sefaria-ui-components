import type { ComponentType, ReactNode } from 'react';

export interface PortfolioExample<P = Record<string, unknown>> {
  title: string;
  description?: string;
  props: P;
  wrapper?: ComponentType<{ children: ReactNode }>;
}

export interface PortfolioConfig<P = Record<string, unknown>> {
  name: string;
  description: string;
  /** Short noun phrase for overview cards (e.g., "Sefaria text display") */
  shortDescription?: string;
  component: ComponentType<P>;
  examples: PortfolioExample<P>[];
  sourceCode: string;
  /** Props for a simple example shown on the overview page */
  overviewExample?: P;
}
