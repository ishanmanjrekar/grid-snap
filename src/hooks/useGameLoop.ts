import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { audioManager } from '../audio/AudioManager';
import { useGameStore } from '../store/gameStore';

/**
 * Manages the frame-accurate stage countdown timer (`requestAnimationFrame`),
 * periodic life regeneration sync, background `visibilitychange` auto-pause,
 * and Android hardware back-button handling.
 */
export function useGameLoop(): void {
  const activeScreen = useGameStore((s) => s.activeScreen);
  const activeModal = useGameStore((s) => s.activeModal);
  const isTimerFrozen = useGameStore((s) => s.isTimerFrozen);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const openModal = useGameStore((s) => s.openModal);
  const closeModal = useGameStore((s) => s.closeModal);
  const navigateTo = useGameStore((s) => s.navigateTo);
  const syncLifeRegeneration = useGameStore((s) => s.syncLifeRegeneration);

  // 1. Live stage countdown loop
  useEffect(() => {
    if (activeScreen !== 'playing' || activeModal !== 'none' || isTimerFrozen) {
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.25, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      tickTimer(dt);
      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [activeScreen, activeModal, isTimerFrozen, tickTimer]);

  // 2. Heart regeneration tick every 1 second
  useEffect(() => {
    syncLifeRegeneration();
    const id = window.setInterval(() => {
      syncLifeRegeneration();
    }, 1000);
    return () => window.clearInterval(id);
  }, [syncLifeRegeneration]);

  // 3. Auto-pause & audio suspend when tab/app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioManager.suspendOnHide();
        const st = useGameStore.getState();
        if (st.activeScreen === 'playing' && st.activeModal === 'none') {
          st.openModal('pause');
        }
      } else {
        audioManager.resumeOnShow();
        useGameStore.getState().syncLifeRegeneration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 4. Android Hardware Back Button listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapApp.addListener('backButton', () => {
      const st = useGameStore.getState();
      if (st.activeModal === 'settings' || st.activeModal === 'pause') {
        closeModal();
      } else if (st.activeScreen === 'playing' && st.activeModal === 'none') {
        openModal('pause');
      } else if (st.activeScreen === 'store') {
        navigateTo('menu');
      }
    });

    return () => {
      void listenerPromise.then((h) => h.remove());
    };
  }, [closeModal, navigateTo, openModal]);
}
