import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../store/gameStore';

describe('Level 1 FTUE & Tutorial Step-by-Step Flow', () => {
  beforeEach(() => {
    useGameStore.setState({
      coins: 500,
      lives: 5,
      lastLifeRegenAt: Date.now(),
      unlockedLevel: 1,
      levelStars: {},
      hasSeenTutorial: false,
      activeScreen: 'menu',
      activeModal: 'none',
      activeLevelId: 1,
      activeHint: null,
      tutorialStep: 'completed',
      isTimerFrozen: false,
      cachedSolution: [],
    });
  });

  it('starts Level 1 with frozen timer, active first hint, and step1_hint phase', () => {
    const ok = useGameStore.getState().startLevel(1);
    expect(ok).toBe(true);

    const state = useGameStore.getState();
    expect(state.activeScreen).toBe('playing');
    expect(state.activeModal).toBe('none'); // overlay is NOT shown upfront
    expect(state.tutorialStep).toBe('step1_hint');
    expect(state.isTimerFrozen).toBe(true);
    expect(state.activeHint).not.toBeNull();
    expect(state.cachedSolution.length).toBeGreaterThan(0);
  });

  it('rejects moves in step1_hint that do not match the active hint', () => {
    useGameStore.getState().startLevel(1);
    const hint = useGameStore.getState().activeHint!;
    const gridBefore = JSON.stringify(useGameStore.getState().grid);

    // Attempt a move on a different axis or line
    const wrongAction = {
      axis: hint.axis === 'row' ? ('col' as const) : ('row' as const),
      index: (hint.index + 1) % 3,
      direction: hint.direction,
      distance: 1,
    };

    useGameStore.getState().performShift(wrongAction);

    const state = useGameStore.getState();
    expect(state.tutorialStep).toBe('step1_hint');
    expect(state.activeHint).toEqual(hint);
    expect(JSON.stringify(state.grid)).toBe(gridBefore);
  });

  it('advances to tutorial overlay on executing step 1 hint and keeps timer frozen', () => {
    useGameStore.getState().startLevel(1);
    const hint = useGameStore.getState().activeHint!;

    useGameStore.getState().performShift(hint);

    const state = useGameStore.getState();
    expect(state.tutorialStep).toBe('overlay');
    expect(state.activeModal).toBe('tutorial');
    expect(state.activeHint).toBeNull();
    expect(state.isTimerFrozen).toBe(true);
  });

  it('dismissing tutorial overlay transitions to step2_hint, unfreezes timer, and grants free 2nd hint', () => {
    useGameStore.getState().startLevel(1);
    const hint1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(hint1);

    useGameStore.getState().dismissTutorial();

    const state = useGameStore.getState();
    expect(state.activeModal).toBe('none');
    expect(state.tutorialStep).toBe('step2_hint');
    expect(state.isTimerFrozen).toBe(false);
    expect(state.activeHint).not.toBeNull();
    // Coins should NOT be deducted for this free tutorial hint
    expect(state.coins).toBe(500);
  });

  it('completes Level 1 upon executing 2nd hint and awards stars + clear coins', () => {
    useGameStore.getState().startLevel(1);
    const hint1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(hint1);
    useGameStore.getState().dismissTutorial();

    const hint2 = useGameStore.getState().activeHint!;
    expect(hint2).not.toBeNull();

    useGameStore.getState().performShift(hint2);

    const state = useGameStore.getState();
    expect(state.activeModal).toBe('level_complete');
    expect(state.tutorialStep).toBe('completed');
    expect(state.activeHint).toBeNull();
    expect(state.unlockedLevel).toBe(2);
    expect(state.coins).toBe(500 + state.economy.levelClearReward); // 500 starting + levelClearReward
    expect(state.levelStars[1]).toBeDefined();
  });

  it('forfeiting and re-starting Level 1 replays the FTUE', () => {
    useGameStore.getState().startLevel(1);
    useGameStore.getState().forfeitAndReturnToMenu();

    let state = useGameStore.getState();
    expect(state.activeScreen).toBe('menu');
    expect(state.tutorialStep).toBe('completed');
    expect(state.isTimerFrozen).toBe(false);

    // Replay Level 1
    useGameStore.getState().startLevel(1);
    state = useGameStore.getState();
    expect(state.tutorialStep).toBe('step1_hint');
    expect(state.isTimerFrozen).toBe(true);
    expect(state.activeHint).not.toBeNull();
  });

  it('starting Level 2 does not trigger FTUE restrictions', () => {
    useGameStore.getState().startLevel(2);
    const state = useGameStore.getState();

    expect(state.activeLevelId).toBe(2);
    expect(state.tutorialStep).toBe('completed');
    expect(state.isTimerFrozen).toBe(false);
    expect(state.activeHint).toBeNull();
  });
});
