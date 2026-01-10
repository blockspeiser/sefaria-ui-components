import { useEffect, useState, useRef, type CSSProperties } from 'react';
import type { ComponentEventOf, EventHandler } from '../../lib/events';

/**
 * Individual sense/definition within a lexicon entry.
 */
export interface LexiconSense {
  definition?: string;
  number?: string;
  language_code?: string;
  plural_form?: string;
  senses?: LexiconSense[];
  [key: string]: unknown;
}

/**
 * Content structure for a lexicon entry.
 */
export interface LexiconContent {
  morphology?: string;
  senses?: LexiconSense[];
  [key: string]: unknown;
}

/**
 * A single lexicon entry from the Sefaria Word API.
 */
export interface LexiconEntry {
  headword?: string;
  parent_lexicon?: string;
  content?: LexiconContent;
  rid?: string;
  refs?: string[];
  derivatives?: string;
  prev_hw?: string;
  next_hw?: string;
  notes?: string;
  [key: string]: unknown;
}

/**
 * Response type from the Sefaria Word/Lexicon API.
 */
export type SefariaWordResponse = LexiconEntry[];

/**
 * Events emitted by DictionaryBlock.
 */
export type DictionaryBlockClickEvent = ComponentEventOf<'DictionaryBlock', 'click', { word: string }>;

export type DictionaryBlockEvent = DictionaryBlockClickEvent;

export interface DictionaryBlockProps {
  /** The word to look up in the Sefaria lexicon (required) */
  word: string;
  /** Data from Sefaria Word API. If <code>sefariaData</code> is provided, renders lexicon entries. */
  sefariaData?: SefariaWordResponse;
  /** If true, fetches data from the Sefaria API when <code>sefariaData</code> is not provided. */
  fetchData?: boolean;
  /** Event handler for component events */
  onEvent?: EventHandler<DictionaryBlockEvent>;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

const SEFARIA_WORD_API_BASE = 'https://www.sefaria.org/api/words/';
const wordCache = new Map<string, SefariaWordResponse>();

async function fetchSefariaWord(word: string): Promise<SefariaWordResponse> {
  const encodedWord = encodeURIComponent(word);
  const response = await fetch(`${SEFARIA_WORD_API_BASE}${encodedWord}`);
  if (!response.ok) {
    throw new Error(`Sefaria Word API error: ${response.status}`);
  }
  return (await response.json()) as SefariaWordResponse;
}

function renderSense(sense: LexiconSense, senseIdx: number, styles: Record<string, CSSProperties>): JSX.Element {
  return (
    <li key={`${sense.number || senseIdx}`} style={styles.sense}>
      {sense.plural_form && (
        <div
          style={styles.pluralForm}
          dangerouslySetInnerHTML={{ __html: sense.plural_form }}
        />
      )}
      {sense.number && <span style={styles.senseNumber}>{sense.number}.</span>}
      {sense.definition}
      {sense.language_code && (
        <span style={styles.languageCode}>({sense.language_code})</span>
      )}
      {sense.senses && sense.senses.length > 0 && (
        <ul style={{ ...styles.sensesList, marginTop: '4px', marginLeft: '16px' }}>
          {sense.senses.map((nestedSense, nestedIdx) =>
            renderSense(nestedSense, nestedIdx, styles)
          )}
        </ul>
      )}
    </li>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'relative',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e4e4e7',
    borderRadius: '8px',
    backgroundColor: '#f4f4f5',
    padding: '16px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  wordTitle: {
    fontSize: '2rem',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 700,
    color: '#27272a',
    textAlign: 'left',
    flexShrink: 0,
    lineHeight: 1.2,
  },
  loading: {
    marginTop: '8px',
    fontSize: '1rem',
    color: '#a1a1aa',
  },
  noResults: {
    marginTop: '8px',
    fontSize: '1rem',
    color: '#71717a',
  },
  tabsContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  tab: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#52525b',
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  tabActive: {
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  moreButton: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#52525b',
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  dropdownContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minWidth: '200px',
    maxWidth: '300px',
    zIndex: 1000,
    padding: '4px',
  },
  dropdownItem: {
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: '#27272a',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'inherit',
  },
  dropdownItemActive: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontWeight: 600,
  },
  caretIcon: {
    width: '12px',
    height: '12px',
    transition: 'transform 0.2s ease',
  },
  caretIconOpen: {
    transform: 'rotate(180deg)',
  },
  entryContent: {
    marginTop: '0',
  },
  morphology: {
    fontSize: '0.875rem',
    color: '#52525b',
    fontStyle: 'italic',
    marginBottom: '12px',
  },
  sensesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  sense: {
    fontSize: '1rem',
    color: '#27272a',
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  senseNumber: {
    fontWeight: 600,
    color: '#52525b',
    marginRight: '6px',
  },
  languageCode: {
    fontSize: '0.75rem',
    color: '#71717a',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginLeft: '6px',
  },
  pluralForm: {
    fontSize: '0.875rem',
    color: '#52525b',
    fontStyle: 'italic',
    marginBottom: '4px',
  },
  derivatives: {
    fontSize: '0.875rem',
    color: '#52525b',
    marginTop: '12px',
    lineHeight: 1.4,
  },
  notes: {
    fontSize: '0.875rem',
    color: '#52525b',
    marginTop: '12px',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
};

function DictionaryBlockInner({
  word,
  sefariaData,
  fetchData = false,
  onEvent,
  className,
  style,
}: DictionaryBlockProps) {
  const [activeData, setActiveData] = useState<SefariaWordResponse | undefined>(sefariaData);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntryIndex, setActiveEntryIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveData(sefariaData);
    setActiveEntryIndex(0);
  }, [sefariaData]);

  useEffect(() => {
    if (!fetchData || sefariaData || !word) return;
    const cached = wordCache.get(word);
    if (cached) {
      setActiveData(cached);
      setActiveEntryIndex(0);
      return;
    }
    let cancelled = false;

    setIsLoading(true);
    fetchSefariaWord(word)
      .then((data) => {
        if (cancelled) return;
        wordCache.set(word, data);
        setActiveData(data);
        setActiveEntryIndex(0);
      })
      .catch((error) => {
        if (!cancelled) console.error(error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchData, sefariaData, word]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleClick = () => {
    onEvent?.({ type: 'DictionaryBlock:click', data: { word } });
  };

  const handleTabClick = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveEntryIndex(index);
  };

  const handleDropdownItemClick = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveEntryIndex(index);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const mergedStyle: CSSProperties = {
    ...styles.container,
    ...style,
  };

  const shouldShowLoading = (!activeData || isLoading) && !fetchData;
  const hasEntries = activeData && activeData.length > 0;
  const activeEntry = hasEntries ? activeData[activeEntryIndex] : undefined;

  // Determine visible tabs: show selected source first if not in top 3
  const maxVisibleTabs = 3;
  let visibleIndices: number[] = [];
  let hiddenIndices: number[] = [];

  if (hasEntries) {
    const totalSources = activeData.length;

    if (totalSources <= maxVisibleTabs) {
      // Show all sources
      visibleIndices = Array.from({ length: totalSources }, (_, i) => i);
    } else {
      // Check if active index is in top 3
      const topThree = [0, 1, 2];
      if (topThree.includes(activeEntryIndex)) {
        // Active is in top 3, show top 3
        visibleIndices = topThree;
        hiddenIndices = Array.from({ length: totalSources }, (_, i) => i).slice(3);
      } else {
        // Active is not in top 3, show active + top 2
        visibleIndices = [activeEntryIndex, 0, 1];
        hiddenIndices = Array.from({ length: totalSources }, (_, i) => i)
          .filter(i => i !== activeEntryIndex && i !== 0 && i !== 1);
      }
    }
  }

  return (
    <div className={className} style={mergedStyle} onClick={handleClick}>
      {shouldShowLoading ? (
        <>
          <div style={styles.wordTitle}>{word}</div>
          <div style={styles.loading}>Loading...</div>
        </>
      ) : isLoading ? (
        <>
          <div style={styles.wordTitle}>{word}</div>
          <div style={styles.loading}>Loading...</div>
        </>
      ) : hasEntries ? (
        <>
          <div style={styles.headerRow}>
            <div style={styles.wordTitle}>{word}</div>
            {activeData.length > 1 && (
              <div style={styles.tabsContainer}>
                {visibleIndices.map((index) => (
                  <button
                    key={`${activeData[index].rid || index}`}
                    type="button"
                    style={{
                      ...styles.tab,
                      ...(activeEntryIndex === index ? styles.tabActive : {}),
                    }}
                    onClick={handleTabClick(index)}
                    onMouseEnter={(e) => {
                      if (activeEntryIndex !== index) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeEntryIndex !== index) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e4e4e7';
                      }
                    }}
                  >
                    {activeData[index].parent_lexicon || `Source ${index + 1}`}
                  </button>
                ))}

                {hiddenIndices.length > 0 && (
                  <div style={styles.dropdownContainer} ref={dropdownRef}>
                    <button
                      type="button"
                      style={styles.moreButton}
                      onClick={toggleDropdown}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e4e4e7';
                      }}
                    >
                      More
                      <svg
                        style={{
                          ...styles.caretIcon,
                          ...(isDropdownOpen ? styles.caretIconOpen : {}),
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div style={styles.dropdownMenu}>
                        {hiddenIndices.map((index) => (
                          <button
                            key={`${activeData[index].rid || index}`}
                            type="button"
                            style={{
                              ...styles.dropdownItem,
                              ...(activeEntryIndex === index ? styles.dropdownItemActive : {}),
                            }}
                            onClick={handleDropdownItemClick(index)}
                            onMouseEnter={(e) => {
                              if (activeEntryIndex !== index) {
                                e.currentTarget.style.backgroundColor = '#f4f4f5';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeEntryIndex !== index) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {activeData[index].parent_lexicon || `Source ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {activeEntry && (
            <div style={styles.entryContent}>
              {activeEntry.content?.morphology && (
                <div style={styles.morphology}>{activeEntry.content.morphology}</div>
              )}
              {activeEntry.content?.senses && activeEntry.content.senses.length > 0 && (
                <ul style={styles.sensesList}>
                  {activeEntry.content.senses.map((sense, senseIdx) =>
                    renderSense(sense, senseIdx, styles)
                  )}
                </ul>
              )}
              {activeEntry.derivatives && (
                <div
                  style={styles.derivatives}
                  dangerouslySetInnerHTML={{ __html: activeEntry.derivatives }}
                />
              )}
              {activeEntry.notes && (
                <div
                  style={styles.notes}
                  dangerouslySetInnerHTML={{ __html: activeEntry.notes }}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={styles.wordTitle}>{word}</div>
          <div style={styles.noResults}>No lexicon entries found.</div>
        </>
      )}
    </div>
  );
}

/**
 * DictionaryBlock displays lexicon entries from the Sefaria Word API with a light grey background.
 *
 * @example
 * // Loading state - fetchData false and no sefariaData
 * <DictionaryBlock word="תורה" />
 *
 * @example
 * // Auto-fetch data
 * <DictionaryBlock word="שלום" fetchData={true} />
 *
 * @example
 * // Full render with pre-fetched data
 * <DictionaryBlock word="תורה" sefariaData={apiResponse} />
 *
 * @example
 * // With event handling
 * <DictionaryBlock
 *   word="שלום"
 *   fetchData={true}
 *   onEvent={(event) => {
 *     if (event.type === 'DictionaryBlock:click') {
 *       console.log('Clicked:', event.data.word);
 *     }
 *   }}
 * />
 */
export const DictionaryBlock = DictionaryBlockInner;
