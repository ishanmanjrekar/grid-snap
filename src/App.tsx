import { BoundingBox } from './components/BoundingBox';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameStore } from './store/gameStore';

export function App() {
  useGameLoop();
  const unlockedLevel = useGameStore((s) => s.unlockedLevel);
  const coins = useGameStore((s) => s.coins);
  const lives = useGameStore((s) => s.lives);

  return (
    <BoundingBox width={450} height={800}>
      <div className="game-container p-4 flex flex-col items-center justify-center gap-4">
        <h1 className="font-pixel text-lg text-center">GRID SNAP</h1>
        <p className="font-retro text-xs text-center">
          Level {unlockedLevel} · Coins: {coins} · Lives: {lives}
        </p>
      </div>
    </BoundingBox>
  );
}

export default App;
