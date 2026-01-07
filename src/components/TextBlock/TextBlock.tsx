import { useState, type CSSProperties } from 'react';
import { categoryColor } from '../../lib/palette';
import type { ComponentEventOf, EventHandler } from '../../lib/events';
import type { FollowupAction } from '../../lib/followup-prompts';

/**
 * Response type from the Sefaria Text API.
 */
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
  /** Data from Sefaria Text API. If provided, renders full text. */
  sefariaData?: SefariaTextResponse;
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
    return sliceSefariaTextToRange(source).map((t) => ({ label: '', html: t }));
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
  container: {
    position: 'relative',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e4e4e7',
    borderLeftWidth: '5px',
    backgroundColor: '#ffffff',
    padding: '16px',
    paddingBottom: '16px',
  },
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
  showFollowup,
  onEvent,
  className,
  style,
}: TextBlockProps) {
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);

  const title = sefariaData?.ref ?? sefRef ?? 'Source';
  const href = `https://www.sefaria.org/${encodeURIComponent(title)}`;
  const borderColor = getBorderColor(sefariaData, sefRef);
  const isLoading = !sefariaData;

  const isRange = sefariaData ? isRangeCitation(sefariaData) : false;
  const segments = sefariaData
    ? isRange
      ? sliceSefariaTextWithLabels(sefariaData)
      : sliceSefariaTextToRange(sefariaData).map((s) => ({ label: '', html: s }))
    : [];

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

  return (
    <div
      className={className}
      style={{
        ...styles.container,
        borderLeftColor: borderColor,
        ...style,
      }}
      onClick={handleClick}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.titleLink}
        onClick={handleLinkClick}
      >
        {title}
      </a>

      {isLoading ? (
        <div style={styles.loading}>Loading...</div>
      ) : segments.length > 0 ? (
        <div style={styles.textBody}>
          {segments.map((s, idx) => (
            <span key={`${s.label}-${idx}`}>
              {s.label && <span style={styles.segmentNumber}>({s.label}) </span>}
              <span dangerouslySetInnerHTML={{ __html: s.html }} />
              {idx < segments.length - 1 && ' '}
            </span>
          ))}
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
    </div>
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
