import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { categoryColor } from '../../lib/palette';
import { ColorLineBlock } from '../ColorLineBlock';

interface SefariaTextResponse {
  ref?: string;
  text?: unknown;
  sections?: unknown;
  toSections?: unknown;
  [key: string]: unknown;
}

interface CalendarTitle {
  en?: string;
  he?: string;
}

interface CalendarItem {
  title?: CalendarTitle;
  displayValue?: CalendarTitle;
  description?: CalendarTitle;
  category?: string;
  url?: string;
  ref?: string;
  heRef?: string;
  extraDetails?: {
    aliyot?: string[];
  };
  [key: string]: unknown;
}

interface CalendarResponse {
  calendar_items?: CalendarItem[];
  [key: string]: unknown;
}

export interface CalendarBlockProps {
  /** Calendar title in English, as returned by the API. */
  calendar: string;
  /** Show a text preview when no description is available. */
  showText?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

const CALENDAR_API_URL = 'https://www.sefaria.org/api/calendars';
const SEFARIA_TEXT_API_BASE = 'https://www.sefaria.org/api/v3/texts/';
const calendarItemCache = new Map<string, CalendarItem | null>();
const textCache = new Map<string, SefariaTextResponse>();
let calendarItemsCache: CalendarItem[] | null = null;
let calendarFetchPromise: Promise<CalendarItem[] | null> | null = null;

function flattenSefariaText(text: unknown): string[] {
  if (typeof text === 'string') return [text];
  if (Array.isArray(text)) return text.flatMap((t) => flattenSefariaText(t));
  return [];
}

function sliceSefariaTextWithLabels(source: SefariaTextResponse): Array<{ label: string; html: string }> {
  const startRaw = source.sections;
  const start = Array.isArray(startRaw)
    ? startRaw.filter((n): n is number => typeof n === 'number')
    : [];

  const text = source.text;
  const segments = flattenSefariaText(text);

  if (segments.length === 0) return [];
  if (segments.length === 1) {
    return [{ label: '', html: segments[0] }];
  }

  const startSegment = start.length > 0 ? start[start.length - 1] : 1;

  return segments.map((html, i) => ({
    label: String(startSegment + i),
    html,
  }));
}

async function fetchSefariaText(ref: string): Promise<SefariaTextResponse | null> {
  const cached = textCache.get(ref);
  if (cached) return cached;

  const encodedRef = encodeURIComponent(ref);
  const url = `${SEFARIA_TEXT_API_BASE}${encodedRef}?version=english`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const rawData = (await response.json()) as {
      versions?: Array<{ text?: unknown; language?: string }>;
      sections?: unknown;
      toSections?: unknown;
      ref?: string;
    };

    // Extract text from the primary English version
    const englishVersion = rawData.versions?.find((v) => v.language === 'en');
    const data: SefariaTextResponse = {
      ref: rawData.ref,
      text: englishVersion?.text,
      sections: rawData.sections,
      toSections: rawData.toSections,
    };

    textCache.set(ref, data);
    return data;
  } catch {
    return null;
  }
}

async function fetchCalendarItems(): Promise<CalendarItem[] | null> {
  if (calendarItemsCache) return calendarItemsCache;
  if (calendarFetchPromise) return calendarFetchPromise;

  calendarFetchPromise = fetch(CALENDAR_API_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Sefaria calendar API error: ${response.status}`);
      }
      const data = (await response.json()) as CalendarResponse;
      const items = Array.isArray(data.calendar_items) ? data.calendar_items : [];
      calendarItemsCache = items;
      return items;
    })
    .catch((error) => {
      console.error(error);
      return null;
    })
    .finally(() => {
      calendarFetchPromise = null;
    });

  return calendarFetchPromise;
}

function getBorderColor(category?: string): string {
  if (!category) return '#e4e4e7';
  const candidate = categoryColor(category);
  if (candidate.startsWith('var(') || candidate.startsWith('linear-gradient')) {
    return categoryColor(`resolved:${category}`);
  }
  return candidate;
}

const styles: Record<string, CSSProperties> = {
  label: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#a1a1aa',
    fontWeight: 600,
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 600,
    color: '#27272a',
    marginTop: '6px',
  },
  titleLink: {
    display: 'block',
    color: '#27272a',
    textDecoration: 'none',
  },
  refLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '1px',
    marginBottom: '6px',
    color: '#2563eb',
    fontSize: '0.95rem',
    textDecoration: 'none',
  },
  description: {
    marginTop: '6px',
    fontSize: '1.125rem',
    color: '#52525b',
    lineHeight: 1.5,
  },
  aliyotContainer: {
    marginTop: '18px',
  },
  aliyotTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  aliyotList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  aliyahLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    border: '1px solid #e4e4e7',
    color: '#27272a',
    textDecoration: 'none',
    fontSize: '0.85rem',
  },
  loading: {
    color: '#a1a1aa',
    fontSize: '0.9rem',
    marginTop: '8px',
  },
  textPreview: {
    marginTop: '6px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '1.1rem',
    lineHeight: 1.5,
    color: '#27272a',
    overflow: 'hidden',
  },
  segmentNumber: {
    color: '#a1a1aa',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '0.9rem',
  },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function truncateTextToLines(
  segments: Array<{ label: string; html: string }>,
  containerWidth: number,
  maxLines: number,
  fontSize: number
): { segments: Array<{ label: string; text: string }>; truncated: boolean } {
  if (containerWidth <= 0 || segments.length === 0) {
    return { segments: [], truncated: false };
  }

  // Approximate characters per line based on font size
  // Serif fonts at 1.1rem (~17.6px) average about 8px per character
  const avgCharWidth = fontSize * 0.5;
  const charsPerLine = Math.floor(containerWidth / avgCharWidth);
  const maxChars = charsPerLine * maxLines;

  const result: Array<{ label: string; text: string }> = [];
  let totalChars = 0;
  let truncated = false;

  for (const segment of segments) {
    const plainText = stripHtml(segment.html);
    const labelOverhead = segment.label ? segment.label.length + 3 : 0; // "(X) "
    const segmentChars = plainText.length + labelOverhead + 1; // +1 for space between segments

    if (totalChars + segmentChars > maxChars) {
      // Truncate this segment
      const remaining = maxChars - totalChars - labelOverhead;
      if (remaining > 10) {
        const truncatedText = plainText.slice(0, remaining - 3) + '...';
        result.push({ label: segment.label, text: truncatedText });
      }
      truncated = true;
      break;
    }

    result.push({ label: segment.label, text: plainText });
    totalChars += segmentChars;
  }

  return { segments: result, truncated };
}

export function CalendarBlock({ calendar, showText = false, className, style }: CalendarBlockProps) {
  const [calendarItem, setCalendarItem] = useState<CalendarItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [haftarahItem, setHaftarahItem] = useState<CalendarItem | null>(null);
  const [textData, setTextData] = useState<SefariaTextResponse | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      // Subtract padding (16px on each side)
      setContainerWidth(container.offsetWidth - 32);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!calendar) {
      setCalendarItem(null);
      setIsLoading(false);
      return;
    }

    const cached = calendarItemCache.get(calendar);
    if (cached !== undefined) {
      setCalendarItem(cached);
      if (calendar === 'Parashat Hashavua') {
        const cachedHaftarah = calendarItemCache.get('Haftarah');
        if (cachedHaftarah !== undefined) {
          setHaftarahItem(cachedHaftarah);
        } else {
          fetchCalendarItems().then((items) => {
            const match = items?.find((item) => item.title?.en === 'Haftarah') ?? null;
            calendarItemCache.set('Haftarah', match);
            setHaftarahItem(match);
          });
        }
      } else {
        setHaftarahItem(null);
      }
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchCalendarItems().then((items) => {
      if (cancelled) return;
      const match = items?.find((item) => item.title?.en === calendar) ?? null;
      const haftarahMatch =
        calendar === 'Parashat Hashavua'
          ? items?.find((item) => item.title?.en === 'Haftarah') ?? null
          : null;
      calendarItemCache.set(calendar, match);
      setCalendarItem(match);
      setHaftarahItem(haftarahMatch);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [calendar]);

  // Fetch text when showText is true, no description, and we have a ref
  useEffect(() => {
    const description = calendarItem?.description?.en;
    const ref = calendarItem?.ref;

    if (!showText || description || !ref) {
      setTextData(null);
      return;
    }

    let cancelled = false;

    fetchSefariaText(ref).then((data) => {
      if (!cancelled) {
        setTextData(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [calendarItem, showText]);

  const title = calendarItem?.title?.en ?? calendar;
  const displayValue = calendarItem?.displayValue?.en;
  const description = calendarItem?.description?.en;
  const category = calendarItem?.category;
  const url = calendarItem?.url ? `https://www.sefaria.org/${calendarItem.url}` : null;
  const refText = calendarItem?.ref ?? calendarItem?.displayValue?.en;
  const isTitleRef = Boolean(refText && displayValue === refText);
  const aliyot = calendarItem?.extraDetails?.aliyot ?? [];
  const showAliyot = title === 'Parashat Hashavua' && aliyot.length > 0;
  const showHaftarah = title === 'Parashat Hashavua' && haftarahItem;
  const haftarahRef = haftarahItem?.ref ?? haftarahItem?.displayValue?.en;
  const haftarahUrl = haftarahItem?.url
    ? `https://www.sefaria.org/${haftarahItem.url}`
    : null;
  const borderColor = getBorderColor(category);

  // Compute text preview when no description
  const textPreview = !description && textData
    ? truncateTextToLines(
        sliceSefariaTextWithLabels(textData),
        containerWidth,
        3,
        17.6 // 1.1rem
      )
    : null;

  return (
    <ColorLineBlock ref={containerRef} className={className} style={style} borderColor={borderColor}>
      <div style={styles.label}>{title}</div>
      {isLoading ? (
        <div style={styles.loading}>Loading...</div>
      ) : calendarItem ? (
        <>
          {displayValue &&
            (url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.title, ...styles.titleLink }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {displayValue}
              </a>
            ) : (
              <div style={styles.title}>{displayValue}</div>
            ))}
          {url && refText && !isTitleRef && (
            <a href={url} target="_blank" rel="noopener noreferrer" style={styles.refLink}>
              {refText}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          )}
          {description ? (
            <div style={styles.description}>{description}</div>
          ) : textPreview && textPreview.segments.length > 0 ? (
            <div style={styles.textPreview}>
              {textPreview.segments.map((seg, idx) => (
                <span key={idx}>
                  {seg.label && <span style={styles.segmentNumber}>({seg.label}) </span>}
                  {seg.text}
                  {idx < textPreview.segments.length - 1 && ' '}
                </span>
              ))}
            </div>
          ) : null}
          {showAliyot && (
            <div style={styles.aliyotContainer}>
              <div style={styles.aliyotTitle}>Aliyot</div>
              <div style={styles.aliyotList}>
                {aliyot.map((ref, index) => (
                  <a
                    key={`${ref}-${index}`}
                    href={`https://www.sefaria.org/${encodeURIComponent(ref)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.aliyahLink}
                  >
                    {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
          {showHaftarah && haftarahUrl && haftarahRef && (
            <div style={styles.aliyotContainer}>
              <div style={styles.aliyotTitle}>Haftara</div>
              <a href={haftarahUrl} target="_blank" rel="noopener noreferrer" style={{ ...styles.refLink, marginTop: 0 }}>
                {haftarahRef}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </a>
            </div>
          )}
        </>
      ) : (
        <div style={styles.loading}>Calendar not found.</div>
      )}
    </ColorLineBlock>
  );
}
