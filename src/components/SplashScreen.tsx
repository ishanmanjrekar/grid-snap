import React, { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { AssetLoader } from '../utils/AssetLoader';

export const SplashScreen: React.FC = () => {
  const isGameStarted = useGameStore((s) => s.isGameStarted);
  const startGame = useGameStore((s) => s.startGame);
  const syncRemoteConfigs = useGameStore((s) => s.syncRemoteConfigs);

  const [progress, setProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isDismissing, setIsDismissing] = useState<boolean>(false);

  // Smooth 0% -> 100% cartridge loader + parallel remote config sync
  useEffect(() => {
    if (isGameStarted) return;

    void syncRemoteConfigs();

    let loadedTimer: number | null = null;
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          loadedTimer = window.setTimeout(() => {
            setIsLoaded(true);
          }, 150);
          return 100;
        }
        const delta = prev < 60 ? 4 : prev < 85 ? 2.5 : 5;
        return Math.min(100, prev + delta);
      });
    }, 30);

    return () => {
      window.clearInterval(interval);
      if (loadedTimer !== null) {
        window.clearTimeout(loadedTimer);
      }
    };
  }, [isGameStarted]);

  const handleContinue = useCallback(() => {
    if (!isLoaded || isDismissing || isGameStarted) return;
    setIsDismissing(true);
    window.setTimeout(() => {
      startGame();
    }, 450);
  }, [isLoaded, isDismissing, isGameStarted, startGame]);

  // Keyboard Space / Enter support on desktop
  useEffect(() => {
    if (isGameStarted || !isLoaded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isGameStarted, isLoaded, handleContinue]);

  if (isGameStarted) {
    return null;
  }

  const splashBgUrl = AssetLoader.resolvePath('splash.webp');

  return (
    <div
      onClick={handleContinue}
      style={{
        zIndex: 100,
        backgroundImage: `url("${splashBgUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: isDismissing ? 0 : 1,
        transform: isDismissing ? 'scale(1.04)' : 'scale(1)',
        transition:
          'opacity 450ms cubic-bezier(0.16, 1, 0.3, 1), transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`absolute inset-0 select-none overflow-hidden ${
        isLoaded ? 'cursor-pointer' : 'cursor-wait'
      }`}
    >
      <style>{`
        @keyframes pulsePrompt {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>

      {/* Subtle bottom vignette so loader HUD stays crisp over cover illustration */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(26,22,21,0) 48%, rgba(26,22,21,0.55) 75%, rgba(26,22,21,0.75) 100%)',
        }}
      />

      {/* Loader HUD Overlay Positioned at top: 63% below central "GRID SNAP" artwork */}
      <div
        style={{ top: '63%' }}
        className="absolute inset-x-0 px-7 flex flex-col items-center"
      >
        <div className="w-full max-w-[330px] bg-[#F4EFE6]/95 border-[3px] border-[#2C2523] shadow-[4px_4px_0_0_#2C2523] p-3 flex flex-col gap-2">
          {/* Status & Percentage Header */}
          <div className="w-full flex items-center justify-between">
            <span className="font-pixel text-[8px] text-[#2C2523] tracking-wider">
              {isLoaded ? 'READY' : 'LOADING...'}
            </span>
            <span className="font-pixel text-[9px] text-[#2C2523] font-bold">
              {Math.floor(progress)}%
            </span>
          </div>

          {/* 16-Bit Progress Bar Track */}
          <div className="w-full h-5 bg-[#2C2523] border-[3px] border-[#2C2523] p-0.5 relative overflow-hidden">
            <div
              style={{
                width: `${progress}%`,
                background: isLoaded
                  ? 'linear-gradient(90deg, #FBBF24 0%, #22C55E 100%)'
                  : '#FBBF24',
              }}
              className="h-full transition-[width] duration-75 relative"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-white/45" />
            </div>
          </div>
        </div>

        {/* Interactive Prompt Below Progress Box */}
        <div className="mt-4 flex items-center justify-center">
          {isLoaded ? (
            <div
              style={{ animation: 'pulsePrompt 1.4s ease-in-out infinite' }}
              className="bg-[#FFC021] border-[3px] border-[#2C2523] shadow-[4px_4px_0_0_#2C2523] px-5 py-2.5 flex items-center gap-2"
            >
              <span className="font-pixel text-[10px] text-[#1E1B18] font-bold tracking-wider">
                TAP TO CONTINUE
              </span>
              <span className="font-pixel text-[10px] text-[#1E1B18]">▶</span>
            </div>
          ) : (
            <div className="bg-[#2C2523]/90 border-2 border-[#F4EFE6] px-4 py-1.5">
              <span className="font-pixel text-[8px] text-[#FFFDF8] tracking-widest">
                PLEASE WAIT...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

