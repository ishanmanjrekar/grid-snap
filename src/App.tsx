import { BoundingBox } from './components/BoundingBox';
import { useGameStore } from './store/gameStore';

export function App() {
  const { score, level, addScore } = useGameStore();

  return (
    <BoundingBox width={450} height={800}>
      <div className="game-container" style={{ padding: '16px', backgroundColor: '#111125', color: '#ffffff' }}>
        {/* Bolted Top HUD */}
        <header style={{ flex: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>LEVEL {level}</span>
          <span>SCORE: {score}</span>
        </header>

        {/* Elastic Center Stage */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 7cqw, 2.5rem)', textAlign: 'center' }}>
            Game Ready
          </h1>
          <button
            onClick={() => addScore(10)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#e9c400',
              color: '#000000',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            TAP TO SCORE (+10)
          </button>
        </main>

        {/* Bolted Bottom Footer */}
        <footer style={{ flex: 'none', textAlign: 'center', fontSize: '12px', opacity: 0.7 }}>
          Portable 2D Game Harness
        </footer>
      </div>
    </BoundingBox>
  );
}

export default App;
