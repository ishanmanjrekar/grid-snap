import React from 'react';
import economyConfig from '../../config/economy.json';
import { getSnapProgress } from '../../engine/grid';
import { useGameStore } from '../../store/gameStore';
import { CloseXIcon, HeartIcon, HourglassIcon } from '../PixelIcons';

export const OutOfTimeModal: React.FC = () => {
  const coins = useGameStore((s) => s.coins);
  const shiftsCount = useGameStore((s) => s.shiftsCount);
  const grid = useGameStore((s) => s.grid);
  const frames = useGameStore((s) => s.frames);

  const useOutOfTimeRescue = useGameStore((s) => s.useOutOfTimeRescue);
  const forfeitAndReturnToMenu = useGameStore((s) => s.forfeitAndReturnToMenu);

  const snapProgress = getSnapProgress(grid, frames);
  const reviveCost = economyConfig.boosters.reviveCostCoins;
  const reviveSeconds = economyConfig.boosters.reviveSeconds;
  const canAffordRevive = coins >= reviveCost;

  const handleRescueClick = () => {
    useOutOfTimeRescue();
  };

  return (
    <div
      data-purpose="out-of-time-modal-overlay"
      className="absolute inset-0 bg-[#2C2523]/70 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-[340px] bg-[#F6F1DC] border-4 border-[#2C2523] shadow-[6px_6px_0_0_#2C2523] relative flex flex-col items-center pt-8 pb-5 px-4">
        {/* Top-Right Close Button */}
        <button
          type="button"
          aria-label="Close and Forfeit Heart"
          onClick={forfeitAndReturnToMenu}
          className="absolute -top-3.5 right-2 w-7 h-7 bg-[#EF4444] hover:bg-[#B91C1C] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white border-2 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] cursor-pointer z-50"
        >
          <CloseXIcon size={12} color="#FFFFFF" />
        </button>

        {/* Floating -1 Heart Penalty Badge Directly Below Close Button */}
        <div className="absolute top-5 right-2 bg-[#FCA5A5] border border-[#B91C1C] px-1.5 py-0.5 flex items-center justify-center gap-1 shadow-[2px_2px_0_0_#2C2523] pointer-events-none z-50">
          <span className="font-pixel text-[7px] text-[#B91C1C] font-bold leading-none tracking-tight">
            -1
          </span>
          <HeartIcon size={10} />
        </div>

        {/* Overhanging Crimson TIME'S UP! Ribbon */}
        <div className="absolute -top-5 px-5 py-2 bg-[#EF4444] border-4 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] flex items-center justify-center whitespace-nowrap">
          <span className="font-pixel text-[11px] text-white font-bold tracking-wider uppercase drop-shadow-[1px_1px_0_#2C2523]">
            TIME&apos;S UP!
          </span>
        </div>

        {/* 8-Bit Hourglass Graphic Box */}
        <div className="flex flex-col items-center justify-center my-2 pt-1">
          <div className="w-14 h-14 bg-[#FFECA8] border-2 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] flex flex-col items-center justify-center p-1.5">
            <HourglassIcon size={32} />
          </div>
        </div>

        {/* Warning Sub-banner */}
        <span className="font-pixel text-[8px] text-[#B91C1C] bg-[#FCA5A5] px-2.5 py-1 border border-[#B91C1C] mb-3 tracking-tight font-bold">
          ! YOU RAN OUT OF TIME !
        </span>

        {/* Stats Info Panel */}
        <div className="w-full bg-[#EAE2CA] border-2 border-[#2C2523] p-2.5 shadow-[inset_2px_2px_0_0_#9E9375] space-y-2 mb-4">
          {/* Stat 1: Time Left / Status */}
          <div className="flex items-center justify-between bg-[#F8F5EB] px-2 py-1.5 border border-[#2C2523]">
            <div className="flex items-center gap-1.5">
              <HourglassIcon size={13} />
              <span className="font-pixel text-[8px] text-[#2C2523]">TIME</span>
            </div>
            <span className="font-pixel text-[9px] text-[#B91C1C] font-bold">
              00:00 (EXPIRED)
            </span>
          </div>

          {/* Stat 2: Total Moves Made */}
          <div className="flex items-center justify-between bg-[#F8F5EB] px-2 py-1.5 border border-[#2C2523]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#3B82F6] border border-[#2C2523]" />
              <span className="font-pixel text-[8px] text-[#2C2523]">
                MOVES
              </span>
            </div>
            <span className="font-pixel text-[9px] text-[#2C2523] font-bold">
              {shiftsCount} SHIFTS
            </span>
          </div>

          {/* Stat 3: Puzzle Solved Progress */}
          <div className="flex items-center justify-between bg-[#F8F5EB] px-2 py-1.5 border border-[#2C2523]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-dashed border-[#16A34A] bg-[#22C55E]/20" />
              <span className="font-pixel text-[8px] text-[#2C2523]">
                SOLVED
              </span>
            </div>
            <span className="font-pixel text-[9px] text-[#2C2523] font-bold">
              {snapProgress.matchedSlots} / {snapProgress.totalSlots} SLOTS
            </span>
          </div>
        </div>

        {/* Primary Continue (+30 SECONDS) CTA Button */}
        <div className="w-full flex flex-col">
          <button
            type="button"
            disabled={!canAffordRevive}
            onClick={handleRescueClick}
            className={`w-full py-2.5 px-3 bg-[#22C55E] border-2 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] flex items-center justify-between transition-all ${
              canAffordRevive
                ? 'hover:bg-[#16A34A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-[10px] text-white tracking-wider font-bold drop-shadow-[1px_1px_0_#14532D]">
                +{reviveSeconds} SECONDS ▶
              </span>
            </div>
            <div className="flex items-center bg-[#FFECA8] border border-[#2C2523] px-1.5 py-0.5 gap-1 shadow-[inset_1px_1px_0_#FFF]">
              <div className="w-3 h-3 bg-[#F8B800] border border-[#2C2523] flex items-center justify-center text-[7px] font-pixel text-[#614500] font-bold">
                $
              </div>
              <span
                className={`font-pixel text-[8px] font-bold ${
                  !canAffordRevive ? 'text-[#EF4444]' : 'text-[#2C2523]'
                }`}
              >
                {reviveCost}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

