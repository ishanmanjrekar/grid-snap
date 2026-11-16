import { App as CapApp } from '@capacitor/app';
import React from 'react';
import { audioManager } from '../../audio/AudioManager';
import { useGameStore } from '../../store/gameStore';

export const ExitConfirmModal: React.FC = () => {
  const closeModal = useGameStore((s) => s.closeModal);

  const handleConfirmExit = () => {
    audioManager.playSfx('button_tap');
    void CapApp.exitApp();
  };

  return (
    <div
      data-purpose="exit-confirm-modal-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-5 select-none"
    >
      <div className="w-full max-w-[320px] bg-[#FFF8F0] border-4 border-[#2C2523] shadow-[6px_6px_0_0_#2C2523] relative flex flex-col items-center pt-8 pb-6 px-5">
        {/* Overhanging EXIT GAME? Ribbon */}
        <div className="absolute -top-5 px-5 py-2 bg-[#F8B800] border-4 border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] flex items-center justify-center">
          <span className="font-pixel text-xs text-[#2C2523] tracking-widest font-bold">
            EXIT GAME?
          </span>
        </div>

        {/* Inset Confirmation Prompt */}
        <div className="w-full bg-[#EAE2CA] border-2 border-[#2C2523] p-3.5 my-3 shadow-[inset_2px_2px_0_0_#9E9375] text-center">
          <p className="font-pixel text-[9.5px] leading-relaxed text-[#2C2523] font-bold">
            ARE YOU SURE YOU WANT TO CLOSE THE GAME?
          </p>
        </div>

        {/* Side-by-Side NO / YES Controls */}
        <div className="w-full grid grid-cols-2 gap-3.5 mt-2">
          <button
            type="button"
            aria-label="Stay in Game"
            onClick={closeModal}
            className="py-3 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white border-4 border-[#2C2523] shadow-[4px_4px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
          >
            <span className="font-pixel text-[11px] text-white tracking-widest font-bold drop-shadow-[1px_1px_0_#14532D]">
              NO
            </span>
          </button>

          <button
            type="button"
            aria-label="Exit Game"
            onClick={handleConfirmExit}
            className="py-3 px-3 bg-[#EF4444] hover:bg-[#DC2626] text-white border-4 border-[#2C2523] shadow-[4px_4px_0_0_#2C2523] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
          >
            <span className="font-pixel text-[11px] text-white tracking-widest font-bold drop-shadow-[1px_1px_0_#7F1D1D]">
              YES
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
