import React from 'react';

interface SparklineProps {
  values: number[]; // 0-100
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  ariaLabel?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 120,
  height = 32,
  stroke = 'currentColor',
  strokeWidth = 2,
  ariaLabel = 'Trend'
}) => {
  if (!values.length) return null;
  const max = 100; // normalized
  const min = 0;
  const step = width / Math.max(values.length - 1, 1);
  const d = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / (max - min)) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const gradientId = 'sparkline-gradient';
  const areaPath = d + ` L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" aria-hidden="true" />
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
