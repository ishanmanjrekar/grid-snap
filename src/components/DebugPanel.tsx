import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CloseXIcon } from './PixelIcons';

export const DEBUG_SENTINEL = '__GRID_SNAP_DEBUG_PANEL__';

export const DebugPanel: React.FC = () => {
  const isDebugOpen = useGameStore((s) => s.isDebugOpen);
  const activeLevelId = useGameStore((s) => s.activeLevelId);
  const isTimerFrozen = useGameStore((s) => s.isTimerFrozen);

  const toggleDebugPanel = useGameStore((s) => s.toggleDebugPanel);
  const devCheatInstantWin = useGameStore((s) => s.devCheatInstantWin);
  const devCheatSkipToLevel = useGameStore((s) => s.devCheatSkipToLevel);
  const devCheatAddCoins = useGameStore((s) => s.devCheatAddCoins);
  const devCheatAdjustLives = useGameStore((s) => s.devCheatAdjustLives);
  const devCheatRefillTime = useGameStore((s) => s.devCheatRefillTime);
  const devCheatToggleFreezeTimer = useGameStore(
    (s) => s.devCheatToggleFreezeTimer
  );

  const [levelInput, setLevelInput] = useState<string>(String(activeLevelId));

  if (import.meta.env.VITE_DISABLE_DEBUG === 'true' || !isDebugOpen) {
    return null;
  }

  const handleGoToLevel = () => {
    const parsed = parseInt(levelInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      devCheatSkipToLevel(parsed);
    }
  };

  return (
    <div
      data-debug-sentinel={DEBUG_SENTINEL}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-4 select-none"
    >
      <div className="w-full max-w-[330px] bg-[#1E1B18] text-[#FFFDF8] border-4 border-[#FBBF24] shadow-[6px_6px_0_#000] p-4 relative flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#FBBF24]/40 pb-2">
          <span className="font-pixel text-[10px] text-[#FBBF24] tracking-wider">
            DEV DEBUG PANEL
          </span>
          <button
            type="button"
            aria-label="Close Debug Panel"
            onClick={toggleDebugPanel}
            className="w-7 h-7 bg-[#EF4444] border-2 border-[#FFFDF8] flex items-center justify-center cursor-pointer"
          >
            <CloseXIcon size={11} color="#FFFFFF" />
          </button>
        </div>

        {/* Instant Win */}
        <button
          type="button"
          onClick={devCheatInstantWin}
          className="w-full py-2 bg-[#22C55E] text-[#1E1B18] border-2 border-[#FFFDF8] font-pixel text-[9px] font-bold cursor-pointer active:translate-y-0.5"
        >
          ★ WIN LEVEL INSTANTLY ★
        </button>

        {/* Jump to Level */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#F4EFE6] whitespace-nowrap">
            GO TO LVL #
          </span>
          <input
            type="number"
            min={1}
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
            className="w-20 bg-[#2C2523] text-[#FBBF24] border-2 border-[#FFFDF8] px-2 py-1 font-pixel text-[9px] text-center"
          />
          <button
            type="button"
            onClick={handleGoToLevel}
            className="flex-1 py-1.5 bg-[#FBBF24] text-[#1E1B18] border-2 border-[#FFFDF8] font-pixel text-[9px] font-bold cursor-pointer"
          >
            GO ▶
          </button>
        </div>

        {/* Currency & Lives */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => devCheatAddCoins(1000)}
            className="py-2 px-1 bg-[#FBBF24] text-[#1E1B18] border-2 border-[#FFFDF8] font-pixel text-[7.5px] font-bold cursor-pointer"
          >
            +1,000 COINS
          </button>
          <button
            type="button"
            onClick={() => devCheatAdjustLives(5)}
            className="py-2 px-1 bg-[#10B981] text-white border-2 border-[#FFFDF8] font-pixel text-[7.5px] font-bold cursor-pointer"
          >
            +5 LIVES
          </button>
          <button
            type="button"
            onClick={() => devCheatAdjustLives(-1)}
            className="py-2 px-1 bg-[#EF4444] text-white border-2 border-[#FFFDF8] font-pixel text-[7.5px] font-bold cursor-pointer"
          >
            -1 LIFE
          </button>
        </div>

        {/* Timer Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={devCheatRefillTime}
            className="py-2 px-2 bg-[#3B82F6] text-white border-2 border-[#FFFDF8] font-pixel text-[8px] font-bold cursor-pointer"
          >
            REFILL TIME
          </button>
          <button
            type="button"
            onClick={devCheatToggleFreezeTimer}
            className={`py-2 px-2 border-2 border-[#FFFDF8] font-pixel text-[8px] font-bold cursor-pointer ${
              isTimerFrozen
                ? 'bg-[#A855F7] text-white'
                : 'bg-[#2C2523] text-[#F4EFE6]'
            }`}
          >
            FREEZE: {isTimerFrozen ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;

