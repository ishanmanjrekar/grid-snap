import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  score: number;
  level: number;
  addScore: (points: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      score: 0,
      level: 1,
      addScore: (points) => set((state) => ({ score: state.score + points })),
      resetGame: () => set({ score: 0, level: 1 }),
    }),
    {
      name: 'game-storage',
    }
  )
);
