import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { CloseXIcon, HourglassIcon, PixelStarIcon } from '../PixelIcons';

function formatClearTime(seconds: number): string {
  const safe = Math.max(1, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const LevelCompleteModal: React.FC = () => {
  const activeLevelId = useGameStore((s) => s.activeLevelId);
  const unlockedLevel = useGameStore((s) => s.unlockedLevel);
  const timeLimitSeconds = useGameStore((s) => s.timeLimitSeconds);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const shiftsCount = useGameStore((s) => s.shiftsCount);
  const lastRewardCoins = useGameStore((s) => s.lastRewardCoins);
  const lastEarnedStars = useGameStore((s) => s.lastEarnedStars);

  const startLevel = useGameStore((s) => s.startLevel);
  const navigateTo = useGameStore((s) => s.navigateTo);

  const timeTaken = Math.max(1, timeLimitSeconds - timeRemaining);

  const bannerLabel =
    lastEarnedStars === 3
      ? '★ PERFECT SOLVE! ★'
      : lastEarnedStars === 2
        ? '★ GREAT CLEAR! ★'
        : '★ STAGE CLEAR! ★';

  const handleNextLevel = () => {
    startLevel(unlockedLevel);
  };

  const handleCloseToMenu = () => {
    navigateTo('menu');
  };

  return (
    <div
      data-purpose="level-complete-modal-overlay"
      className="absolute inset-0 bg-[#2C2523]/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-[340px] bg-[#F6F1DC] border-4 border-[#2C2523] shadow-[6px_6px_0_0_#2C2523] relative flex flex-col items-center pt-8 pb-5 px-4">
        {/* Top-Right Red X Close Button */}
        <button
          type="button"
          aria-label="Close to Main Menu"
          onClick={handleCloseToMenu}
          className="absolute -top-3.5 -right-3.5 w-8 h-8 bg-[#EF4444] hover:bg-[#DC2626] border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <CloseXIcon size={13} color="#FFFFFF" />
        </button>

        {/* Overhanging Gold Header Ribbon */}
        <div className="absolute -top-5 px-4 py-2 bg-[#F8B800] border-4 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] flex items-center justify-center whitespace-nowrap">
          <span className="font-pixel text-[11px] text-[#2C2523] font-bold tracking-wider uppercase drop-shadow-[1px_1px_0_#FFF]">
            LEVEL {activeLevelId} CLEAR!
          </span>
        </div>

        {/* 3 Chunky Pixel Stars */}
        <div
          data-purpose="victory-stars"
          className="flex items-center justify-center gap-3 my-2 pt-1"
        >
          <div className="w-10 h-10 flex items-center justify-center -rotate-6">
            <PixelStarIcon
              lit={lastEarnedStars >= 1}
              size={38}
              className="drop-shadow-[2px_2px_0_#2C2523]"
            />
          </div>
          <div className="w-12 h-12 flex items-center justify-center -translate-y-2 pixel-star-active">
            <PixelStarIcon
              lit={lastEarnedStars >= 2}
              size={46}
              className="drop-shadow-[3px_3px_0_#2C2523]"
            />
          </div>
          <div className="w-10 h-10 flex items-center justify-center rotate-6">
            <PixelStarIcon
              lit={lastEarnedStars >= 3}
              size={38}
              className="drop-shadow-[2px_2px_0_#2C2523]"
            />
          </div>
        </div>

        {/* Status Pill */}
        <span className="font-pixel text-[9px] text-[#15803D] bg-[#86EFAC] px-2.5 py-0.5 border border-[#15803D] mb-3 tracking-tight font-bold">
          {bannerLabel}
        </span>

        {/* Inset Stats Matrix Box (Override: No BEST! badge on TIME) */}
        <div
          data-purpose="level-stats"
          className="w-full bg-[#EAE2CA] border-2 border-[#2C2523] p-2.5 shadow-[inset_2px_2px_0_0_#9E9375] space-y-2 mb-4"
        >
          {/* Stat 1: Time Taken */}
          <div className="flex items-center justify-between bg-[#F8F5EB] px-2 py-1.5 border border-[#2C2523]">
            <div className="flex items-center gap-1.5">
              <HourglassIcon size={13} />
              <span className="font-pixel text-[8px] text-[#2C2523]">TIME</span>
            </div>
            <span className="font-pixel text-[9px] text-[#2C2523] font-bold">
              {formatClearTime(timeTaken)}
            </span>
          </div>

          {/* Stat 2: Total Shifts */}
          <div className="flex items-center justify-between bg-[#F8F5EB] px-2 py-1.5 border border-[#2C2523]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#3B82F6] border border-[#2C2523]" />
              <span className="font-pixel text-[8px] text-[#2C2523]">
                SHIFTS
              </span>
            </div>
            <span className="font-pixel text-[9px] text-[#2C2523] font-bold">
              {shiftsCount} MOVES
            </span>
          </div>

          {/* Stat 3: Coins Reward (+200) */}
          <div className="flex items-center justify-between bg-[#FFFBEA] px-2 py-1.5 border border-[#2C2523]">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-[#F8B800] border border-[#2C2523] flex items-center justify-center text-[7px] font-pixel text-[#614500] font-bold">
                $
              </div>
              <span className="font-pixel text-[8px] text-[#2C2523]">
                COINS
              </span>
            </div>
            <span className="font-pixel text-[9px] text-[#15803D] font-bold">
              +{lastRewardCoins}
            </span>
          </div>
        </div>

        {/* Primary Next Level CTA */}
        <div className="w-full flex flex-col">
          <button
            type="button"
            onClick={handleNextLevel}
            className="w-full py-2.5 px-3 bg-[#22C55E] hover:bg-[#16A34A] border-2 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="font-pixel text-[10px] text-white tracking-wider font-bold drop-shadow-[1px_1px_0_#14532D]">
              NEXT LEVEL ▶
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

