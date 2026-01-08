import { useState, type CSSProperties } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showCopyButton?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function CodeBlock({
  code,
  language = 'tsx',
  filename,
  showCopyButton = true,
  className,
  style,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={className ? `source-code-container ${className}` : 'source-code-container'}
      style={style}
    >
      {(filename || showCopyButton) && (
        <div className="source-code-header">
          {filename && <span className="source-code-filename">{filename}</span>}
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className={`copy-button ${copied ? 'copied' : ''}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}
      <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={{ ...style, margin: 0, padding: 16 }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
