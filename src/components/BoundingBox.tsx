import React, { useLayoutEffect, useRef, useState } from 'react';

interface GameLayerProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

export const BoundingBox: React.FC<GameLayerProps> = ({ width, height, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFluidLayout, setIsFluidLayout] = useState(false);

  useLayoutEffect(() => {
    // Detect if running inside the Capacitor native WebView shell or a mobile/tablet browser.
    // Note: Importing @capacitor/core defines window.Capacitor on Web too, so we must check isNativePlatform().
    const capGlobal =
      typeof window !== 'undefined'
        ? (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        : undefined;
    const checkCapacitor = Boolean(capGlobal?.isNativePlatform?.());

    const isPortraitGame = width < height;
    const checkIsMobile = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (isMobileUA) return true;
      // Avoid false-positives on touch-enabled Windows desktop laptops where innerHeight <= 800
      if (isPortraitGame) {
        return navigator.maxTouchPoints > 0 && window.innerWidth <= 600 && window.innerWidth < window.innerHeight;
      }
      return navigator.maxTouchPoints > 0 && Math.max(window.innerWidth, window.innerHeight) <= 900;
    };

    const handleResize = () => {
      const isFluid = checkCapacitor || checkIsMobile();
      setIsFluidLayout(isFluid);

      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current.parentElement || document.body;

        // On mobile itch.io, the iframe may be wider/taller than the physical screen.
        // screen.width/height give the actual device dimensions in CSS pixels.
        // We clamp available space to physical screen bounds, accounting for physical
        // orientation to prevent rotation clipping on devices with stale screen dimensions.
        const isLandscape = window.innerWidth > window.innerHeight;
        const screenW = window.screen.width;
        const screenH = window.screen.height;
        const realScreenW = isLandscape ? Math.max(screenW, screenH) : Math.min(screenW, screenH);
        const realScreenH = isLandscape ? Math.min(screenW, screenH) : Math.max(screenW, screenH);

        const availW = Math.min(clientWidth || window.innerWidth, realScreenW);
        const availH = Math.min(clientHeight || window.innerHeight, realScreenH);

        if (isFluid) {
          // Full-screen fluid layout (Mobile Web, Mobile Itch.io, Native APK)
          setScale(1);
        } else {
          // Standard Web/Itch.io desktop: scale simulated viewport (Portrait or Landscape)
          const scaleX = availW / width;
          const scaleY = availH / height;
          setScale(Math.min(scaleX, scaleY));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.screen.orientation?.addEventListener('change', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.screen.orientation?.removeEventListener('change', handleResize);
    };
  }, [width, height]);

  // Fluid layouts run borderless and edge-to-edge; Desktop web uses simulated device framing.
  // containerType: 'size' ensures cqw/cqh and @container queries always measure the game box, never the desktop monitor.
  const innerStyle: React.CSSProperties = isFluidLayout
    ? {
        width: '100%',
        height: '100%',
        position: 'relative',
        containerType: 'size',
      }
    : {
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        borderRadius: '16px',
        overflow: 'hidden',
        containerType: 'size',
      };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div data-layout={isFluidLayout ? 'fluid' : 'framed'} style={innerStyle}>
        {children}
      </div>
    </div>
  );
};
