import { useState, useEffect, type ComponentType } from 'react';
import type { PortfolioExample } from '../../../src/types/portfolio';
import { CodeBlock } from './CodeBlock';
import {
  FOLLOWUP_TEMPLATES,
  type FollowupAction,
} from '../../../src/lib/followup-prompts';

interface ExampleRendererProps {
  example: PortfolioExample;
  component: ComponentType<Record<string, unknown>>;
  componentName: string;
}

type TabType = 'props' | 'code';

interface Toast {
  id: string;
  eventType: string;
  data: string;
}

function isSefariaData(value: unknown): value is { ref?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ref' in value &&
    typeof (value as { ref?: string }).ref === 'string'
  );
}

function formatPropValue(value: unknown, key?: string): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  // Show placeholder for sefariaData objects
  if (key === 'sefariaData' && isSefariaData(value)) {
    return `{/* Sefaria API data for "${value.ref}" */}`;
  }
  return JSON.stringify(value, null, 2);
}

function generateUsageCode(
  componentName: string,
  props: Record<string, unknown>
): string {
  const entries = Object.entries(props).filter(([, value]) => value !== false && value !== undefined);

  if (entries.length === 0) {
    return `<${componentName} />`;
  }

  const hasChildren = 'children' in props;
  const propsWithoutChildren = entries.filter(([key]) => key !== 'children');

  const propsString = propsWithoutChildren
    .map(([key, value]) => {
      // Display "ref" instead of "sefRef" for better DX
      const displayKey = key === 'sefRef' ? 'ref' : key;
      if (typeof value === 'string') {
        return `${displayKey}="${value}"`;
      }
      if (typeof value === 'boolean' && value === true) {
        return displayKey;
      }
      return `${displayKey}={${formatPropValue(value, key)}}`;
    })
    .join('\n  ');

  if (hasChildren) {
    const children = props.children;
    const childrenString = typeof children === 'string' ? children : '{/* children */}';

    if (propsWithoutChildren.length === 0) {
      return `<${componentName}>\n  ${childrenString}\n</${componentName}>`;
    }

    return `<${componentName}\n  ${propsString}\n>\n  ${childrenString}\n</${componentName}>`;
  }

  if (propsWithoutChildren.length <= 2 && !propsWithoutChildren.some(([k]) => k === 'sefariaData')) {
    const inlineProps = propsWithoutChildren
      .map(([key, value]) => {
        // Display "ref" instead of "sefRef" for better DX
        const displayKey = key === 'sefRef' ? 'ref' : key;
        if (typeof value === 'string') {
          return `${displayKey}="${value}"`;
        }
        if (typeof value === 'boolean' && value === true) {
          return displayKey;
        }
        return `${displayKey}={${formatPropValue(value, key)}}`;
      })
      .join(' ');
    return `<${componentName} ${inlineProps} />`;
  }

  return `<${componentName}\n  ${propsString}\n/>`;
}

const toggleStyles = {
  toggle: {
    position: 'relative' as const,
    width: '36px',
    height: '20px',
    backgroundColor: '#e4e4e7',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: 'none',
    padding: 0,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '16px',
    height: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transition: 'transform 0.2s',
  },
  toggleKnobActive: {
    transform: 'translateX(16px)',
  },
};

export function ExampleRenderer({
  example,
  component: Component,
  componentName,
}: ExampleRendererProps) {
  const [activeTab, setActiveTab] = useState<TabType>('props');
  const [propsOverrides, setPropsOverrides] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filter out 'ref' to avoid React reserved prop conflict
  const baseProps = Object.fromEntries(
    Object.entries(example.props).filter(([key]) => key !== 'ref')
  );
  const currentProps = { ...baseProps, ...propsOverrides };
  const Wrapper = example.wrapper ?? (({ children }) => <>{children}</>);
  const usageCode = generateUsageCode(componentName, currentProps);

  const handleToggle = (key: string, currentValue: boolean) => {
    setPropsOverrides((prev) => ({
      ...prev,
      [key]: !currentValue,
    }));
  };

  const handleEvent = (event: { type: string; data: Record<string, unknown> }) => {
    let dataString: string;

    if (event.type === 'TextBlock:followup' && 'action' in event.data && 'ref' in event.data) {
      const action = event.data.action as FollowupAction;
      const ref = event.data.ref as string;
      const template = FOLLOWUP_TEMPLATES[action];
      const prompt = template.replace('{citation}', ref);
      dataString = `ref: "${ref}"\naction: "${action}"\nprompt: "${prompt}"`;
    } else {
      dataString = JSON.stringify(event.data, null, 2);
    }

    const toast: Toast = {
      id: crypto.randomUUID(),
      eventType: event.type,
      data: dataString,
    };

    setToasts((prev) => [...prev, toast]);
  };

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div className="example-section">
      <div className="example-header">
        <div>
          <h3 className="example-title">{example.title}</h3>
          {example.description && (
            <p className="example-description" dangerouslySetInnerHTML={{ __html: example.description }} />
          )}
        </div>
      </div>

      <div className="example-container">
        <div className="example-preview">
          <Wrapper>
            <Component {...currentProps} onEvent={handleEvent} />
          </Wrapper>
        </div>

        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map((toast) => (
              <div key={toast.id} className="toast">
                <div className="toast-event">{toast.eventType}</div>
                <div className="toast-data">{toast.data}</div>
              </div>
            ))}
          </div>
        )}

        <div className="example-tabs">
          <button
            className={`example-tab ${activeTab === 'props' ? 'active' : ''}`}
            onClick={() => setActiveTab('props')}
          >
            Props
          </button>
          <button
            className={`example-tab ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>

        {activeTab === 'props' && (
          <div className="props-display">
            {Object.entries(currentProps).map(([key, value]) => {
              // Display "ref" instead of "sefRef" for better DX
              const displayKey = key === 'sefRef' ? 'ref' : key;
              const isBoolean = typeof value === 'boolean';

              return (
                <div key={key} className="prop-line">
                  <span className="prop-name">{displayKey}:</span>
                  {isBoolean ? (
                    <button
                      style={{
                        ...toggleStyles.toggle,
                        ...(value ? toggleStyles.toggleActive : {}),
                      }}
                      onClick={() => handleToggle(key, value)}
                      aria-label={`Toggle ${displayKey}`}
                    >
                      <span
                        style={{
                          ...toggleStyles.toggleKnob,
                          ...(value ? toggleStyles.toggleKnobActive : {}),
                        }}
                      />
                    </button>
                  ) : (
                    <span
                      className={`prop-value ${
                        typeof value === 'string'
                          ? 'string'
                          : typeof value === 'number'
                          ? 'number'
                          : ''
                      }`}
                    >
                      {formatPropValue(value, key)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'code' && (
          <CodeBlock code={usageCode} language="tsx" showCopyButton={false} />
        )}
      </div>
    </div>
  );
}
