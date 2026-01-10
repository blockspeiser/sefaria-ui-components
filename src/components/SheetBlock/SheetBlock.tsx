import { forwardRef, type CSSProperties, useState, useEffect } from 'react';
import { refCategory } from '../../lib/ref-category';

export interface SheetSource {
  ref?: string;
  [key: string]: unknown;
}

export interface SheetData {
  id: number;
  title: string;
  owner: number;
  sources: SheetSource[];
  tags?: string[];
  views?: number;
  dateCreated?: string;
  dateModified?: string;
}

export interface SheetBlockProps {
  id: number;
  className?: string;
  style?: CSSProperties;
}

const baseStyle: CSSProperties = {
  position: 'relative',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#e4e4e7',
  backgroundColor: '#ffffff',
  padding: '16px',
  borderRadius: '4px',
};

const ownerCircleStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: '#5a99d4',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '14px',
};

const titleStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '12px 0',
  color: '#000000',
};

const linkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
};

const summaryStyle: CSSProperties = {
  fontSize: '14px',
  color: '#666666',
  marginTop: '8px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

export const SheetBlock = forwardRef<HTMLDivElement, SheetBlockProps>(
  ({ id, className, style }, ref) => {
    const [sheetData, setSheetData] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchSheetData = async () => {
        try {
          setLoading(true);
          const response = await fetch(`https://www.sefaria.org/api/sheets/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.statusText}`);
          }
          const data = await response.json();
          setSheetData(data);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load sheet');
        } finally {
          setLoading(false);
        }
      };

      fetchSheetData();
    }, [id]);

    const mergedStyle: CSSProperties = {
      ...baseStyle,
      ...style,
    };

    if (loading) {
      return (
        <div ref={ref} className={className} style={mergedStyle}>
          Loading...
        </div>
      );
    }

    if (error || !sheetData) {
      return (
        <div ref={ref} className={className} style={mergedStyle}>
          Error: {error || 'Failed to load sheet'}
        </div>
      );
    }

    const sourceCount = sheetData.sources?.length || 0;

    // Extract unique categories from sources
    const sourceCategories = new Set<string>();
    if (sheetData.sources) {
      for (const source of sheetData.sources) {
        if (source.ref) {
          const categoryInfo = refCategory(source.ref);
          if (categoryInfo) {
            sourceCategories.add(categoryInfo.topCategory);
          }
        }
      }
    }

    const categories = sourceCategories.size > 0
      ? Array.from(sourceCategories).join(', ')
      : 'Unknown';

    return (
      <div ref={ref} className={className} style={mergedStyle}>
        <div style={headerStyle}>
          <div style={ownerCircleStyle}>{sheetData.owner}</div>
          <div style={{ flex: 1 }}>
            <div style={titleStyle}>
              <a
                href={`https://www.sefaria.org/sheets/${sheetData.id}`}
                style={linkStyle}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sheetData.title}
              </a>
            </div>
          </div>
        </div>
        <div style={summaryStyle}>
          <div>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</div>
          <div>Categories: {categories}</div>
        </div>
      </div>
    );
  }
);

SheetBlock.displayName = 'SheetBlock';
