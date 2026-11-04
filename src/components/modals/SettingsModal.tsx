import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CloseXIcon, SettingsGearIcon, WarningIcon } from '../PixelIcons';

export const SettingsModal: React.FC = () => {
  const settings = useGameStore((s) => s.settings);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const toggleColorblindMode = useGameStore((s) => s.toggleColorblindMode);
  const resetAllProgress = useGameStore((s) => s.resetAllProgress);
  const closeModal = useGameStore((s) => s.closeModal);

  const [resetStage, setResetStage] = useState<'idle' | 'confirm' | 'cleared'>(
    'idle'
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleResetTap = () => {
    if (resetStage === 'idle') {
      setResetStage('confirm');
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setResetStage('idle');
      }, 3000);
    } else if (resetStage === 'confirm') {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      resetAllProgress();
      setResetStage('cleared');
      timerRef.current = window.setTimeout(() => {
        setResetStage('idle');
      }, 1200);
    }
  };

  return (
    <div
      id="settingsModal"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] select-none"
    >
      <div className="relative w-full max-w-xs bg-[#FFFDF8] border-[4px] border-[#1E1B18] shadow-[4px_4px_0px_#1E1B18] pt-7 pb-5 px-5 flex flex-col items-center">
        {/* Overhanging Gold SETTINGS Ribbon */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FFCC00] border-[3px] border-[#1E1B18] shadow-[3px_3px_0px_#1E1B18] px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
          <SettingsGearIcon size={16} />
          <span className="font-pixel font-bold text-[12px] text-[#1E1B18] tracking-wider">
            SETTINGS
          </span>
        </div>

        {/* Top-Right Red Close X Button */}
        <button
          type="button"
          aria-label="Close Settings"
          onClick={closeModal}
          className="absolute -top-3.5 -right-3.5 w-8 h-8 bg-[#EF4444] border-[3px] border-[#1E1B18] shadow-[2px_2px_0px_#1E1B18] pixel-btn flex items-center justify-center text-white cursor-pointer"
        >
          <CloseXIcon size={13} color="#FFFFFF" />
        </button>

        {/* Toggles List */}
        <div className="w-full flex flex-col gap-4 mt-2">
          {/* 1. MUSIC */}
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] font-bold text-[#1E1B18] tracking-wide">
              MUSIC
            </span>
            <div className="flex border-[3px] border-[#1E1B18] bg-[#EDE5D3]">
              <button
                type="button"
                onClick={() => !settings.musicEnabled && toggleMusic()}
                className={`font-pixel px-2.5 py-1 text-[9px] font-bold border-r-[2px] border-[#1E1B18] cursor-pointer select-none ${
                  settings.musicEnabled
                    ? 'bg-[#28C76F] text-white'
                    : 'bg-[#EDE5D3] text-[#1E1B18] opacity-60'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => settings.musicEnabled && toggleMusic()}
                className={`font-pixel px-2.5 py-1 text-[9px] font-bold cursor-pointer select-none ${
                  !settings.musicEnabled
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#EDE5D3] text-[#1E1B18] opacity-60'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* 2. SFX */}
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] font-bold text-[#1E1B18] tracking-wide">
              SFX
            </span>
            <div className="flex border-[3px] border-[#1E1B18] bg-[#EDE5D3]">
              <button
                type="button"
                onClick={() => !settings.sfxEnabled && toggleSfx()}
                className={`font-pixel px-2.5 py-1 text-[9px] font-bold border-r-[2px] border-[#1E1B18] cursor-pointer select-none ${
                  settings.sfxEnabled
                    ? 'bg-[#28C76F] text-white'
                    : 'bg-[#EDE5D3] text-[#1E1B18] opacity-60'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => settings.sfxEnabled && toggleSfx()}
                className={`font-pixel px-2.5 py-1 text-[9px] font-bold cursor-pointer select-none ${
                  !settings.sfxEnabled
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#EDE5D3] text-[#1E1B18] opacity-60'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* 3. COLORBLIND */}
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[10px] font-bold text-[#1E1B18] tracking-wide">
              COLORBLIND
            </span>
            <div className="flex border-[3px] border-[#1E1B18] bg-[#EDE5D3]">
              <button
                type="button"
                onClick={() => !settings.colorblindMode && toggleColorblindMode()}
                className={`font-pixel px-2.5 py-1 text-[9px] font-bold border-r-[2px] border-[#1E1B18] cursor-pointer select-none ${
                  settings.colorblindMode
                    ? 'bg-[#28C76F] text-white'
                    : 'bg-[#EDE5D3] text-[#1E1B18] opacity-60'
                }`}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => settings.colorblindMode && toggleColorblindMode()}
                className={`font-pixel px-2.5 py-1 text-[9px] font-bold cursor-pointer select-none ${
                  !settings.colorblindMode
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#EDE5D3] text-[#1E1B18] opacity-60'
                }`}
              >
                OFF
              </button>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="w-full border-t-[3px] border-dashed border-[#1E1B18] my-1 opacity-70" />

          {/* Double-Tap Reset Progress */}
          <div className="flex flex-col items-center w-full">
            <button
              type="button"
              onClick={handleResetTap}
              className={`w-full py-2.5 px-2 border-[3px] border-[#1E1B18] shadow-[2px_2px_0px_#1E1B18] pixel-btn flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-75 ${
                resetStage === 'confirm'
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#EDE5D3] text-[#1E1B18]'
              }`}
            >
              <WarningIcon size={15} />
              <span className="font-pixel text-[9px] font-bold tracking-tight">
                RESET PROGRESS
              </span>
            </button>

            <div className="h-5 flex items-center justify-center mt-2">
              {resetStage !== 'idle' && (
                <span className="font-pixel text-[7.5px] font-bold text-[#EF4444] tracking-tight leading-none animate-pulse">
                  {resetStage === 'confirm'
                    ? 'TAP AGAIN TO CONFIRM'
                    : 'PROGRESS CLEARED!'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

