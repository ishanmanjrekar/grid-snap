import React from 'react';
import {
  COLOR_SHAPE_GLYPH_MAP,
  COLOR_SHAPE_MAP,
  type BlockColor,
  type ColorShape,
} from '../engine/types';
import { AssetLoader } from '../utils/AssetLoader';

interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

const toDim = (size?: number | string, fallback = 18): string =>
  size === undefined ? `${fallback}px` : typeof size === 'number' ? `${size}px` : size;

export const ColorblindShapeIcon: React.FC<{
  color: BlockColor;
  fill?: string;
  size?: string | number;
  className?: string;
}> = ({ color, fill = 'currentColor', size = 26, className = '' }) => {
  const shape: ColorShape = COLOR_SHAPE_MAP[color] ?? 'circle';
  const glyph = COLOR_SHAPE_GLYPH_MAP[shape] ?? '●';

  const fontPx =
    typeof size === 'number'
      ? `${size}px`
      : typeof size === 'string' && (size.endsWith('px') || size.endsWith('rem') || size.endsWith('em'))
        ? size
        : '24px';

  return (
    <span
      style={{
        color: fill,
        fontSize: fontPx,
        lineHeight: 1,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Segoe UI Symbol", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
      className={`inline-flex items-center justify-center text-center select-none pointer-events-none font-bold ${className}`}
      aria-label={shape}
    >
      {glyph}
    </span>
  );
};

export const PixelStarIcon: React.FC<{
  lit?: boolean;
  size?: number | string;
  className?: string;
}> = ({ lit = true, size = 18, className = '' }) => {
  const dim = toDim(size, 18);
  return (
    <img
      src={AssetLoader.resolvePath(lit ? 'assets/icons/star.png' : 'assets/icons/star-empty.png')}
      alt={lit ? 'Star' : 'Empty Star'}
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none transition-all ${className}`}
      draggable={false}
    />
  );
};

export const HeartIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => {
  const dim = toDim(size, 18);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/heart.png')}
      alt="Life"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

export const CoinIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => {
  const dim = toDim(size, 18);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/coin.png')}
      alt="Coin"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

export const Coin = CoinIcon;

export const StorefrontIcon: React.FC<IconProps> = ({ size = 22, className = '' }) => {
  const dim = toDim(size, 22);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/store.png')}
      alt="Store"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

export const Cart = StorefrontIcon;

export const SettingsGearIcon: React.FC<IconProps> = ({ size = 22, className = '' }) => {
  const dim = toDim(size, 22);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/gear.png')}
      alt="Settings"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

export const ArticleMultiple = SettingsGearIcon;

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
  size = 12,
  color = '#FFFDF8',
  className = '',
}) => {
  const dim = toDim(size, 12);
  return (
    <span
      style={{
        color,
        fontSize: dim,
        lineHeight: 1,
      }}
      className={`font-pixel font-bold select-none leading-none inline-flex items-center justify-center text-center pointer-events-none ${className}`}
      aria-hidden="true"
    >
      X
    </span>
  );
};

export const LightbulbIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => {
  const dim = toDim(size, 18);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/hint.png')}
      alt="Hint"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

export const HourglassIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => {
  const dim = toDim(size, 16);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/hourglass.png')}
      alt="Time"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

export const WarningIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => {
  const dim = toDim(size, 16);
  return (
    <img
      src={AssetLoader.resolvePath('assets/icons/warning.png')}
      alt="Warning"
      style={{ width: dim, height: dim, imageRendering: 'pixelated' }}
      className={`inline-block select-none pointer-events-none object-contain flex-none ${className}`}
      draggable={false}
    />
  );
};

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

