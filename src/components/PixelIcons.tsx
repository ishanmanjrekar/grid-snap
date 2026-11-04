import React from 'react';
import { COLOR_SHAPE_MAP, type BlockColor, type ColorShape } from '../engine/types';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ColorblindShapeIcon: React.FC<{
  color: BlockColor;
  fill?: string;
  size?: string | number;
  className?: string;
}> = ({ color, fill = 'currentColor', size = '40%', className = '' }) => {
  const shape: ColorShape = COLOR_SHAPE_MAP[color];
  return (
    <svg
      viewBox="0 0 16 16"
      style={{ width: size, height: size }}
      className={`pointer-events-none select-none ${className}`}
      shapeRendering="crispEdges"
    >
      {shape === 'circle' && (
        <path
          fill={fill}
          d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V5h1V3h2V2z"
        />
      )}
      {shape === 'triangle' && (
        <path
          fill={fill}
          d="M7 2h2v2h2v3h2v3h1v3H2v-3h1V7h2V4h2V2z"
        />
      )}
      {shape === 'square' && <rect x="3" y="3" width="10" height="10" fill={fill} />}
      {shape === 'diamond' && (
        <path
          fill={fill}
          d="M7 1h2v2h2v2h2v2h2v2h-2v2h-2v2H9v2H7v-2H5v-2H3V9H1V7h2V5h2V3h2V1z"
        />
      )}
      {shape === 'star' && (
        <path
          fill={fill}
          d="M7 1h2v4h5v2h-3v3h1v4H9v-2H7v2H4v-4h1V7H2V5h5V1z"
        />
      )}
      {shape === 'cross' && (
        <path fill={fill} d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4V2z" />
      )}
      {shape === 'pentagon' && (
        <path
          fill={fill}
          d="M7 2h2v1h3v2h2v4h-1v5H3V9H2V5h2V3h3V2z"
        />
      )}
      {shape === 'heart' && (
        <path
          fill={fill}
          d="M3 3h3v1h1v1h2V4h1V3h3v1h1v4h-1v2h-2v2H9v2H7v-2H5v-2H3V8H2V4h1V3z"
        />
      )}
    </svg>
  );
};

export const PixelStarIcon: React.FC<{
  lit?: boolean;
  size?: number;
  className?: string;
}> = ({ lit = true, size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill="#2C2523"
      d="M6 0h4v3h5v4h-2v3h1v5h-4v-2H6v2H2v-5h1V7H1V3h5V0z"
    />
    <path
      fill={lit ? '#F8B800' : '#D2C7AA'}
      d="M7 1h2v4h5v2h-3v3h1v4H9v-2H7v2H4v-4h1V7H2V5h5V1z"
    />
    {lit && <rect x="7" y="2" width="1" height="3" fill="#FFFDF8" />}
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill="#2C2523"
      d="M2 2h4v1h1v1h2V3h1V2h4v2h1v5h-1v2h-2v2h-2v2H6v-2H4v-2H2V9H1V4h1V2z"
    />
    <path
      fill="#EF4444"
      d="M3 3h3v1h1v1h2V4h1V3h3v1h1v4h-1v2h-2v2H9v2H7v-2H5v-2H3V8H2V4h1V3z"
    />
    <rect x="3" y="4" width="2" height="2" fill="#FCA5A5" />
  </svg>
);

export const CoinIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill="#2C2523"
      d="M5 1h6v1h2v2h1v8h-1v2h-2v1H5v-1H3v-2H2V4h1V2h2V1z"
    />
    <path
      fill="#FBBF24"
      d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V5h1V3h2V2z"
    />
    <path fill="#FEF08A" d="M5 3h4v1H4v4H3V5h2V3z" />
    <path fill="#B45309" d="M7 4h2v8H7V4z" />
  </svg>
);

export const StorefrontIcon: React.FC<IconProps> = ({ size = 22, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <rect x="1" y="2" width="14" height="3" fill="#EF4444" />
    <rect x="2" y="5" width="3" height="2" fill="#FFFDF8" />
    <rect x="5" y="5" width="3" height="2" fill="#EF4444" />
    <rect x="8" y="5" width="3" height="2" fill="#FFFDF8" />
    <rect x="11" y="5" width="3" height="2" fill="#EF4444" />
    <rect x="2" y="7" width="12" height="7" fill="#2C2523" />
    <rect x="3" y="8" width="5" height="4" fill="#FBBF24" />
    <rect x="9" y="8" width="4" height="6" fill="#5EEAD4" />
  </svg>
);

export const SettingsGearIcon: React.FC<IconProps> = ({ size = 22, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill="#2C2523"
      d="M6 1h4v2h2v1h2v2h-1v4h1v2h-2v1h-2v2H6v-2H4v-1H2v-2h1V6H2V4h2V3h2V1zm0 5v4h4V6H6z"
    />
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <rect x="10" y="2" width="4" height="4" fill="#2C2523" />
    <rect x="2" y="6" width="4" height="4" fill="#2C2523" />
    <rect x="10" y="10" width="4" height="4" fill="#2C2523" />
    <path fill="#2C2523" d="M6 6h2V5h2v2H8v2h2v2H8v-1H6V6z" />
  </svg>
);

export const PauseBarsIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <rect x="3" y="2" width="4" height="12" fill="#2C2523" />
    <rect x="9" y="2" width="4" height="12" fill="#2C2523" />
  </svg>
);

export const CloseXIcon: React.FC<IconProps> = ({
  size = 14,
  color = '#FFFDF8',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill={color}
      d="M2 2h3v2h2v2h2V4h3v3h-2v2h2v3H9v-2H7V8H5v4H2V9h2V7H2V2z"
    />
  </svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill="#2C2523"
      d="M5 1h6v1h2v2h1v4h-1v2h-1v4H4v-4H3V8H2V4h1V2h2V1z"
    />
    <path fill="#FBBF24" d="M5 2h6v2h2v4h-2v2H5V8H3V4h2V2z" />
    <rect x="5" y="11" width="6" height="2" fill="#9CA3AF" />
    <rect x="6" y="13" width="4" height="2" fill="#2C2523" />
  </svg>
);

export const HourglassIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <rect x="2" y="1" width="12" height="2" fill="#2C2523" />
    <rect x="2" y="13" width="12" height="2" fill="#2C2523" />
    <path
      fill="#2C2523"
      d="M3 3h10v3h-2v2H9v1h2v2h2v2H3v-2h2V9h2V8H5V6H3V3z"
    />
    <path fill="#FBBF24" d="M5 4h6v2H9v1H7V6H5V4zm2 6h2v1h2v2H5v-2h2v-1z" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path fill="#2C2523" d="M7 1h2v2h2v3h2v4h2v4H1v-4h2V6h2V3h2V1z" />
    <path fill="#FBBF24" d="M7 3h2v3h2v3h2v3H3V9h2V6h2V3z" />
    <rect x="7" y="5" width="2" height="4" fill="#2C2523" />
    <rect x="7" y="10" width="2" height="2" fill="#2C2523" />
  </svg>
);

export const GhostHandIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={`pointer-events-none select-none ${className}`}
    shapeRendering="crispEdges"
  >
    <path
      fill="#2C2523"
      d="M5 1h3v5h5v2h2v5h-1v2H4v-2H2V8h3V1z"
    />
    <path
      fill="#FFFDF8"
      d="M6 2h1v6h5v1h2v4h-1v1H5v-2H3V9h3V2z"
    />
    <rect x="6" y="2" width="1" height="4" fill="#FBBF24" />
  </svg>
);

