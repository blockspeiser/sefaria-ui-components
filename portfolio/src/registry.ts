import type { PortfolioConfig } from '../../src/types/portfolio';

// Auto-discover all portfolio configs using Vite's glob import
const portfolioModules = import.meta.glob<{ default: PortfolioConfig }>(
  '../../src/components/**/*.portfolio.tsx',
  { eager: true }
);

// Extract and organize portfolio configs
export const componentRegistry: PortfolioConfig[] = Object.values(portfolioModules)
  .map((module) => module.default)
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

// Create a map for quick lookup by name
export const componentMap = new Map<string, PortfolioConfig>(
  componentRegistry.map((config) => [config.name.toLowerCase(), config])
);

export function getComponentByName(name: string): PortfolioConfig | undefined {
  return componentMap.get(name.toLowerCase());
}
