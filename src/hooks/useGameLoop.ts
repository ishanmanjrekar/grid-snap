import { useEffect, useRef } from 'react';

/**
 * useGameLoop Hook
 * 
 * Provides a highly performant, requestAnimationFrame-based game loop.
 * Captures callback in a mutable ref to prevent tearing down the loop on inline callback changes.
 * Clamps maximum delta time to prevent physics clipping on lag spikes.
 */
export function useGameLoop(callback: (deltaTime: number) => void, maxDeltaTime: number = 100) {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  
  // Keep callback reference updated without triggering re-effects
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        // Calculate and clamp delta time (in ms) to avoid extreme updates during lag spikes
        const deltaTime = Math.min(time - previousTimeRef.current, maxDeltaTime);
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = undefined;
    };
  }, [maxDeltaTime]);
}
