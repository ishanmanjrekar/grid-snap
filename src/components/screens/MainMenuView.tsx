import React, { useLayoutEffect, useRef, useState } from 'react';
import { audioManager } from '../../audio/AudioManager';
import { getLevelConfig } from '../../engine/grid';
import type { DifficultyTier } from '../../engine/types';
import { useGameStore } from '../../store/gameStore';
import {
  PixelStarIcon,
  SettingsGearIcon,
  ShareIcon,
  StorefrontIcon,
} from '../PixelIcons';
import {
  CoinCapsule,
  LivesCapsule,
  useLifeRegenDisplay,
} from '../HudInventoryCapsules';

export { useLifeRegenDisplay };

function renderDifficultyBadge(difficulty: DifficultyTier) {
  if (difficulty === 'normal') return null;
  if (difficulty === 'hard') {
    return (
      <div className="relative z-10 mt-2 bg-[#EF4444] text-white border-[2.5px] border-[#1E1B18] px-3.5 py-1 shadow-[2.5px_2.5px_0_#1E1B18] flex items-center justify-center">
        <span className="font-pixel text-[10.5px] font-bold tracking-tight text-white leading-none whitespace-nowrap">
          HARD
        </span>
      </div>
    );
  }
  return (
    <div className="relative z-10 mt-2 bg-[#9333EA] text-white border-[2.5px] border-[#1E1B18] px-3 py-1 shadow-[2.5px_2.5px_0_#1E1B18] flex items-center justify-center">
      <span className="font-pixel text-[9px] font-bold tracking-tight text-white leading-none whitespace-nowrap">
        SUPER HARD
      </span>
    </div>
  );
}

export const MainMenuView: React.FC = () => {
  const unlockedLevel = useGameStore((s) => s.unlockedLevel);
  const selectedLevelId = useGameStore((s) => s.selectedLevelId);
  const levelStars = useGameStore((s) => s.levelStars);
  const levels = useGameStore((s) => s.levels);
  const campaignLoop = useGameStore((s) => s.campaignLoop);

  const navigateTo = useGameStore((s) => s.navigateTo);
  const openModal = useGameStore((s) => s.openModal);
  const selectLevel = useGameStore((s) => s.selectLevel);
  const startLevel = useGameStore((s) => s.startLevel);

  const [copiedShare, setCopiedShare] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedNodeRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    startY: number;
    startScrollTop: number;
    scaleY: number;
    moved: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);

  const effectiveSelectedLevel = Math.min(
    unlockedLevel,
    Math.max(1, selectedLevelId || unlockedLevel)
  );

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (effectiveSelectedLevel < unlockedLevel && selectedNodeRef.current) {
      selectedNodeRef.current.scrollIntoView({
        block: 'center',
        behavior: 'auto',
      });
    } else {
      container.scrollTop = 0;
    }
    // Auto-position on mount and whenever unlockedLevel advances; tapping nodes stays in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedLevel]);

  const totalStars = Object.values(levelStars).reduce((sum, s) => sum + s, 0);

  const lvl0 = unlockedLevel;
  const lvl1 = unlockedLevel + 1;
  const lvl2 = unlockedLevel + 2;
  const lvl3 = unlockedLevel + 3;

  const cfg0 = getLevelConfig(lvl0, levels, campaignLoop);
  const cfg1 = getLevelConfig(lvl1, levels, campaignLoop);
  const cfg2 = getLevelConfig(lvl2, levels, campaignLoop);

  const playableLevelIds = Array.from(
    { length: unlockedLevel },
    (_, idx) => unlockedLevel - idx
  );

  const handleOpenSettings = () => {
    audioManager.playSfx('button_tap');
    openModal('settings');
  };

  const handleOpenStore = () => {
    audioManager.playSfx('button_tap');
    navigateTo('store');
  };

  const handleScrollPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scaleY =
      container.offsetHeight > 0 ? rect.height / container.offsetHeight : 1;

    suppressNextClickRef.current = false;
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScrollTop: container.scrollTop,
      scaleY: scaleY > 0 ? scaleY : 1,
      moved: false,
    };
  };

  const handleScrollPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const container = scrollContainerRef.current;
    if (!drag || !drag.active || drag.pointerId !== e.pointerId || !container) {
      return;
    }

    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dy) > 6) {
      drag.moved = true;
      suppressNextClickRef.current = true;
      container.setPointerCapture?.(e.pointerId);
    }

    if (drag.moved) {
      container.scrollTop = drag.startScrollTop - dy / drag.scaleY;
    }
  };

  const handleScrollPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const container = scrollContainerRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    if (drag.moved && container?.hasPointerCapture?.(e.pointerId)) {
      container.releasePointerCapture(e.pointerId);
    }
    if (drag.moved) {
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }
    dragStateRef.current = null;
  };

  const handleScrollClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClickRef.current = false;
    }
  };

  const handleShare = async () => {
    audioManager.playSfx('button_tap');
    const shareUrl = 'https://playable-things.itch.io/grid-snap';
    const text = `Testing my spatial logic in Grid Snap — made it to Level ${unlockedLevel} with ⭐ ${totalStars} Stars!\n\nLooking for a real puzzle challenge? Try it here:\n${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Grid Snap', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedShare(true);
        window.setTimeout(() => setCopiedShare(false), 1500);
      }
    } catch {
      // User cancelled share sheet
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#F6F1E3] text-[#1E1B18] select-none overflow-hidden">
      {/* 1. TOP HUD BAR (flex-none) */}
      <header className="w-full px-4 pt-3 pb-2 flex items-center justify-between relative z-30 flex-none">
        {/* Left: Coin Capsule */}
        <CoinCapsule onClick={handleOpenStore} />

        {/* Right: Lives Capsule (Displays FULL with no timer when lives >= 5) */}
        <LivesCapsule onClick={handleOpenStore} />
      </header>

      {/* 2. CENTER STAGE: SCROLLABLE VERTICAL LEVEL PATH (flex-1 min-h-0) */}
      <div className="relative w-full flex-1 min-h-0 overflow-hidden">
        {/* Top-Left STORE Button (Pinned) */}
        <div className="absolute top-2 left-4 z-30">
          <button
            type="button"
            aria-label="Store"
            onClick={() => navigateTo('store')}
            className="w-14 h-14 bg-[#5EEAD4] border-[3px] border-[#1E1B18] pixel-btn flex flex-col items-center justify-center gap-1 p-1"
          >
            <StorefrontIcon size={24} />
            <span className="font-pixel text-[7.5px] font-bold tracking-tight text-[#1E1B18] leading-none">
              STORE
            </span>
          </button>
        </div>

        {/* Top-Right SETTINGS Button (Pinned) */}
        <div className="absolute top-2 right-4 z-30">
          <button
            type="button"
            aria-label="Settings"
            onClick={handleOpenSettings}
            className="w-14 h-14 bg-[#FFFDF8] border-[3px] border-[#1E1B18] pixel-btn flex flex-col items-center justify-center p-1"
          >
            <SettingsGearIcon size={26} />
          </button>
        </div>

        {/* Scrollable Path Container (Top capped at unlockedLevel + 3 preview; bottom scrolls down to Level 1) */}
        <div
          ref={scrollContainerRef}
          data-purpose="level-path-scroll"
          onPointerDown={handleScrollPointerDown}
          onPointerMove={handleScrollPointerMove}
          onPointerUp={handleScrollPointerEnd}
          onPointerCancel={handleScrollPointerEnd}
          onClickCapture={handleScrollClickCapture}
          className="relative w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center px-4 touch-none cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="relative w-full flex flex-col items-center my-auto pt-1 pb-4">
            {/* Continuous Vertical Dashed Connector Line (terminates cleanly behind Level 1) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-4 bottom-20 left-1/2 -translate-x-1/2 w-0 border-l-4 border-dashed border-[#1E1B18] z-0"
            />

            {/* Top Node (unlockedLevel + 3): Partially muted dashed preview square */}
            <div className="relative z-10 w-full flex justify-center mt-1 mb-2">
              <div className="w-16 h-16 bg-[#EDE5D3] border-[3px] border-dashed border-[#1E1B18] shadow-[2px_2px_0_#1E1B18] flex flex-col items-center justify-center">
                <span className="font-pixel font-bold text-[15px] text-[#1E1B18] opacity-60">
                  {lvl3}
                </span>
              </div>
            </div>

            {/* Upper-Middle Locked Node (unlockedLevel + 2) */}
            <div className="relative z-10 w-full flex justify-center my-2">
              <div className="relative w-24 h-24 bg-[#FFFDF8] border-[3.5px] border-[#1E1B18] shadow-[3px_3px_0_#1E1B18] flex flex-col items-center justify-center">
                <div className="absolute inset-1.5 border border-white/60 pointer-events-none z-0" />
                <span className="relative z-10 font-pixel font-bold text-[22px] text-[#1E1B18]">
                  {lvl2}
                </span>
                {renderDifficultyBadge(cfg2.difficulty)}
              </div>
            </div>

            {/* Lower-Middle Locked Node (unlockedLevel + 1) */}
            <div className="relative z-10 w-full flex justify-center my-2">
              <div className="relative w-28 h-28 bg-[#FFFDF8] border-[3.5px] border-[#1E1B18] shadow-[3px_3px_0_#1E1B18] flex flex-col items-center justify-center">
                <div className="absolute inset-1.5 border border-white/60 pointer-events-none z-0" />
                <span className="relative z-10 font-pixel font-bold text-[26px] text-[#1E1B18]">
                  {lvl1}
                </span>
                {renderDifficultyBadge(cfg1.difficulty)}
              </div>
            </div>

            {/* Playable Nodes (unlockedLevel down to Level 1) */}
            {playableLevelIds.map((levelId) => {
              const isSelected = levelId === effectiveSelectedLevel;
              const isSolved = levelId < unlockedLevel;
              const earnedStars = levelStars[levelId] ?? 0;

              if (isSelected) {
                return (
                  <div
                    key={levelId}
                    className="relative z-20 w-full flex justify-center my-2.5"
                  >
                    <button
                      ref={selectedNodeRef}
                      type="button"
                      aria-label={`Play Level ${levelId}`}
                      onClick={() => startLevel(levelId)}
                      className="relative w-36 h-36 bg-[#28C76F] border-[4px] border-[#1E1B18] shadow-[4px_4px_0_#1E1B18] flex flex-col items-center justify-center overflow-hidden cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                    >
                      {/* Top Highlight Bevel */}
                      <div className="absolute top-0 inset-x-0 h-3 bg-[#A3F0C4]/70" />
                      {/* Left Highlight Bevel */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-[#A3F0C4]/40" />
                      {/* Bottom Shadow Bevel */}
                      <div className="absolute bottom-0 inset-x-0 h-3.5 bg-[#178546]" />
                      <span className="font-pixel font-bold text-[34px] text-white drop-shadow-[2px_2px_0px_#1E1B18] relative z-10 leading-none mt-1">
                        {levelId}
                      </span>
                      {isSolved ? (
                        <div
                          className="relative z-10 mt-2.5 flex items-center justify-center gap-1.5"
                          aria-label={`${earnedStars} of 3 stars`}
                        >
                          {[1, 2, 3].map((starIdx) => (
                            <PixelStarIcon
                              key={starIdx}
                              lit={starIdx <= earnedStars}
                              size={20}
                              className="drop-shadow-[1.5px_1.5px_0_#1E1B18]"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="relative z-10">
                          {renderDifficultyBadge(cfg0.difficulty)}
                        </div>
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={levelId}
                  className="relative z-10 w-full flex justify-center my-2"
                >
                  <button
                    type="button"
                    aria-label={`Select Level ${levelId}`}
                    onClick={() => selectLevel(levelId)}
                    className="relative w-28 h-28 bg-[#FFFDF8] hover:bg-[#FAF3E0] border-[3.5px] border-[#1E1B18] shadow-[3px_3px_0_#1E1B18] flex flex-col items-center justify-center cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-colors"
                  >
                    <div className="absolute inset-1.5 border border-white/60 pointer-events-none z-0" />
                    <span className="relative z-10 font-pixel font-bold text-[26px] text-[#1E1B18] leading-none">
                      {levelId}
                    </span>
                    {isSolved ? (
                      <div
                        className="relative z-10 mt-2 flex items-center justify-center gap-1"
                        aria-label={`${earnedStars} of 3 stars`}
                      >
                        {[1, 2, 3].map((starIdx) => (
                          <PixelStarIcon
                            key={starIdx}
                            lit={starIdx <= earnedStars}
                            size={16}
                            className="drop-shadow-[1px_1px_0_#1E1B18]"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="relative z-10">
                        {renderDifficultyBadge(cfg0.difficulty)}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ACTION PANEL (flex-none) */}
      <footer className="w-full px-6 pt-2 pb-9 flex flex-col items-center relative z-30 flex-none">
        {/* Star Count Vanity Row + Share Button */}
        <div className="w-full max-w-xs flex items-center justify-between gap-2.5 mb-3">
          <div className="flex-1 h-11 bg-[#FFFDF8] border-2 border-[#1E1B18] shadow-[2px_2px_0_#1E1B18] flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <PixelStarIcon lit={true} size={18} />
              <span className="font-pixel text-[9px] font-bold text-[#1E1B18] tracking-wider">
                {copiedShare ? 'COPIED STATS!' : 'STAR COUNT'}
              </span>
            </div>
            <span className="font-pixel text-[11px] font-bold text-[#1E1B18] tracking-tight">
              {totalStars}
            </span>
          </div>

          <button
            type="button"
            aria-label="Share Stats"
            onClick={handleShare}
            className="w-11 h-11 bg-[#FFFDF8] border-[3px] border-[#1E1B18] pixel-btn flex items-center justify-center text-[#1E1B18]"
          >
            <ShareIcon size={18} />
          </button>
        </div>

        {/* Primary PLAY Button */}
        <button
          id="playButton"
          type="button"
          onClick={() => startLevel(effectiveSelectedLevel)}
          className="w-full max-w-xs h-14 bg-[#FFC021] hover:bg-[#F5B014] border-[3px] border-[#1E1B18] shadow-[4px_4px_0_#1E1B18] pixel-btn flex items-center justify-center gap-2.5 text-[#1E1B18]"
        >
          <span className="font-pixel text-[13px] font-black">▶</span>
          <span className="font-pixel font-bold text-[14px] tracking-wider text-[#1E1B18]">
            PLAY
          </span>
        </button>
      </footer>
    </div>
  );
};

