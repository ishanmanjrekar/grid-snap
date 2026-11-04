import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { HeartIcon } from '../PixelIcons';

export const PauseModal: React.FC = () => {
  const closeModal = useGameStore((s) => s.closeModal);
  const forfeitAndReturnToMenu = useGameStore((s) => s.forfeitAndReturnToMenu);

  return (
    <div
      data-purpose="pause-modal-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-5 select-none"
    >
      <div className="w-full max-w-[320px] bg-[#FFF8F0] border-4 border-[#2C2523] shadow-[6px_6px_0_0_#2C2523] relative flex flex-col items-center pt-8 pb-7 px-5">
        {/* Overhanging PAUSED Ribbon */}
        <div className="absolute -top-5 px-5 py-2 bg-[#F8B800] border-4 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] flex items-center justify-center">
          <span className="font-pixel text-xs text-[#2C2523] tracking-widest font-bold">
            PAUSED
          </span>
        </div>

        {/* Inset Pause Icon Box */}
        <div className="flex items-center justify-center my-3 p-3 bg-[#EAE2CA] border-2 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523]">
          <div className="flex gap-2">
            <span className="w-2.5 h-6 bg-[#2C2523]" />
            <span className="w-2.5 h-6 bg-[#2C2523]" />
          </div>
        </div>

        <div className="w-full border-t-2 border-dashed border-[#2C2523]/40 my-3" />

        <div className="w-full flex flex-col gap-3.5 mt-1">
          {/* RESUME Button */}
          <button
            type="button"
            aria-label="Resume Game"
            onClick={closeModal}
            className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white border-4 border-[#2C2523] shadow-[4px_4px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
          >
            <span className="font-pixel text-[11px] text-white tracking-widest drop-shadow-[1px_1px_0_#14532D]">
              RESUME
            </span>
          </button>

          {/* QUIT Button + Heart Warning */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              aria-label="Quit Game"
              onClick={forfeitAndReturnToMenu}
              className="w-full py-2.5 px-4 bg-[#F8F5EB] hover:bg-[#EAE2CA] text-[#2C2523] border-4 border-[#2C2523] shadow-[4px_4px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
            >
              <span className="font-pixel text-[10px] text-[#2C2523] tracking-widest font-bold">
                QUIT
              </span>
            </button>
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              <span className="font-pixel text-[8px] text-[#B91C1C] tracking-tight">
                YOU WILL LOSE 1
              </span>
              <HeartIcon size={13} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

