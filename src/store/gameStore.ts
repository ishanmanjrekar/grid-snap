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
  LevelConfig,
  ShiftAction,
} from '../engine/types';

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

const typedLevels = levelsData as unknown as LevelConfig[];

export function openExternalUrl(url: string): void {
  if (Capacitor.isNativePlatform()) {
    void Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
}

export function evaluateStarsFromRatio(ratio: number): 1 | 2 | 3 {
  if (ratio > economyConfig.starThresholds.threeStarMinRatio) {
    return 3;
  }
  if (ratio >= economyConfig.starThresholds.twoStarMinRatio) {
    return 2;
  }
  return 1;
}

const initialPersistedSlice = {
  coins: economyConfig.startingCoins,
  lives: economyConfig.startingLives,
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
      livesBeforeStart: economyConfig.startingLives,
      cachedSolution: [],
      activeHint: null,
      lastRewardCoins: economyConfig.levelClearReward,
      lastEarnedStars: 3,
      isDebugOpen: false,
      isTimerFrozen: false,

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

        if (refreshed.lives <= 0) {
          audioManager.playSfx('error_buzz');
          set({ activeScreen: 'store', activeModal: 'none' });
          return false;
        }

        const targetId = levelId ?? refreshed.unlockedLevel;
        const levelCfg = getLevelConfig(
          targetId,
          typedLevels,
          economyConfig.campaignLoopSize
        );
        const hydrated = hydrateLevelColors(levelCfg);
        const initialSolve = solveIDAStar(hydrated.grid, hydrated.frames, 120, 6);

        const livesBefore = refreshed.lives;
        const nextLives = Math.max(0, livesBefore - 1);
        const nextRegenAt =
          livesBefore >= economyConfig.maxLives && nextLives < economyConfig.maxLives
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

        const prevSnap = getSnapProgress(state.grid, state.frames);
        const nextGrid = applyShiftAction(state.grid, action);
        const nextSnap = getSnapProgress(nextGrid, state.frames);
        const nextShifts = state.shiftsCount + 1;

        if (nextSnap.isSolved && state.timeRemaining > 0) {
          // Win! Refund escrowed heart up to max(maxLives, livesBeforeStart) and award +200 Coins
          const ratio = state.timeRemaining / Math.max(1, state.timeLimitSeconds);
          const earnedStars = evaluateStarsFromRatio(ratio);
          const rewardCoins = economyConfig.levelClearReward;
          const refundedLives = state.escrowActive
            ? Math.min(
                Math.max(economyConfig.maxLives, state.livesBeforeStart),
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
        const cost = economyConfig.boosters.hintCostCoins;
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
        const cost = economyConfig.boosters.extraTimeCostCoins;
        if (
          state.coins < cost ||
          state.timeRemaining >= state.timeLimitSeconds
        ) {
          audioManager.playSfx('error_buzz');
          return false;
        }

        const nextTime = Math.min(
          state.timeLimitSeconds,
          state.timeRemaining + economyConfig.boosters.extraTimeSeconds
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
        const cost = economyConfig.boosters.reviveCostCoins;
        if (state.coins < cost) {
          audioManager.playSfx('error_buzz');
          return false;
        }

        const restoredTime = Math.min(
          economyConfig.boosters.reviveSeconds,
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
        const maxLives = economyConfig.maxLives;
        const intervalMs = economyConfig.lifeRegenIntervalSeconds * 1000;

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
        const pack = economyConfig.storePacks.find((p) => p.id === packId);
        if (!pack) return null;

        openExternalUrl(pack.kofiUrl);
        audioManager.playSfx('store_buy');

        set((state) => ({
          lives: pack.type === 'lives' ? state.lives + pack.amount : state.lives,
          coins: pack.type === 'coins' ? state.coins + pack.amount : state.coins,
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
        audioManager.playSfx('button_tap');
        set({
          ...initialPersistedSlice,
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
        const solvedGrid: CellBlock[][] = state.frames.map((row) =>
          row.map((f) => (f === null ? 'neutral' : f))
        );
        const refundedLives = state.escrowActive
          ? Math.min(
              Math.max(economyConfig.maxLives, state.livesBeforeStart),
              state.lives + 1
            )
          : state.lives;
        const nextUnlocked = Math.max(state.unlockedLevel, state.activeLevelId + 1);

        audioManager.playSfx('level_win');
        set({
          grid: solvedGrid,
          escrowActive: false,
          lives: refundedLives,
          coins: state.coins + economyConfig.levelClearReward,
          levelStars: { ...state.levelStars, [state.activeLevelId]: 3 },
          unlockedLevel: nextUnlocked,
          lastRewardCoins: economyConfig.levelClearReward,
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
