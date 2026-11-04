import React, { Suspense } from 'react';
import { BoundingBox } from './components/BoundingBox';
import { LevelCompleteModal } from './components/modals/LevelCompleteModal';
import { OutOfTimeModal } from './components/modals/OutOfTimeModal';
import { PauseModal } from './components/modals/PauseModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { TutorialOverlay } from './components/modals/TutorialOverlay';
import { InGameView } from './components/screens/InGameView';
import { ItemStoreView } from './components/screens/ItemStoreView';
import { MainMenuView } from './components/screens/MainMenuView';
import { SplashScreen } from './components/SplashScreen';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameStore } from './store/gameStore';

const LazyDebugPanel =
  import.meta.env.VITE_DISABLE_DEBUG === 'true'
    ? null
    : React.lazy(() => import('./components/DebugPanel'));

export function App() {
  useGameLoop();

  const activeScreen = useGameStore((s) => s.activeScreen);
  const activeModal = useGameStore((s) => s.activeModal);

  return (
    <BoundingBox width={450} height={800}>
      <div className="game-container">
        {/* Active Screen View */}
        {activeScreen === 'menu' && <MainMenuView />}
        {activeScreen === 'playing' && <InGameView />}
        {activeScreen === 'store' && <ItemStoreView />}

        {/* Modal Overlays */}
        {activeModal === 'tutorial' && <TutorialOverlay />}
        {activeModal === 'pause' && <PauseModal />}
        {activeModal === 'level_complete' && <LevelCompleteModal />}
        {activeModal === 'out_of_time' && <OutOfTimeModal />}
        {activeModal === 'settings' && <SettingsModal />}

        {/* Developer Debug Panel (Excluded in Itch builds) */}
        {LazyDebugPanel && (
          <Suspense fallback={null}>
            <LazyDebugPanel />
          </Suspense>
        )}

        {/* Boot Splash Screen Overlay (z-index: 100) */}
        <SplashScreen />
      </div>
    </BoundingBox>
  );
}

export default App;
