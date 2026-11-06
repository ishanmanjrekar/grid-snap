import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CoinIcon, HeartIcon } from './PixelIcons';

/**
 * Hook to compute current life count display and regeneration countdown timer.
 */
export function useLifeRegenDisplay(): { isFull: boolean; timerText: string } {
  const lives = useGameStore((s) => s.lives);
  const lastLifeRegenAt = useGameStore((s) => s.lastLifeRegenAt);
  const maxLives = useGameStore((s) => s.economy.maxLives);
  const lifeRegenIntervalSeconds = useGameStore(
    (s) => s.economy.lifeRegenIntervalSeconds
  );
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (lives >= maxLives) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [lives, maxLives]);

  if (lives >= maxLives) {
    return { isFull: true, timerText: 'FULL' };
  }

  const intervalMs = lifeRegenIntervalSeconds * 1000;
  const elapsed = Math.max(0, now - lastLifeRegenAt);
  const remainingSec = Math.max(
    0,
    Math.ceil((intervalMs - (elapsed % intervalMs)) / 1000)
  );
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  return {
    isFull: false,
    timerText: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
  };
}

export interface CoinCapsuleProps {
  showPlus?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export const CoinCapsule: React.FC<CoinCapsuleProps> = ({
  showPlus = true,
  onClick,
  ariaLabel = 'Coin Store',
  className = '',
}) => {
  const coins = useGameStore((s) => s.coins);

  if (showPlus) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={`flex items-center bg-[#FFFDF8] h-11 border-[3px] border-[#1E1B18] shadow-[3px_3px_0_#1E1B18] pixel-btn p-0 text-[#1E1B18] select-none cursor-pointer ${className}`}
      >
        <div className="flex items-center h-full pl-2 pr-2.5 gap-1.5">
          <CoinIcon size={20} />
          <span className="font-pixel text-[10px] font-bold tracking-tight text-[#1E1B18]">
            {coins.toLocaleString()}
          </span>
        </div>
        <div className="w-8 h-full bg-[#FFCC00] border-l-[3px] border-[#1E1B18] flex items-center justify-center text-[#1E1B18] font-pixel font-black text-[14px] leading-none">
          +
        </div>
      </button>
    );
  }

  return (
    <div
      className={`flex items-center bg-[#FFFDF8] h-11 border-[3px] border-[#1E1B18] shadow-[3px_3px_0_#1E1B18] px-3 gap-2 text-[#1E1B18] select-none ${className}`}
    >
      <CoinIcon size={20} />
      <span className="font-pixel text-[10px] font-bold tracking-tight text-[#1E1B18]">
        {coins.toLocaleString()}
      </span>
    </div>
  );
};

export interface LivesCapsuleProps {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export const LivesCapsule: React.FC<LivesCapsuleProps> = ({
  onClick,
  ariaLabel = 'Lives Store',
  className = '',
}) => {
  const lives = useGameStore((s) => s.lives);
  const { isFull, timerText } = useLifeRegenDisplay();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex items-center bg-[#FFFDF8] h-11 border-[3px] border-[#1E1B18] shadow-[3px_3px_0_#1E1B18] pixel-btn p-0 text-[#1E1B18] select-none cursor-pointer ${className}`}
    >
      <div className="flex items-center h-full pl-2 pr-2.5 gap-2">
        <HeartIcon size={18} />
        <span className="font-pixel text-[10px] font-bold text-[#1E1B18]">
          {lives}
        </span>
        <div className="w-[2px] h-4 bg-[#1E1B18]" />
        <span
          className={`font-pixel text-[9px] font-bold tracking-tighter ${
            isFull ? 'text-[#15803D]' : 'text-[#1E1B18]'
          }`}
        >
          {timerText}
        </span>
      </div>
      <div className="w-8 h-full bg-[#28C76F] border-l-[3px] border-[#1E1B18] flex items-center justify-center text-white font-pixel font-black text-[14px] leading-none">
        +
      </div>
    </button>
  );
};

