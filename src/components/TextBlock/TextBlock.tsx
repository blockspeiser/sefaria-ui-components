import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { categoryColor } from '../../lib/palette';
import type { ComponentEventOf, EventHandler } from '../../lib/events';
import type { FollowupAction } from '../../lib/followup-prompts';
import { ColorLineBlock } from '../ColorLineBlock';

/**
 * Response type from the Sefaria Text API.
 */
export interface SefariaTextResponse {
  ref?: string;
  heRef?: string;
  text?: unknown;
  he?: unknown;
  versions?: Array<{
    text?: unknown;
    language?: string;
    versionTitle?: string;
    isPrimary?: boolean;
    [key: string]: unknown;
  }>;
  sections?: unknown;
  toSections?: unknown;
  primary_category?: unknown;
  type?: unknown;
  categories?: unknown;
  [key: string]: unknown;
}

/**
 * Events emitted by TextBlock.
 */
export type TextBlockClickEvent = ComponentEventOf<'TextBlock', 'click', { ref: string }>;
export type TextBlockLinkClickEvent = ComponentEventOf<'TextBlock', 'linkClick', { ref: string; href: string }>;
export type TextBlockFollowupEvent = ComponentEventOf<'TextBlock', 'followup', { ref: string; action: FollowupAction }>;

export type TextBlockEvent = TextBlockClickEvent | TextBlockLinkClickEvent | TextBlockFollowupEvent;

export interface TextBlockProps {
  /** Sefaria citation reference (e.g., "Genesis 1:1") */
  sefRef?: string;
  /** Data from Sefaria Text API. If <code>sefariaData</code> is provided, renders full text. */
  sefariaData?: SefariaTextResponse;
  /** If true, fetches data from the Sefaria API when <code>sefariaData</code> is not provided. */
  fetchData?: boolean;
  /** Initial display <code>language</code>: translation, bilingual, or Hebrew. */
  language?: string;
  /** Preferred translation <code>versionTitle</code> from the Sefaria API. */
  versionTitle?: string;
  /** Show the "Follow up" button with action menu */
  showFollowup?: boolean;
  /** Event handler for component events */
  onEvent?: EventHandler<TextBlockEvent>;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

function flattenSefariaText(text: unknown): string[] {
  if (typeof text === 'string') return [text];
  if (Array.isArray(text)) return text.flatMap((t) => flattenSefariaText(t));
  return [];
}

function isRangeCitation(source: SefariaTextResponse): boolean {
  const startRaw = source.sections;
  const endRaw = source.toSections;
  if (!Array.isArray(startRaw) || !Array.isArray(endRaw)) return false;

  const start = startRaw.filter((n): n is number => typeof n === 'number');
  const end = endRaw.filter((n): n is number => typeof n === 'number');
  if (start.length === 0 || end.length === 0) return false;
  if (start.length !== end.length) return true;
  return start.some((n, i) => n !== end[i]);
}

function sliceSefariaTextToRange(source: SefariaTextResponse): string[] {
  const startRaw = source.sections;
  const endRaw = source.toSections;
  const start = Array.isArray(startRaw)
    ? startRaw.filter((n): n is number => typeof n === 'number')
    : [];
  const end = Array.isArray(endRaw)
    ? endRaw.filter((n): n is number => typeof n === 'number')
    : start;

  const text = source.text;
  if (!Array.isArray(text) || start.length === 0) {
    return flattenSefariaText(text);
  }

  const isNested = Array.isArray(text[0]);

  if (start.length === 1) {
    if (!isNested) {
      const startSegment = start[0];
      const endSegment = end[0] ?? startSegment;

      // If start === end and text has multiple items, this is a chapter/daf-level citation
      // Return all segments, not just the indexed one
      if (startSegment === endSegment && text.length > 1) {
        return flattenSefariaText(text);
      }

      const startIdx = Math.max(0, startSegment - 1);
      const endExclusive = Math.max(startIdx, endSegment);
      return flattenSefariaText(text).slice(startIdx, endExclusive);
    }

    const startSection = start[0];
    const endSection = end[0] ?? startSection;
    const count = Math.max(1, endSection - startSection + 1);
    return (text as unknown[])
      .slice(0, count)
      .flatMap((section) => flattenSefariaText(section));
  }

  const startSection = start[0];
  const startSegment = start[start.length - 1];
  const endSection = end[0] ?? startSection;
  const endSegment = end[end.length - 1] ?? startSegment;

  const startIdx = Math.max(0, startSegment - 1);
  const endExclusive = Math.max(startIdx, endSegment);

  if (!isNested) {
    if (startSection !== endSection) return flattenSefariaText(text).slice(startIdx);
    return flattenSefariaText(text).slice(startIdx, endExclusive);
  }

  const sectionCount = Math.max(1, endSection - startSection + 1);
  const relevantSections = (text as unknown[]).slice(0, sectionCount);

  const out: string[] = [];
  relevantSections.forEach((section, idx) => {
    let segs = flattenSefariaText(section);
    if (idx === 0) segs = segs.slice(startIdx);
    if (idx === sectionCount - 1) segs = segs.slice(0, endExclusive);
    out.push(...segs);
  });

  return out;
}

function sliceSefariaTextWithLabels(source: SefariaTextResponse): Array<{ label: string; html: string }> {
  const startRaw = source.sections;
  const endRaw = source.toSections;
  const start = Array.isArray(startRaw)
    ? startRaw.filter((n): n is number => typeof n === 'number')
    : [];
  const end = Array.isArray(endRaw)
    ? endRaw.filter((n): n is number => typeof n === 'number')
    : start;

  if (start.length < 2) {
    const segments = sliceSefariaTextToRange(source);
    if (segments.length <= 1) {
      return segments.map((t) => ({ label: '', html: t }));
    }
    return segments.map((t, i) => ({ label: String(i + 1), html: t }));
  }

  const startSection = start[0];
  const startSegment = start[start.length - 1];
  const endSection = end[0] ?? startSection;
  const endSegment = end[end.length - 1] ?? startSegment;
  const spansSections = startSection !== endSection;

  const startIdx = Math.max(0, startSegment - 1);
  const endExclusive = Math.max(startIdx, endSegment);

  const text = source.text;
  if (!Array.isArray(text)) {
    return flattenSefariaText(text).map((t, i) => ({
      label: spansSections ? `${startSection}:${startSegment + i}` : String(startSegment + i),
      html: t,
    }));
  }

  const isNested = Array.isArray(text[0]);

  if (!isNested) {
    const segs = flattenSefariaText(text);
    const selected = spansSections ? segs.slice(startIdx) : segs.slice(startIdx, endExclusive);

    return selected.map((t, i) => ({
      label: spansSections ? `${startSection}:${startSegment + i}` : String(startSegment + i),
      html: t,
    }));
  }

  const sectionCount = Math.max(1, endSection - startSection + 1);
  const relevantSections = (text as unknown[]).slice(0, sectionCount);
  const out: Array<{ label: string; html: string }> = [];

  relevantSections.forEach((section, sectionIdx) => {
    const sectionNumber = startSection + sectionIdx;
    let segs = flattenSefariaText(section);
    if (sectionIdx === 0) segs = segs.slice(startIdx);
    if (sectionIdx === sectionCount - 1) segs = segs.slice(0, endExclusive);

    segs.forEach((t, i) => {
      const segmentNumber = sectionIdx === 0 ? startSegment + i : 1 + i;
      const label = spansSections ? `${sectionNumber}:${segmentNumber}` : String(segmentNumber);
      out.push({ label, html: t });
    });
  });

  return out;
}

type DisplayLanguage = 'translation' | 'bilingual' | 'hebrew';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  he: 'Hebrew',
  fr: 'French',
  es: 'Spanish',
  ru: 'Russian',
  de: 'German',
  it: 'Italian',
  ar: 'Arabic',
  yi: 'Yiddish',
};

const SEFARIA_API_BASE = 'https://www.sefaria.org/api/v3/texts/';
const sefariaCache = new Map<string, SefariaTextResponse>();

function formatLanguageLabel(code?: string): string {
  if (!code) return 'Translation';
  const normalized = code.toLowerCase();
  return LANGUAGE_LABELS[normalized] || normalized.toUpperCase();
}

function normalizeDisplayLanguage(language?: string): DisplayLanguage {
  if (!language) return 'translation';
  const normalized = language.toLowerCase();
  if (normalized === 'bilingual') return 'bilingual';
  if (normalized === 'he' || normalized === 'hebrew') return 'hebrew';
  return 'translation';
}

function normalizeSections(raw?: unknown): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const values = raw
    .map((entry) => (typeof entry === 'string' ? Number.parseInt(entry, 10) : entry))
    .filter((entry): entry is number => typeof entry === 'number' && !Number.isNaN(entry));
  return values.length > 0 ? values : undefined;
}

function getCacheKey(ref: string, versionTitle?: string): string {
  return versionTitle ? `${ref}::${versionTitle}` : ref;
}

function pickTranslationVersion(
  versions: SefariaTextResponse['versions'],
  preferredTitle?: string,
) {
  if (!versions || versions.length === 0) return undefined;
  const translations = versions.filter((version) => version.language !== 'he');
  if (preferredTitle) {
    const match = translations.find((version) => version.versionTitle === preferredTitle);
    if (match) return match;
  }
  return translations.find((version) => version.isPrimary) || translations[0];
}

function pickHebrewVersion(versions: SefariaTextResponse['versions']) {
  if (!versions || versions.length === 0) return undefined;
  return versions.find((version) => version.language === 'he') || versions[0];
}

function normalizeSefariaResponse(
  data: SefariaTextResponse | undefined,
  preferredTitle?: string,
): SefariaTextResponse | undefined {
  if (!data) return undefined;
  const versions = Array.isArray(data.versions) ? data.versions : undefined;
  const translationVersion = pickTranslationVersion(versions, preferredTitle);
  const hebrewVersion = pickHebrewVersion(versions);

  return {
    ...data,
    text: translationVersion?.text ?? data.text,
    he: hebrewVersion?.text ?? data.he,
    sections: normalizeSections(data.sections),
    toSections: normalizeSections(data.toSections),
    versions,
  };
}

async function fetchSefariaText(
  ref: string,
  versionTitle?: string,
): Promise<SefariaTextResponse> {
  const encodedRef = encodeURIComponent(ref);
  const params = new URLSearchParams();

  if (versionTitle) {
    params.append('version', versionTitle);
  } else {
    params.append('version', 'english');
  }

  params.append('version', 'hebrew');

  const response = await fetch(`${SEFARIA_API_BASE}${encodedRef}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Sefaria API error: ${response.status}`);
  }
  return (await response.json()) as SefariaTextResponse;
}

function getBorderColor(source: SefariaTextResponse | undefined, fallbackRef?: string): string {
  if (!source) {
    return categoryColor(`resolved:${fallbackRef || 'Source'}`);
  }

  const primaryCategory =
    typeof source.primary_category === 'string' ? source.primary_category : null;
  const typeCategory = typeof source.type === 'string' ? source.type : null;
  const cat =
    primaryCategory || typeCategory || (typeof source.ref === 'string' ? source.ref : 'Source');

  const candidate = categoryColor(cat);
  if (candidate.startsWith('var(') || candidate.startsWith('linear-gradient')) {
    return categoryColor(`resolved:${cat}`);
  }
  return candidate;
}

const styles: Record<string, CSSProperties> = {
  title: {
    fontSize: '1.125rem',
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#71717a',
    textDecoration: 'none',
  },
  titleLink: {
    fontSize: '1.25rem',
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#71717a',
    textDecoration: 'none',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: '#71717a',
    cursor: 'pointer',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    padding: '8px',
    minWidth: '220px',
    zIndex: 20,
  },
  menuSectionLabel: {
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  menuDivider: {
    height: '1px',
    backgroundColor: '#e4e4e7',
    margin: '6px 4px',
  },
  menuItem: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: '#27272a',
    fontFamily: 'inherit',
  },
  menuItemActive: {
    backgroundColor: '#f4f4f5',
    fontWeight: 600,
  },
  menuItemMuted: {
    color: '#a1a1aa',
    cursor: 'default',
  },
  hebrewText: {
    display: 'block',
    marginTop: '4px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '1.5rem',
    color: '#27272a',
  },
  loading: {
    marginTop: '8px',
    fontSize: '1rem',
    color: '#a1a1aa',
  },
  textBody: {
    marginTop: '8px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '1.25rem',
    lineHeight: 1.6,
    color: '#27272a',
  },
  segmentNumber: {
    color: '#a1a1aa',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '1rem',
  },
  followupContainer: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
  },
  followupButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    fontSize: '0.875rem',
    color: '#52525b',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  followupMenu: {
    position: 'absolute',
    bottom: '100%',
    right: '0',
    marginBottom: '4px',
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '4px',
    minWidth: '200px',
    zIndex: 10,
  },
  followupMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: '#27272a',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
};

const FOLLOWUP_MENU_ITEMS: Array<{ key: FollowupAction; label: string }> = [
  { key: 'explain', label: 'Explain' },
  { key: 'summarize', label: 'Summarize' },
  { key: 'translate', label: 'Translate' },
  { key: 'suggest_questions', label: 'Suggest Questions' },
  { key: 'commentary_top', label: 'Commentary: top' },
  { key: 'commentary_consensus', label: 'Commentary: consensus' },
  { key: 'commentary_disagreements', label: 'Commentary: disagreements' },
  { key: 'commentary_unusual', label: 'Commentary: unusual' },
  { key: 'connect_to_life', label: 'Connect to life' },
  { key: 'trace_usage', label: 'Trace usage' },
];

function TextBlockInner({
  sefRef,
  sefariaData,
  fetchData = false,
  language,
  versionTitle,
  showFollowup,
  onEvent,
  className,
  style,
}: TextBlockProps) {
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [activeData, setActiveData] = useState<SefariaTextResponse | undefined>(sefariaData);
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>(
    normalizeDisplayLanguage(language),
  );
  const [selectedVersionTitle, setSelectedVersionTitle] = useState<string | undefined>(versionTitle);

  useEffect(() => {
    setActiveData(sefariaData);
  }, [sefariaData]);

  useEffect(() => {
    setDisplayLanguage(normalizeDisplayLanguage(language));
  }, [language]);

  useEffect(() => {
    setSelectedVersionTitle(versionTitle);
  }, [versionTitle]);

  const normalizedData = useMemo(
    () => normalizeSefariaResponse(activeData, selectedVersionTitle),
    [activeData, selectedVersionTitle],
  );

  const translationVersions = useMemo(() => {
    const versions = normalizedData?.versions || [];
    const list = versions.filter((version) => version.language !== 'he' && version.versionTitle);
    const seen = new Set<string>();
    return list.filter((version) => {
      if (!version.versionTitle || seen.has(version.versionTitle)) return false;
      seen.add(version.versionTitle);
      return true;
    });
  }, [normalizedData?.versions]);

  const translationLanguageCode = useMemo(() => {
    const preferred = pickTranslationVersion(normalizedData?.versions, selectedVersionTitle);
    if (preferred?.language) return preferred.language;
    const normalized = language?.toLowerCase();
    if (normalized && normalized !== 'bilingual' && normalized !== 'he' && normalized !== 'hebrew') {
      return normalized;
    }
    return undefined;
  }, [language, normalizedData?.versions, selectedVersionTitle]);

  useEffect(() => {
    if (!fetchData || sefariaData || !sefRef) return;
    const cacheKey = getCacheKey(sefRef, selectedVersionTitle);
    const cached = sefariaCache.get(cacheKey);
    if (cached) {
      setActiveData(cached);
      return;
    }
    let cancelled = false;

    setIsTranslationLoading(true);
    fetchSefariaText(sefRef, selectedVersionTitle)
      .then((data) => {
        if (cancelled) return;
        sefariaCache.set(cacheKey, data);
        setActiveData(data);
      })
      .catch((error) => {
        if (!cancelled) console.error(error);
      })
      .finally(() => {
        if (!cancelled) setIsTranslationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchData, sefariaData, sefRef, selectedVersionTitle]);

  const title = normalizedData?.ref ?? sefRef ?? 'Source';
  const href = `https://www.sefaria.org/${encodeURIComponent(title)}`;
  const borderColor = getBorderColor(normalizedData, sefRef);
  const isLoading = !normalizedData || isTranslationLoading;

  const isRange = normalizedData ? isRangeCitation(normalizedData) : false;
  const segments = normalizedData
    ? isRange
      ? sliceSefariaTextWithLabels(normalizedData)
      : sliceSefariaTextToRange(normalizedData).map((s) => ({ label: '', html: s }))
    : [];

  const hebrewSegments = useMemo(() => {
    if (!normalizedData?.he) return [];
    const hebrewSource: SefariaTextResponse = { ...normalizedData, text: normalizedData.he };
    if (isRange) return sliceSefariaTextWithLabels(hebrewSource);
    return sliceSefariaTextToRange(hebrewSource).map((s) => ({ label: '', html: s }));
  }, [isRange, normalizedData]);

  const handleClick = () => {
    onEvent?.({ type: 'TextBlock:click', data: { ref: title } });
  };

  const handleLinkClick = () => {
    onEvent?.({ type: 'TextBlock:linkClick', data: { ref: title, href } });
    // Don't prevent default - let the link work naturally
  };

  const handleFollowupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowupOpen(!isFollowupOpen);
  };

  const handleFollowupAction = (action: FollowupAction) => {
    onEvent?.({ type: 'TextBlock:followup', data: { ref: title, action } });
    setIsFollowupOpen(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleLanguageSelect = (next: DisplayLanguage) => {
    setDisplayLanguage(next);
    setIsMenuOpen(false);
  };

  const handleTranslationSelect = async (nextTitle: string) => {
    if (!nextTitle || nextTitle === selectedVersionTitle) {
      setIsMenuOpen(false);
      return;
    }
    const ref = normalizedData?.ref ?? sefRef;
    if (!ref) {
      setIsMenuOpen(false);
      return;
    }
    const cacheKey = getCacheKey(ref, nextTitle);
    const cached = sefariaCache.get(cacheKey);
    if (cached) {
      setSelectedVersionTitle(nextTitle);
      setActiveData(cached);
      setIsMenuOpen(false);
      return;
    }
    setSelectedVersionTitle(nextTitle);
    setIsTranslationLoading(true);

    try {
      const nextData = await fetchSefariaText(ref, nextTitle);
      sefariaCache.set(cacheKey, nextData);
      setActiveData(nextData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslationLoading(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <ColorLineBlock className={className} style={style} borderColor={borderColor} onClick={handleClick}>
      <div style={styles.headerRow}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.titleLink}
          onClick={handleLinkClick}
        >
          {title}
        </a>
        <div style={styles.menuContainer}>
          <button
            type="button"
            style={styles.menuButton}
            onClick={handleMenuToggle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f4f4f5';
              e.currentTarget.style.borderColor = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {isMenuOpen && (
            <div style={styles.menu} onClick={(e) => e.stopPropagation()}>
              <div style={styles.menuSectionLabel}>Language</div>
              {([
                { key: 'translation', label: formatLanguageLabel(translationLanguageCode) },
                { key: 'bilingual', label: 'Bilingual' },
                { key: 'hebrew', label: 'Hebrew' },
              ] as Array<{ key: DisplayLanguage; label: string }>).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  style={{
                    ...styles.menuItem,
                    ...(displayLanguage === item.key ? styles.menuItemActive : null),
                  }}
                  onClick={() => handleLanguageSelect(item.key)}
                >
                  {item.label}
                </button>
              ))}
              <div style={styles.menuDivider} />
              <div style={styles.menuSectionLabel}>Translation</div>
              {translationVersions.length === 0 ? (
                <div style={{ ...styles.menuItem, ...styles.menuItemMuted }}>No translations</div>
              ) : (
                translationVersions.map((version) => (
                  <button
                    key={version.versionTitle}
                    type="button"
                    style={{
                      ...styles.menuItem,
                      ...(version.versionTitle === selectedVersionTitle ? styles.menuItemActive : null),
                    }}
                    onClick={() => handleTranslationSelect(version.versionTitle as string)}
                  >
                    {version.versionTitle}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={styles.loading}>Loading...</div>
      ) : segments.length > 0 ? (
        <div style={styles.textBody}>
          {displayLanguage === 'hebrew' ? (
            hebrewSegments.map((s, idx) => (
              <span key={`${s.label}-${idx}`}>
                {s.label && <span style={styles.segmentNumber}>({s.label}) </span>}
                <span dir="rtl" dangerouslySetInnerHTML={{ __html: s.html }} />
                {idx < hebrewSegments.length - 1 && ' '}
              </span>
            ))
          ) : displayLanguage === 'bilingual' ? (
            segments.map((s, idx) => (
              <span key={`${s.label}-${idx}`} style={{ display: 'block', marginBottom: '10px' }}>
                {s.label && <span style={styles.segmentNumber}>({s.label}) </span>}
                <span dangerouslySetInnerHTML={{ __html: s.html }} />
                {hebrewSegments[idx]?.html && (
                  <span
                    style={styles.hebrewText}
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: hebrewSegments[idx].html }}
                  />
                )}
              </span>
            ))
          ) : (
            segments.map((s, idx) => (
              <span key={`${s.label}-${idx}`}>
                {s.label && <span style={styles.segmentNumber}>({s.label}) </span>}
                <span dangerouslySetInnerHTML={{ __html: s.html }} />
                {idx < segments.length - 1 && ' '}
              </span>
            ))
          )}
        </div>
      ) : (
        <div style={styles.loading}>…</div>
      )}

      {showFollowup && (
        <div style={styles.followupContainer}>
          <button
            type="button"
            style={styles.followupButton}
            onClick={handleFollowupClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f4f4f5';
              e.currentTarget.style.borderColor = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="m8 12 4 4 4-4" />
            </svg>
            Follow up
          </button>
          {isFollowupOpen && (
            <div style={styles.followupMenu}>
              {FOLLOWUP_MENU_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  style={styles.followupMenuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowupAction(item.key);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f4f4f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </ColorLineBlock>
  );
}

/**
 * TextBlock displays a Sefaria text source with a colored border indicating its category.
 *
 * @example
 * // Loading state - only <code>ref</code> provided
 * <TextBlock ref="Genesis 1:1" />
 *
 * @example
 * // Full render with data
 * <TextBlock ref="Genesis 1:1" sefariaData={apiResponse} />
 *
 * @example
 * // With event handling
 * <TextBlock
 *   ref="Genesis 1:1"
 *   sefariaData={data}
 *   onEvent={(event) => {
 *     if (event.type === 'TextBlock:click') {
 *       console.log('Clicked:', event.data.ref);
 *     }
 *   }}
 * />
 */
export const TextBlock = TextBlockInner;
