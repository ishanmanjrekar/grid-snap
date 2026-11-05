import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { audioManager } from '../audio/AudioManager';
import economyConfig from '../config/economy.json';
import levelsData from '../config/levels.json';
import {
  applyShiftAction,
  getLevelConfig,
  getSnapProgress,
  hydrateLevelColors,
} from '../engine/grid';
import { solveIDAStar } from '../engine/solver';
import type {
  BlockColor,
  CellBlock,
  EconomyConfig,
  LevelConfig,
  ShiftAction,
} from '../engine/types';
import { fetchLiveGameConfigs } from '../utils/remoteData';

export type ScreenView = 'menu' | 'playing' | 'store';

export type ModalType =
  | 'none'
  | 'tutorial'
  | 'pause'
  | 'level_complete'
  | 'out_of_time'
  | 'settings';

export interface GameState {
  // Persisted Player Progression & Economy (`grid-snap-save`, version: 1)
  coins: number;
  lives: number;
  lastLifeRegenAt: number;
  unlockedLevel: number;
  levelStars: Record<number, 1 | 2 | 3>;
  hasSeenTutorial: boolean;
  settings: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    colorblindMode: boolean;
  };

  // Live Remote-Hydrated Configs (Initialized to bundled JSON fallbacks; never persisted to localStorage)
  levels: LevelConfig[];
  economy: EconomyConfig;

  // Ephemeral Navigation & Active Level Session (Never persisted to localStorage)
  isGameStarted: boolean;
  activeScreen: ScreenView;
  activeModal: ModalType;
  activeLevelId: number;
  rows: number;
  cols: number;
  grid: CellBlock[][];
  frames: (BlockColor | null)[][];
  timeLimitSeconds: number;
  timeRemaining: number;
  shiftsCount: number;
  escrowActive: boolean;
  livesBeforeStart: number;
  cachedSolution: ShiftAction[];
  activeHint: ShiftAction | null;
  lastRewardCoins: number;
  lastEarnedStars: 1 | 2 | 3;

  // Developer Debug State (Inactive in Itch builds)
  isDebugOpen: boolean;
  isTimerFrozen: boolean;
}

export interface GameActions {
  // Navigation & Lifecycle
  syncRemoteConfigs: () => Promise<void>;
  startGame: () => void;
  navigateTo: (screen: ScreenView) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  startLevel: (levelId?: number) => boolean;
  dismissTutorial: () => void;

  // Board & Timer Actions
  performShift: (action: ShiftAction) => void;
  tickTimer: (deltaSeconds: number) => void;
  forfeitAndReturnToMenu: () => void;

  // In-Game Boosters & Rescue
  useHintBooster: () => boolean;
  useExtraTimeBooster: () => boolean;
  useOutOfTimeRescue: () => boolean;

  // Economy, Heart Regen & Frictionless Ko-fi Store
  syncLifeRegeneration: () => void;
  claimKoFiStorePack: (packId: string) => { label: string } | null;

  // Settings & Reset
  toggleMusic: () => void;
  toggleSfx: () => void;
  toggleColorblindMode: () => void;
  resetAllProgress: () => void;

  // Debug Actions (No-op when VITE_DISABLE_DEBUG === 'true')
  toggleDebugPanel: () => void;
  devCheatInstantWin: () => void;
  devCheatSkipToLevel: (levelId: number) => void;
  devCheatAddCoins: (amount: number) => void;
  devCheatAdjustLives: (delta: number) => void;
  devCheatRefillTime: () => void;
  devCheatToggleFreezeTimer: () => void;
}

export type GameStore = GameState & GameActions;

const bundledLevels = levelsData as unknown as LevelConfig[];
const bundledEconomy = economyConfig as unknown as EconomyConfig;

export function openExternalUrl(url: string): void {
  if (Capacitor.isNativePlatform()) {
    void Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
}

export function evaluateStarsFromRatio(
  ratio: number,
  thresholds = bundledEconomy.starThresholds
): 1 | 2 | 3 {
  if (ratio > thresholds.threeStarMinRatio) {
    return 3;
  }
  if (ratio >= thresholds.twoStarMinRatio) {
    return 2;
  }
  return 1;
}

const initialPersistedSlice = {
  coins: bundledEconomy.startingCoins,
  lives: bundledEconomy.startingLives,
  lastLifeRegenAt: Date.now(),
  unlockedLevel: 1,
  levelStars: {} as Record<number, 1 | 2 | 3>,
  hasSeenTutorial: false,
  settings: {
    musicEnabled: true,
    sfxEnabled: true,
    colorblindMode: false,
  },
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialPersistedSlice,

      // Live remote-hydrated configs (immediately available via bundled fallbacks)
      levels: bundledLevels,
      economy: bundledEconomy,

      // Ephemeral state
      isGameStarted: false,
      activeScreen: 'menu',
      activeModal: 'none',
      activeLevelId: 1,
      rows: 3,
      cols: 3,
      grid: [
        ['neutral', 'neutral', 'neutral'],
        ['neutral', 'neutral', 'neutral'],
        ['neutral', 'neutral', 'neutral'],
      ],
      frames: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      timeLimitSeconds: 30,
      timeRemaining: 30,
      shiftsCount: 0,
      escrowActive: false,
      livesBeforeStart: bundledEconomy.startingLives,
      cachedSolution: [],
      activeHint: null,
      lastRewardCoins: bundledEconomy.levelClearReward,
      lastEarnedStars: 3,
      isDebugOpen: false,
      isTimerFrozen: false,

      syncRemoteConfigs: async () => {
        const { levels, economy } = await fetchLiveGameConfigs(
          bundledLevels,
          bundledEconomy
        );
        set({
          levels,
          economy,
          lastRewardCoins: economy.levelClearReward,
        });
      },

      startGame: () => {
        const state = get();
        state.syncLifeRegeneration();
        audioManager.unlock();
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: state.activeModal !== 'none',
        });
        audioManager.playSfx('button_tap');
        audioManager.setMusicTrack('menu');
        set({ isGameStarted: true });
      },

      navigateTo: (screen) => {
        const state = get();
        state.syncLifeRegeneration();
        audioManager.playSfx('button_tap');
        audioManager.setMusicTrack(screen === 'playing' ? 'gameplay' : 'menu');
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: false,
        });
        set({
          activeScreen: screen,
          activeModal: 'none',
        });
      },

      openModal: (modal) => {
        const state = get();
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: modal !== 'none',
        });
        set({ activeModal: modal });
      },

      closeModal: () => {
        const state = get();
        audioManager.playSfx('button_tap');
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: false,
        });
        set({ activeModal: 'none' });
      },

      startLevel: (levelId) => {
        const state = get();
        state.syncLifeRegeneration();
        const refreshed = get();
        const eco = refreshed.economy;

        if (refreshed.lives <= 0) {
          audioManager.playSfx('error_buzz');
          set({ activeScreen: 'store', activeModal: 'none' });
          return false;
        }

        const targetId = levelId ?? refreshed.unlockedLevel;
        const levelCfg = getLevelConfig(
          targetId,
          refreshed.levels,
          eco.campaignLoopSize
        );
        const hydrated = hydrateLevelColors(levelCfg);
        const initialSolve = solveIDAStar(hydrated.grid, hydrated.frames, 120, 6);

        const livesBefore = refreshed.lives;
        const nextLives = Math.max(0, livesBefore - 1);
        const nextRegenAt =
          livesBefore >= eco.maxLives && nextLives < eco.maxLives
            ? Date.now()
            : refreshed.lastLifeRegenAt;

        const showTutorial = targetId === 1 && !refreshed.hasSeenTutorial;

        audioManager.playSfx('button_tap');
        audioManager.setMusicTrack('gameplay');
        audioManager.syncSettings({
          ...refreshed.settings,
          isModalOpen: showTutorial,
        });

        set({
          lives: nextLives,
          lastLifeRegenAt: nextRegenAt,
          livesBeforeStart: livesBefore,
          escrowActive: true,
          activeScreen: 'playing',
          activeModal: showTutorial ? 'tutorial' : 'none',
          activeLevelId: targetId,
          rows: levelCfg.rows,
          cols: levelCfg.cols,
          grid: hydrated.grid,
          frames: hydrated.frames,
          timeLimitSeconds: levelCfg.timeLimitSeconds,
          timeRemaining: levelCfg.timeLimitSeconds,
          shiftsCount: 0,
          cachedSolution: initialSolve.actions,
          activeHint: null,
        });

        return true;
      },

      dismissTutorial: () => {
        const state = get();
        audioManager.playSfx('button_tap');
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: false,
        });
        set({
          hasSeenTutorial: true,
          activeModal: 'none',
        });
      },

      performShift: (action) => {
        const state = get();
        if (state.activeScreen !== 'playing' || state.activeModal !== 'none') return;

        const eco = state.economy;
        const prevSnap = getSnapProgress(state.grid, state.frames);
        const nextGrid = applyShiftAction(state.grid, action);
        const nextSnap = getSnapProgress(nextGrid, state.frames);
        const nextShifts = state.shiftsCount + 1;

        if (nextSnap.isSolved && state.timeRemaining > 0) {
          // Win! Refund escrowed heart up to max(maxLives, livesBeforeStart) and award +200 Coins
          const ratio = state.timeRemaining / Math.max(1, state.timeLimitSeconds);
          const earnedStars = evaluateStarsFromRatio(ratio, eco.starThresholds);
          const rewardCoins = eco.levelClearReward;
          const refundedLives = state.escrowActive
            ? Math.min(
                Math.max(eco.maxLives, state.livesBeforeStart),
                state.lives + 1
              )
            : state.lives;

          const prevBest = state.levelStars[state.activeLevelId] ?? 0;
          const nextStarsMap = {
            ...state.levelStars,
            [state.activeLevelId]: Math.max(prevBest, earnedStars) as 1 | 2 | 3,
          };

          const nextUnlocked = Math.max(state.unlockedLevel, state.activeLevelId + 1);

          audioManager.playSfx('level_win');
          audioManager.syncSettings({
            ...state.settings,
            isModalOpen: true,
          });

          set({
            grid: nextGrid,
            shiftsCount: nextShifts,
            activeHint: null,
            cachedSolution: [],
            escrowActive: false,
            lives: refundedLives,
            coins: state.coins + rewardCoins,
            levelStars: nextStarsMap,
            unlockedLevel: nextUnlocked,
            lastRewardCoins: rewardCoins,
            lastEarnedStars: earnedStars,
            activeModal: 'level_complete',
          });
          return;
        }

        if (nextSnap.matchedSlots > prevSnap.matchedSlots) {
          audioManager.playSfx('frame_snap');
        } else {
          audioManager.playSfx('shift_commit');
        }

        // Update cachedSolution in O(1) if player followed the first step, otherwise clear
        let nextCached: ShiftAction[] = [];
        if (
          state.cachedSolution.length > 0 &&
          state.cachedSolution[0].axis === action.axis &&
          state.cachedSolution[0].index === action.index &&
          state.cachedSolution[0].direction === action.direction &&
          state.cachedSolution[0].distance === action.distance
        ) {
          nextCached = state.cachedSolution.slice(1);
        }

        set({
          grid: nextGrid,
          shiftsCount: nextShifts,
          activeHint: null,
          cachedSolution: nextCached,
        });
      },

      tickTimer: (deltaSeconds) => {
        const state = get();
        if (
          state.activeScreen !== 'playing' ||
          state.activeModal !== 'none' ||
          state.isTimerFrozen
        ) {
          return;
        }

        const prevWholeSecond = Math.ceil(state.timeRemaining);
        const nextTime = Math.max(0, state.timeRemaining - deltaSeconds);
        const nextWholeSecond = Math.ceil(nextTime);

        if (nextTime <= 0) {
          audioManager.playSfx('level_timeout');
          audioManager.syncSettings({
            ...state.settings,
            isModalOpen: true,
          });
          set({
            timeRemaining: 0,
            activeModal: 'out_of_time',
            activeHint: null,
          });
          return;
        }

        if (
          nextWholeSecond < prevWholeSecond &&
          nextWholeSecond <= 10 &&
          nextWholeSecond > 0
        ) {
          audioManager.playSfx('timer_warn');
        }

        set({ timeRemaining: nextTime });
      },

      forfeitAndReturnToMenu: () => {
        const state = get();
        state.syncLifeRegeneration();
        audioManager.playSfx('button_tap');
        audioManager.setMusicTrack('menu');
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: false,
        });
        // Escrowed heart remains deducted; unlockedLevel stays unchanged so player can retry
        set({
          escrowActive: false,
          activeScreen: 'menu',
          activeModal: 'none',
          activeHint: null,
        });
      },

      useHintBooster: () => {
        const state = get();
        const cost = state.economy.boosters.hintCostCoins;
        if (state.activeHint !== null || state.coins < cost) {
          audioManager.playSfx('error_buzz');
          return false;
        }

        let solution = state.cachedSolution;
        if (solution.length === 0) {
          const solved = solveIDAStar(state.grid, state.frames, 150, 6);
          solution = solved.actions;
        }

        const nextMove = solution[0] ?? null;
        if (!nextMove) {
          return false;
        }

        audioManager.playSfx('hint_activate');
        set({
          coins: state.coins - cost,
          cachedSolution: solution,
          activeHint: nextMove,
        });
        return true;
      },

      useExtraTimeBooster: () => {
        const state = get();
        const cost = state.economy.boosters.extraTimeCostCoins;
        if (
          state.coins < cost ||
          state.timeRemaining >= state.timeLimitSeconds
        ) {
          audioManager.playSfx('error_buzz');
          return false;
        }

        const nextTime = Math.min(
          state.timeLimitSeconds,
          state.timeRemaining + state.economy.boosters.extraTimeSeconds
        );
        audioManager.playSfx('extra_time');
        set({
          coins: state.coins - cost,
          timeRemaining: nextTime,
        });
        return true;
      },

      useOutOfTimeRescue: () => {
        const state = get();
        const cost = state.economy.boosters.reviveCostCoins;
        if (state.coins < cost) {
          audioManager.playSfx('error_buzz');
          return false;
        }

        const restoredTime = Math.min(
          state.economy.boosters.reviveSeconds,
          state.timeLimitSeconds
        );
        audioManager.playSfx('extra_time');
        audioManager.syncSettings({
          ...state.settings,
          isModalOpen: false,
        });

        set({
          coins: state.coins - cost,
          timeRemaining: restoredTime,
          activeModal: 'none',
        });
        return true;
      },

      syncLifeRegeneration: () => {
        const state = get();
        const now = Date.now();
        const maxLives = state.economy.maxLives;
        const intervalMs = state.economy.lifeRegenIntervalSeconds * 1000;

        if (state.lives >= maxLives) {
          set({ lastLifeRegenAt: now });
          return;
        }

        const elapsed = now - state.lastLifeRegenAt;
        if (elapsed >= intervalMs) {
          const gained = Math.floor(elapsed / intervalMs);
          const nextLives = Math.min(maxLives, state.lives + gained);
          const remainder = elapsed % intervalMs;
          const nextTimestamp = nextLives >= maxLives ? now : now - remainder;
          set({
            lives: nextLives,
            lastLifeRegenAt: nextTimestamp,
          });
        }
      },

      claimKoFiStorePack: (packId) => {
        const state = get();
        const pack = state.economy.storePacks.find((p) => p.id === packId);
        if (!pack) return null;

        openExternalUrl(pack.kofiUrl);
        audioManager.playSfx('store_buy');

        set((s) => ({
          lives: pack.type === 'lives' ? s.lives + pack.amount : s.lives,
          coins: pack.type === 'coins' ? s.coins + pack.amount : s.coins,
        }));

        return { label: pack.toastMessage };
      },

      toggleMusic: () => {
        const state = get();
        const nextSettings = {
          ...state.settings,
          musicEnabled: !state.settings.musicEnabled,
        };
        audioManager.playSfx('button_tap');
        audioManager.syncSettings({
          ...nextSettings,
          isModalOpen: state.activeModal !== 'none',
        });
        set({ settings: nextSettings });
      },

      toggleSfx: () => {
        const state = get();
        const nextSettings = {
          ...state.settings,
          sfxEnabled: !state.settings.sfxEnabled,
        };
        audioManager.syncSettings({
          ...nextSettings,
          isModalOpen: state.activeModal !== 'none',
        });
        if (nextSettings.sfxEnabled) {
          audioManager.playSfx('button_tap');
        }
        set({ settings: nextSettings });
      },

      toggleColorblindMode: () => {
        const state = get();
        const nextSettings = {
          ...state.settings,
          colorblindMode: !state.settings.colorblindMode,
        };
        audioManager.playSfx('button_tap');
        set({ settings: nextSettings });
      },

      resetAllProgress: () => {
        const state = get();
        audioManager.playSfx('button_tap');
        set({
          ...initialPersistedSlice,
          coins: state.economy.startingCoins,
          lives: state.economy.startingLives,
          lastLifeRegenAt: Date.now(),
          activeScreen: 'menu',
          activeModal: 'none',
          escrowActive: false,
        });
      },

      toggleDebugPanel: () => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        set((s) => ({ isDebugOpen: !s.isDebugOpen }));
      },

      devCheatInstantWin: () => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        const state = get();
        if (state.activeScreen !== 'playing') return;
        const eco = state.economy;
        const solvedGrid: CellBlock[][] = state.frames.map((row) =>
          row.map((f) => (f === null ? 'neutral' : f))
        );
        const refundedLives = state.escrowActive
          ? Math.min(
              Math.max(eco.maxLives, state.livesBeforeStart),
              state.lives + 1
            )
          : state.lives;
        const nextUnlocked = Math.max(state.unlockedLevel, state.activeLevelId + 1);

        audioManager.playSfx('level_win');
        set({
          grid: solvedGrid,
          escrowActive: false,
          lives: refundedLives,
          coins: state.coins + eco.levelClearReward,
          levelStars: { ...state.levelStars, [state.activeLevelId]: 3 },
          unlockedLevel: nextUnlocked,
          lastRewardCoins: eco.levelClearReward,
          lastEarnedStars: 3,
          activeModal: 'level_complete',
          isDebugOpen: false,
        });
      },

      devCheatSkipToLevel: (levelId) => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        const safeId = Math.max(1, Math.floor(levelId));
        const state = get();
        // Refund current escrow before jumping
        if (state.escrowActive) {
          set({ lives: state.lives + 1, escrowActive: false });
        }
        set({ unlockedLevel: safeId, isDebugOpen: false });
        get().startLevel(safeId);
      },

      devCheatAddCoins: (amount) => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        set((s) => ({ coins: Math.max(0, s.coins + amount) }));
      },

      devCheatAdjustLives: (delta) => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        set((s) => ({
          lives: Math.max(0, s.lives + delta),
          lastLifeRegenAt: Date.now(),
        }));
      },

      devCheatRefillTime: () => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        set((s) => ({ timeRemaining: s.timeLimitSeconds }));
      },

      devCheatToggleFreezeTimer: () => {
        if (import.meta.env.VITE_DISABLE_DEBUG === 'true') return;
        set((s) => ({ isTimerFrozen: !s.isTimerFrozen }));
      },
    }),
    {
      name: 'grid-snap-save',
      version: 1,
      partialize: (state) => ({
        coins: state.coins,
        lives: state.lives,
        lastLifeRegenAt: state.lastLifeRegenAt,
        unlockedLevel: state.unlockedLevel,
        levelStars: state.levelStars,
        hasSeenTutorial: state.hasSeenTutorial,
        settings: state.settings,
      }),
      migrate: (persistedState) => persistedState as GameStore,
    }
  )
);
