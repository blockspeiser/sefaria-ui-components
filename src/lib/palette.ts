export const colors = {
  darkteal: "#004e5f",
  raspberry: "#7c406f",
  green: "#5d956f",
  paleblue: "#9ab8cb",
  blue: "#4871bf",
  orange: "#cb6158",
  lightpink: "#c7a7b4",
  darkblue: "#073570",
  darkpink: "#ab4e66",
  lavender: "#7f85a9",
  yellow: "#ccb479",
  purple: "#594176",
  lightblue: "#5a99b7",
  lightgreen: "#97b386",
  red: "#802f3e",
  teal: "#00827f",
  lightbg: "#B8D4D3",
  tan: "#D4896C",
} as const;

export const categoryColors: Record<string, string> = {
  Commentary: "var(--commentary-blue)",
  Tanakh: "var(--tanakh-teal)",
  Midrash: "var(--midrash-green)",
  Mishnah: "var(--mishnah-blue)",
  Talmud: "var(--talmud-gold)",
  Halakhah: "var(--halakhah-red)",
  Kabbalah: "var(--kabbalah-purple)",
  "Jewish Thought": "var(--philosophy-purple)",
  Liturgy: "var(--liturgy-rose)",
  Tosefta: "var(--taanitic-green)",
  Chasidut: "var(--chasidut-green)",
  Musar: "var(--mussar-purple)",
  Responsa: "var(--responsa-red)",
  "Second Temple": "var(--apocrypha-pink)",
  "Quoting Commentary": "var(--responsa-red)",
  Sheets: "var(--sefaria-blue)",
  Sheet: "var(--sefaria-blue)",
  Targum: "var(--miscelaneous-green)",
  "Modern Commentary": "var(--modern-works-blue)",
  Reference: "var(--reference-orange)",
  System: "var(--sefaria-blue)",
  Static:
    "linear-gradient(90deg, #00505E 0% 10%, #5698B4 10% 20%, #CCB37C 20% 30%, #5B9370 30% 40%, #823241 40% 50%, #5A4474 50% 60%, #AD4F66 60% 70%, #7285A6 70% 80%, #00807E 80% 90%, #4872B3 90% 100%)",
};

// Resolved fallback colors for when CSS variables are not available
export const resolvedCategoryColors: Record<string, string> = {
  "resolved:Commentary": "#4871bf",
  "resolved:Tanakh": "#004e5f",
  "resolved:Midrash": "#5d956f",
  "resolved:Mishnah": "#5a99b7",
  "resolved:Talmud": "#ccb479",
  "resolved:Halakhah": "#802f3e",
  "resolved:Kabbalah": "#594176",
  "resolved:Jewish Thought": "#7f85a9",
  "resolved:Liturgy": "#c7a7b4",
  "resolved:Tosefta": "#97b386",
  "resolved:Chasidut": "#5d956f",
  "resolved:Musar": "#7f85a9",
  "resolved:Responsa": "#802f3e",
  "resolved:Second Temple": "#ab4e66",
  "resolved:Quoting Commentary": "#802f3e",
  "resolved:Sheets": "#4871bf",
  "resolved:Sheet": "#4871bf",
  "resolved:Targum": "#5d956f",
  "resolved:Modern Commentary": "#5a99b7",
  "resolved:Reference": "#cb6158",
  "resolved:System": "#4871bf",
};

export function categoryColor(cat: unknown): string {
  const catStr = typeof cat === "string" ? cat : "";

  // Check resolved colors first (for when CSS vars aren't available)
  if (catStr in resolvedCategoryColors) {
    return resolvedCategoryColors[catStr];
  }

  // Check category colors
  if (catStr in categoryColors) {
    return categoryColors[catStr];
  }

  // For unknown categories, map the string to a color (random, but stable)
  const colorValues = Object.values(colors);
  let idx = 0;
  for (const letter of catStr.split("")) {
    idx += letter.charCodeAt(0);
  }
  idx = idx % colorValues.length;

  return colorValues[idx];
}

const palette = {
  colors,
  categoryColors,
  categoryColor,
};

export default palette;
