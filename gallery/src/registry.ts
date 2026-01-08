import type { GalleryConfig } from '../../src/types/gallery';

// Auto-discover all gallery configs using Vite's glob import
const galleryModules = import.meta.glob<{ default: GalleryConfig }>(
  '../../src/components/**/*.gallery.tsx',
  { eager: true }
);

const componentOrder = ['TextBlock', 'CalendarBlock'];

// Extract and organize gallery configs
export const componentRegistry: GalleryConfig[] = Object.values(galleryModules)
  .map((module) => module.default)
  .filter(Boolean)
  .sort((a, b) => {
    const orderA = componentOrder.indexOf(a.name);
    const orderB = componentOrder.indexOf(b.name);
    if (orderA !== -1 || orderB !== -1) {
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });

// Create a map for quick lookup by name
export const componentMap = new Map<string, GalleryConfig>(
  componentRegistry.map((config) => [config.name.toLowerCase(), config])
);

export function getComponentByName(name: string): GalleryConfig | undefined {
  return componentMap.get(name.toLowerCase());
}
