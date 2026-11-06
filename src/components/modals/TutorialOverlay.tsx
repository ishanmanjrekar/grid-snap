import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const TutorialOverlay: React.FC = () => {
  const dismissTutorial = useGameStore((s) => s.dismissTutorial);

  return (
    <div
      onClick={dismissTutorial}
      data-purpose="tutorial-overlay"
      className="absolute inset-0 bg-[#2C2523]/70 z-50 flex items-center justify-center p-4 cursor-pointer select-none"
    >
      <div className="w-full max-w-[340px] bg-[#2C2523] border-4 border-[#F4EFE0] shadow-[6px_6px_0_0_#000000] p-5 text-center flex flex-col items-center relative">
        <div className="absolute -top-3.5 px-3 py-0.5 bg-[#F8B800] border-2 border-[#2C2523] shadow-[2px_2px_0_0_#000000]">
          <span className="font-pixel text-[9px] text-[#2C2523] font-bold tracking-wider">
            TUTORIAL
          </span>
        </div>

        <h2 className="font-pixel text-[12px] text-[#F8B800] mt-1 mb-4 tracking-wider text-center drop-shadow-[1px_1px_0_#000]">
          ★ GREAT MOVE! ★
        </h2>

        <div className="w-full text-left font-pixel text-[9px] leading-[22px] text-[#FFFDF7] mb-4 space-y-2 px-1">
          <div className="flex items-start gap-2">
            <span className="text-[#38B764] select-none text-[10px]">▸</span>
            <span>SHIFT rows &amp; columns</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#3B82F6] select-none text-[10px]">▸</span>
            <span>TILES LOOP off the screen</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#F8B800] select-none text-[10px]">▸</span>
            <span>SNAP all colors into frames</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t-2 border-[#403833] w-full justify-center">
          <span className="font-pixel text-[8px] text-[#FFECA8] tracking-widest uppercase pixel-star-active">
            TAP TO CONTINUE
          </span>
          <span className="font-pixel text-[8px] text-[#F8B800] pixel-star-active">
            ▼
          </span>
        </div>
      </div>
    </div>
  );
};

