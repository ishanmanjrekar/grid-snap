import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { HeartIcon, StorefrontIcon } from '../PixelIcons';
import { useLifeRegenDisplay } from './MainMenuView';

export const ItemStoreView: React.FC = () => {
  const coins = useGameStore((s) => s.coins);
  const lives = useGameStore((s) => s.lives);
  const claimKoFiStorePack = useGameStore((s) => s.claimKoFiStorePack);
  const navigateTo = useGameStore((s) => s.navigateTo);

  const { isFull, timerText } = useLifeRegenDisplay();
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
    }, 1600);
  };

  const handleBuyPack = (packId: string) => {
    const res = claimKoFiStorePack(packId);
    if (res) {
      showToast(res.label);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#FFF8F5] text-[#2C2523] px-3.5 py-3 select-none overflow-hidden gap-2.5">
      {/* 1. TOP HUD BAR */}
      <div className="flex items-center justify-between w-full gap-2 flex-none">
        {/* Coin Capsule */}
        <div className="flex items-center">
          <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-2.5 py-1.5 border-[2.5px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523]">
            <div className="w-4 h-4 bg-[#FBBF24] border-[1.5px] border-[#2C2523] flex items-center justify-center text-[8px] font-pixel font-bold text-[#2C2523] leading-none">
              $
            </div>
            <span
              id="player-coins"
              className="font-pixel text-[10px] text-[#2C2523] tracking-tight"
            >
              {coins.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => showToast('+ SELECT A PACK BELOW!')}
            className="w-7 h-7 bg-[#FBBF24] hover:bg-[#F59E0B] border-[2.5px] border-l-0 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] flex items-center justify-center text-[#2C2523] font-pixel text-xs font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Heart / Lives Capsule */}
        <div className="flex items-center">
          <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-2.5 py-1.5 border-[2.5px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523]">
            <HeartIcon size={14} />
            <span
              id="player-lives"
              className="font-pixel text-[9px] text-[#2C2523]"
            >
              {lives}
            </span>
            <span className="font-pixel text-[8px] text-[#817661]">|</span>
            <span
              className={`font-pixel text-[8px] tracking-tighter ${
                isFull ? 'text-[#15803D] font-bold' : 'text-[#817661]'
              }`}
            >
              {timerText}
            </span>
          </div>
          <button
            type="button"
            onClick={() => showToast('+ SELECT A PACK BELOW!')}
            className="w-7 h-7 bg-[#10B981] hover:bg-[#059669] border-[2.5px] border-l-0 border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] flex items-center justify-center text-[#FFFFFF] font-pixel text-xs font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* 2. STORE HEADER BANNER */}
      <div className="relative w-full bg-[#FBBF24] border-[3px] border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] p-2.5 flex items-center justify-between flex-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2C2523] flex items-center justify-center">
            <StorefrontIcon size={18} />
          </div>
          <span className="font-pixel text-[12px] text-[#2C2523] font-bold tracking-wider">
            ITEM STORE
          </span>
        </div>
      </div>

      {/* 3. SECTION 1: GET LIVES (No right-side EXTRA TRY badge per override) */}
      <div className="w-full bg-[#FBF2EE] border-[3px] border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] p-2.5 flex flex-col gap-2">
        <div className="flex items-center bg-[#EF4444] text-[#FFFFFF] px-2 py-1.5 border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523]">
          <div className="flex items-center gap-1.5">
            <svg
              className="drop-shadow-[1px_1px_0_#2C2523] flex-shrink-0"
              fill="none"
              height="14"
              viewBox="0 0 14 13"
              width="15"
            >
              <path
                d="M2 1h3v1h1v1h2V2h1V1h3v1h1v3h-1v2h-1v1h-1v1h-1v1h-1v1h-2v-1H5v-1H4V8H3V7H2V5H1V2h1V1z"
                fill="#FFFFFF"
              />
              <path d="M3 2h2v1H3V2zm6 0h2v1H9V2z" fill="#FEF08A" />
            </svg>
            <span className="font-pixel text-[10px] font-bold tracking-wide leading-none">
              GET LIVES
            </span>
          </div>
        </div>

        {/* 3-Column Lives Pack Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Pack 1: 5 LIVES */}
          <div className="bg-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-1.5 flex flex-col justify-between items-center text-center pt-2">
            <div className="h-4 flex items-center">
              <span className="font-pixel text-[8px] text-[#2C2523] leading-none font-bold">
                5 LIVES
              </span>
            </div>
            <div className="my-2 h-10 flex items-center justify-center">
              <svg
                className="drop-shadow-[1px_1px_0_#2C2523]"
                fill="none"
                height="26"
                viewBox="0 0 14 13"
                width="28"
              >
                <path
                  d="M2 1h3v1h1v1h2V2h1V1h3v1h1v3h-1v2h-1v1h-1v1h-1v1h-1v1h-2v-1H5v-1H4V8H3V7H2V5H1V2h1V1z"
                  fill="#EF4444"
                />
                <path d="M3 2h2v1H3V2zm6 0h2v1H9V2z" fill="#FCA5A5" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => handleBuyPack('lives_5')}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] py-1.5 font-pixel text-[8px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              BUY
            </button>
          </div>

          {/* Pack 2: 10 LIVES */}
          <div className="bg-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-1.5 flex flex-col justify-between items-center text-center pt-2">
            <div className="h-4 flex items-center">
              <span className="font-pixel text-[8px] text-[#2C2523] leading-none font-bold">
                10 LIVES
              </span>
            </div>
            <div className="my-2 h-10 flex items-center justify-center relative">
              <svg
                className=" -translate-x-1.5"
                fill="none"
                height="22"
                viewBox="0 0 14 13"
                width="24"
              >
                <path
                  d="M2 1h3v1h1v1h2V2h1V1h3v1h1v3h-1v2h-1v1h-1v1h-1v1h-1v1h-2v-1H5v-1H4V8H3V7H2V5H1V2h1V1z"
                  fill="#EF4444"
                />
                <path d="M3 2h2v1H3V2z" fill="#FCA5A5" />
              </svg>
              <svg
                className="relative z-10 -ml-3 drop-shadow-[1px_1px_0_#2C2523]"
                fill="none"
                height="24"
                viewBox="0 0 14 13"
                width="26"
              >
                <path
                  d="M2 1h3v1h1v1h2V2h1V1h3v1h1v3h-1v2h-1v1h-1v1h-1v1h-1v1h-2v-1H5v-1H4V8H3V7H2V5H1V2h1V1z"
                  fill="#DC2626"
                />
                <path d="M3 2h2v1H3V2zm6 0h2v1H9V2z" fill="#FCA5A5" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => handleBuyPack('lives_10')}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] py-1.5 font-pixel text-[8px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              BUY
            </button>
          </div>

          {/* Pack 3: 20 LIVES */}
          <div className="bg-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-1.5 flex flex-col justify-between items-center text-center pt-2">
            <div className="h-4 flex items-center">
              <span className="font-pixel text-[8px] text-[#2C2523] leading-none font-bold">
                20 LIVES
              </span>
            </div>
            <div className="my-2 h-10 flex items-center justify-center relative">
              <div className="absolute w-8 h-8 bg-[#FEF08A] opacity-40" />
              <svg
                className="relative z-10 drop-shadow-[1px_1px_0_#2C2523]"
                fill="none"
                height="24"
                viewBox="0 0 14 13"
                width="26"
              >
                <path
                  d="M2 1h3v1h1v1h2V2h1V1h3v1h1v3h-1v2h-1v1h-1v1h-1v1h-1v1h-2v-1H5v-1H4V8H3V7H2V5H1V2h1V1z"
                  fill="#B91C1C"
                />
                <path d="M3 2h2v1H3V2zm6 0h2v1H9V2z" fill="#FCA5A5" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => handleBuyPack('lives_20')}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] py-1.5 font-pixel text-[8px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              BUY
            </button>
          </div>
        </div>
      </div>

      {/* 4. SECTION 2: GET COINS (No right-side SPECIALS badge per override) */}
      <div className="w-full bg-[#FBF2EE] border-[3px] border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] p-2.5 flex flex-col gap-2">
        <div className="flex items-center bg-[#FBBF24] text-[#2C2523] px-2 py-1.5 border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523]">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-[#2C2523] flex items-center justify-center font-pixel text-[8px] font-bold text-[#FBBF24] leading-none">
              $
            </div>
            <span className="font-pixel text-[10px] font-bold tracking-wide leading-none">
              GET COINS
            </span>
          </div>
        </div>

        {/* 3-Column Coin Pack Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Coin Pack 1: 500 C */}
          <div className="bg-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-1.5 flex flex-col justify-between items-center text-center pt-2">
            <div className="h-4 flex items-center">
              <span className="font-pixel text-[8px] text-[#2C2523] leading-none font-bold">
                500 C
              </span>
            </div>
            <div className="my-2 h-10 flex items-center justify-center">
              <svg
                className="drop-shadow-[1px_1px_0_#2C2523]"
                fill="none"
                height="28"
                viewBox="0 0 16 16"
                width="28"
              >
                <rect fill="#FBBF24" height="12" width="8" x="4" y="2" />
                <rect fill="#F59E0B" height="10" width="6" x="5" y="3" />
                <rect fill="#FBBF24" height="6" width="4" x="6" y="5" />
                <rect fill="#2C2523" height="4" width="2" x="7" y="6" />
                <rect fill="#D97706" height="2" width="12" x="2" y="5" />
                <rect fill="#2C2523" height="2" width="8" x="4" y="1" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => handleBuyPack('coins_500')}
              className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] text-[#2C2523] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] py-1.5 font-pixel text-[8px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              BUY
            </button>
          </div>

          {/* Coin Pack 2: 1,200 C */}
          <div className="bg-[#FFFFFF] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-1.5 flex flex-col justify-between items-center text-center pt-2">
            <div className="h-4 flex items-center">
              <span className="font-pixel text-[8px] text-[#2C2523] leading-none font-bold">
                1,200 C
              </span>
            </div>
            <div className="my-2 h-10 flex items-center justify-center">
              <svg
                className="drop-shadow-[1px_1px_0_#2C2523]"
                fill="none"
                height="28"
                viewBox="0 0 16 16"
                width="30"
              >
                <rect fill="#FBBF24" height="7" width="6" x="1" y="7" />
                <rect fill="#2C2523" height="1" width="6" x="1" y="9" />
                <rect fill="#2C2523" height="1" width="6" x="1" y="11" />
                <rect fill="#F59E0B" height="10" width="6" x="9" y="4" />
                <rect fill="#2C2523" height="1" width="6" x="9" y="6" />
                <rect fill="#2C2523" height="1" width="6" x="9" y="8" />
                <rect fill="#2C2523" height="1" width="6" x="9" y="10" />
                <rect fill="#2C2523" height="1" width="6" x="9" y="12" />
                <rect fill="#FDE047" height="4" width="6" x="5" y="10" />
                <rect fill="#2C2523" height="1" width="6" x="5" y="12" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => handleBuyPack('coins_1200')}
              className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] text-[#2C2523] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] py-1.5 font-pixel text-[8px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              BUY
            </button>
          </div>

          {/* Coin Pack 3: 5,000 C */}
          <div className="bg-[#FFFFFF] border-[2.5px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-1.5 flex flex-col justify-between items-center text-center pt-2">
            <div className="h-4 flex items-center">
              <span className="font-pixel text-[8px] text-[#2C2523] leading-none font-bold">
                5,000 C
              </span>
            </div>
            <div className="my-2 h-10 flex items-center justify-center">
              <svg
                className="drop-shadow-[1px_1px_0_#2C2523]"
                fill="none"
                height="28"
                viewBox="0 0 16 16"
                width="32"
              >
                <rect fill="#B45309" height="11" width="12" x="2" y="3" />
                <rect fill="#D97706" height="4" width="14" x="1" y="2" />
                <rect fill="#2C2523" height="2" width="12" x="2" y="6" />
                <rect fill="#FBBF24" height="4" width="2" x="7" y="5" />
                <rect fill="#FBBF24" height="3" width="2" x="4" y="3" />
                <rect fill="#FBBF24" height="3" width="2" x="10" y="3" />
                <rect fill="#FBBF24" height="5" width="2" x="4" y="8" />
                <rect fill="#FBBF24" height="5" width="2" x="10" y="8" />
                <rect fill="#FDE047" height="2" width="4" x="6" y="1" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => handleBuyPack('coins_5000')}
              className="w-full bg-[#FBBF24] hover:bg-[#F59E0B] text-[#2C2523] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] py-1.5 font-pixel text-[8px] font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              BUY
            </button>
          </div>
        </div>
      </div>

      {/* 5. INLINE PURCHASE NOTIFICATION TOAST (#toast) */}
      <div
        id="toast"
        className={`transition-opacity duration-200 w-full bg-[#22C55E] border-[2px] border-[#2C2523] shadow-[2px_2px_0_0_#2C2523] p-2 text-center flex-none ${
          toastText ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span
          id="toast-text"
          className="font-pixel text-[8px] text-[#FFFFFF] font-bold tracking-tight"
        >
          {toastText ?? 'PURCHASE SUCCESSFUL!'}
        </span>
      </div>

      {/* 6. BOTTOM DOCKED NAVIGATION (BACK TO MENU) */}
      <div className="w-full mt-auto pt-0.5 flex-none">
        <button
          type="button"
          onClick={() => navigateTo('menu')}
          className="w-full bg-[#ECE3D4] hover:bg-[#E1D8D5] text-[#2C2523] border-[3px] border-[#2C2523] shadow-[3px_3px_0_0_#2C2523] py-3 font-pixel text-[10px] font-bold flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <span className="text-[12px] leading-none">◀</span>
          <span>BACK TO MENU</span>
        </button>
      </div>
    </div>
  );
};

