import React, { useRef } from 'react';
import { audioManager } from '../../audio/AudioManager';
import economyConfig from '../../config/economy.json';
import { useGameStore } from '../../store/gameStore';
import {
  HourglassIcon,
  LightbulbIcon,
  PauseBarsIcon,
  PixelStarIcon,
} from '../PixelIcons';
import { TorusGrid } from '../TorusGrid';

function formatTimeMMSS(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const InGameView: React.FC = () => {
  const coins = useGameStore((s) => s.coins);
  const activeLevelId = useGameStore((s) => s.activeLevelId);
  const rows = useGameStore((s) => s.rows);
  const cols = useGameStore((s) => s.cols);
  const grid = useGameStore((s) => s.grid);
  const frames = useGameStore((s) => s.frames);
  const timeLimitSeconds = useGameStore((s) => s.timeLimitSeconds);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const activeModal = useGameStore((s) => s.activeModal);
  const activeHint = useGameStore((s) => s.activeHint);
  const colorblindMode = useGameStore((s) => s.settings.colorblindMode);

  const openModal = useGameStore((s) => s.openModal);
  const performShift = useGameStore((s) => s.performShift);
  const useHintBooster = useGameStore((s) => s.useHintBooster);
  const useExtraTimeBooster = useGameStore((s) => s.useExtraTimeBooster);
  const toggleDebugPanel = useGameStore((s) => s.toggleDebugPanel);

  const lastStarTapRef = useRef<number>(0);

  const handleStarTap = () => {
    if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
    const now = performance.now();
    if (now - lastStarTapRef.current <= 350) {
      lastStarTapRef.current = 0;
      toggleDebugPanel();
    } else {
      lastStarTapRef.current = now;
    }
  };

  const ratio =
    timeLimitSeconds > 0
      ? Math.max(0, Math.min(1, timeRemaining / timeLimitSeconds))
      : 0;
  const fillPercent = ratio * 100;

  const twoStarRatio = economyConfig.starThresholds.twoStarMinRatio;
  const threeStarRatio = economyConfig.starThresholds.threeStarMinRatio;

  const star1Lit = timeRemaining > 0;
  const star2Lit = ratio >= twoStarRatio && timeRemaining > 0;
  const star3Lit = ratio > threeStarRatio && timeRemaining > 0;

  const activeFrontierStar = star3Lit ? 3 : star2Lit ? 2 : star1Lit ? 1 : 0;

  const isLowTime = timeRemaining > 0 && timeRemaining <= 10;

  const hintCost = economyConfig.boosters.hintCostCoins;
  const extraTimeCost = economyConfig.boosters.extraTimeCostCoins;

  const canAffordHint = coins >= hintCost;
  const isHintDisabled = activeHint !== null || !canAffordHint;

  const canAffordExtraTime = coins >= extraTimeCost;
  const isTimeFull = timeRemaining >= timeLimitSeconds;
  const isExtraTimeDisabled = isTimeFull || !canAffordExtraTime;

  const handlePauseClick = () => {
    audioManager.playSfx('button_tap');
    openModal('pause');
  };

  const handleHintClick = () => {
    useHintBooster();
  };

  const handleExtraTimeClick = () => {
    useExtraTimeBooster();
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center bg-[#F4EFE6] select-none overflow-hidden">
      {/* 1. TOP HEADER (flex-none) */}
      <header className="w-full px-5 pt-4 pb-1 flex flex-col items-center flex-none">
        {/* Upper Row: Coin Pill, LVL.X, Pause Button */}
        <div className="w-full flex items-center justify-between mb-2">
          {/* Pixel Coin Counter Pill */}
          <div className="flex items-center bg-[#FFFBEA] px-2.5 py-1.5 border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] gap-2">
            <div className="w-4 h-4 bg-[#F8B800] border border-[#2C2523] flex items-center justify-center text-[8px] font-pixel text-[#614500] font-bold">
              $
            </div>
            <span className="font-pixel text-[10px] text-[#2C2523] tracking-tight">
              {coins.toLocaleString()}
            </span>
          </div>

          {/* Stage Title */}
          <div className="text-center">
            <h1 className="font-pixel text-[13px] text-[#2C2523] tracking-widest leading-none drop-shadow-[1px_1px_0_#FFF]">
              LVL.{activeLevelId}
            </h1>
          </div>

          {/* Retro Pause Button || */}
          <button
            type="button"
            aria-label="Pause Game"
            onClick={handlePauseClick}
            className="w-9 h-9 bg-[#FFFDF7] hover:bg-[#F0E8D0] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-[#2C2523] border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] cursor-pointer"
          >
            <PauseBarsIcon size={15} />
          </button>
        </div>

        {/* Middle Row: Centered Timer Pill */}
        <div
          className={`inline-flex items-center border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] px-3 py-1 my-0.5 gap-2 transition-colors ${
            isLowTime
              ? 'bg-[#FCA5A5] text-[#B91C1C] animate-pulse'
              : 'bg-[#FFECA8] text-[#2C2523]'
          }`}
        >
          <HourglassIcon size={14} />
          <span className="font-pixel text-[10px] tracking-wider pt-0.5">
            {formatTimeMMSS(timeRemaining)}
          </span>
        </div>

        {/* Lower Row: 8-Bit Milestone Progress Bar with 3 Pixel Stars */}
        <div className="w-full px-3 mt-3.5 mb-1 relative flex flex-col items-center">
          {/* Segmented Retro Rail */}
          <div className="w-full h-4 bg-[#DCD2B6] border-2 border-[#2C2523] p-[1px] relative overflow-hidden flex items-center">
            <div
              className="h-full bg-[#4DA2FF] border-r-2 border-[#2C2523] relative transition-[width] duration-75"
              style={{ width: `${fillPercent}%` }}
            >
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,#000_1px,transparent_1px)] bg-[size:6px_100%]" />
            </div>
          </div>

          {/* 3 Milestone Stars Positioned by economy.json */}
          <div className="w-full absolute -top-3.5 px-3 left-0 right-0 h-0">
            <div className="relative w-full h-full">
              {/* Star 1 (0%) */}
              <div
                onClick={handleStarTap}
                style={{ left: '0%' }}
                className={`absolute -translate-x-1/2 cursor-pointer ${
                  activeFrontierStar === 1 ? 'pixel-star-active' : ''
                }`}
              >
                <PixelStarIcon
                  lit={star1Lit}
                  size={26}
                  className="drop-shadow-[2px_2px_0_#2C2523]"
                />
              </div>

              {/* Star 2 (twoStarMinRatio * 100%) */}
              <div
                onClick={handleStarTap}
                style={{ left: `${twoStarRatio * 100}%` }}
                className={`absolute -translate-x-1/2 cursor-pointer ${
                  activeFrontierStar === 2 ? 'pixel-star-active' : ''
                }`}
              >
                <PixelStarIcon
                  lit={star2Lit}
                  size={26}
                  className="drop-shadow-[2px_2px_0_#2C2523]"
                />
              </div>

              {/* Star 3 (threeStarMinRatio * 100%) */}
              <div
                onClick={handleStarTap}
                style={{ left: `${threeStarRatio * 100}%` }}
                className={`absolute -translate-x-1/2 cursor-pointer ${
                  activeFrontierStar === 3 ? 'pixel-star-active' : ''
                }`}
              >
                <PixelStarIcon
                  lit={star3Lit}
                  size={26}
                  className="drop-shadow-[2px_2px_0_#2C2523]"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CENTER PLAYABLE GRID AREA (flex-1 min-h-0) */}
      <section className="flex-1 w-full min-h-0 flex items-center justify-center px-3 py-1 overflow-hidden">
        <TorusGrid
          rows={rows}
          cols={cols}
          grid={grid}
          frames={frames}
          colorblindMode={colorblindMode}
          disabled={activeModal !== 'none'}
          activeHint={activeHint}
          onCommitShift={performShift}
          onDragTick={() => audioManager.playSfx('drag_tick')}
        />
      </section>

      {/* 3. BOTTOM CONTROLS (flex-none) */}
      <footer className="w-full pt-1 pb-3 flex items-center justify-around px-5 flex-none">
        {/* Left Unit: HINT ($50) */}
        <div className="flex flex-col items-center w-36">
          <button
            type="button"
            aria-label="Use Hint Booster"
            onClick={handleHintClick}
            className={`w-full py-2 px-2 bg-[#EEF5FF] hover:bg-[#DBEAFE] border-2 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-between transition-all cursor-pointer ${
              isHintDisabled ? 'opacity-65' : ''
            }`}
          >
            <div className="w-7 h-6 bg-[#93C5FD] border border-[#2C2523] flex items-center justify-center shadow-[inset_1px_1px_0_#FFF]">
              <LightbulbIcon size={15} />
            </div>
            <span className="font-pixel text-[9px] text-[#1D4ED8] tracking-tight pr-1">
              HINT
            </span>
          </button>

          <button
            type="button"
            aria-label={`Buy Hint for ${hintCost} Coins`}
            onClick={handleHintClick}
            className={`w-full mt-2 py-1 px-2 bg-[#EEF5FF] hover:bg-[#DBEAFE] border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isHintDisabled ? 'opacity-65' : ''
            }`}
          >
            <span className="w-3.5 h-3.5 bg-[#F8B800] border border-[#2C2523] flex items-center justify-center text-[7px] font-pixel font-bold text-[#614500]">
              $
            </span>
            <span
              className={`font-pixel text-[8px] font-bold ${
                !canAffordHint ? 'text-[#EF4444]' : 'text-[#2C2523]'
              }`}
            >
              {hintCost}
            </span>
          </button>
        </div>

        {/* Right Unit: +5S EXTRA TIME ($100) */}
        <div className="flex flex-col items-center w-36">
          <button
            type="button"
            aria-label="Add 5 Seconds Extra Time"
            onClick={handleExtraTimeClick}
            className={`w-full py-2 px-1.5 bg-[#EBFFEF] hover:bg-[#DCFCE7] border-2 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-between transition-all cursor-pointer ${
              isExtraTimeDisabled ? 'opacity-65' : ''
            }`}
          >
            <div className="w-7 h-6 bg-[#86EFAC] border border-[#2C2523] flex items-center justify-center shadow-[inset_1px_1px_0_#FFF]">
              <span className="font-pixel text-[7px] text-[#15803D] font-bold">
                +5S
              </span>
            </div>
            <span className="font-pixel text-[7px] text-[#15803D] tracking-tight">
              EXTRA TIME
            </span>
          </button>

          <button
            type="button"
            aria-label={`Buy Extra Time for ${extraTimeCost} Coins`}
            onClick={handleExtraTimeClick}
            className={`w-full mt-2 py-1 px-2 bg-[#EBFFEF] hover:bg-[#DCFCE7] border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isExtraTimeDisabled ? 'opacity-65' : ''
            }`}
          >
            <span className="w-3.5 h-3.5 bg-[#F8B800] border border-[#2C2523] flex items-center justify-center text-[7px] font-pixel font-bold text-[#614500]">
              $
            </span>
            <span
              className={`font-pixel text-[8px] font-bold ${
                !canAffordExtraTime ? 'text-[#EF4444]' : 'text-[#2C2523]'
              }`}
            >
              {extraTimeCost}
            </span>
          </button>
        </div>
      </footer>

      {/* Retro Handheld Base Indicator Line */}
      <div className="w-24 h-1.5 bg-[#2C2523]/30 mx-auto mb-2 flex-none pointer-events-none" />
    </div>
  );
};

