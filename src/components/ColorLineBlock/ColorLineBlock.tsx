import { forwardRef, type CSSProperties, type ReactNode, type MouseEventHandler } from 'react';

export interface ColorLineBlockProps {
  borderColor?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children?: ReactNode;
}

const baseStyle: CSSProperties = {
  position: 'relative',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#e4e4e7',
  borderLeftWidth: '5px',
  backgroundColor: '#ffffff',
  padding: '16px',
  paddingBottom: '16px',
};

export const ColorLineBlock = forwardRef<HTMLDivElement, ColorLineBlockProps>(
  ({ borderColor, className, style, onClick, children }, ref) => {
    const mergedStyle: CSSProperties = {
      ...baseStyle,
      ...style,
      ...(borderColor ? { borderLeftColor: borderColor } : null),
    };

    return (
      <div ref={ref} className={className} style={mergedStyle} onClick={onClick}>
        {children}
      </div>
    );
  }
);

ColorLineBlock.displayName = 'ColorLineBlock';
