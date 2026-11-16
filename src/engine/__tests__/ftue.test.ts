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
      levelBestTime: {},
      levelLeastMoves: {},
      hasSeenTutorial: false,
      activeScreen: 'menu',
      activeModal: 'none',
      selectedLevelId: 1,
      activeLevelId: 1,
      activeHint: null,
      tutorialStep: 'completed',
      isTimerFrozen: false,
      cachedSolution: [],
      isNewBestTime: false,
      isNewLeastMoves: false,
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
    expect(state.activeHint).toEqual({
      axis: 'col',
      index: 1,
      direction: 'down',
      distance: 1,
    });
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
    expect(state.activeHint).toEqual({
      axis: 'row',
      index: 0,
      direction: 'right',
      distance: 1,
    });
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

  it('replaying Level 1 when unlockedLevel > 1 and hasSeenTutorial is true re-triggers full FTUE', () => {
    useGameStore.setState({
      unlockedLevel: 5,
      selectedLevelId: 5,
      hasSeenTutorial: true,
      levelStars: { 1: 2, 2: 3, 3: 1, 4: 2 },
    });

    useGameStore.getState().selectLevel(1);
    expect(useGameStore.getState().selectedLevelId).toBe(1);

    const ok = useGameStore.getState().startLevel();
    expect(ok).toBe(true);

    let state = useGameStore.getState();
    expect(state.activeLevelId).toBe(1);
    expect(state.tutorialStep).toBe('step1_hint');
    expect(state.isTimerFrozen).toBe(true);
    expect(state.activeHint).not.toBeNull();

    useGameStore.getState().performShift(state.activeHint!);
    state = useGameStore.getState();
    expect(state.tutorialStep).toBe('overlay');
    expect(state.activeModal).toBe('tutorial');

    useGameStore.getState().dismissTutorial();
    state = useGameStore.getState();
    expect(state.tutorialStep).toBe('step2_hint');
    expect(state.isTimerFrozen).toBe(false);
    expect(state.activeHint).not.toBeNull();
  });

  it('awards +200 Coins and sets BEST! flags on first clear', () => {
    useGameStore.getState().startLevel(1);
    const hint1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(hint1);
    useGameStore.getState().dismissTutorial();

    // Simulate 10 seconds elapsed before solving in 2 total shifts
    const limit = useGameStore.getState().timeLimitSeconds;
    useGameStore.setState({ timeRemaining: limit - 10 });

    const hint2 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(hint2);

    const state = useGameStore.getState();
    expect(state.lastRewardCoins).toBe(state.economy.levelClearReward);
    expect(state.coins).toBe(500 + state.economy.levelClearReward);
    expect(state.isNewBestTime).toBe(true);
    expect(state.isNewLeastMoves).toBe(true);
    expect(state.levelBestTime[1]).toBe(10);
    expect(state.levelLeastMoves[1]).toBe(2);
    expect(state.selectedLevelId).toBe(2);
  });

  it('awards 0 Coins on replay, upgrades stars only when improved, and updates BEST! flags only on strictly better records', () => {
    // Seed Level 1 as already cleared with 1 star, 25s best time, and 4 least moves
    useGameStore.setState({
      unlockedLevel: 4,
      selectedLevelId: 1,
      levelStars: { 1: 1 },
      levelBestTime: { 1: 25 },
      levelLeastMoves: { 1: 4 },
      hasSeenTutorial: true,
    });

    // Replay 1: Clear slower (89s, 1 star) and more moves (5 moves) -> no BEST! flags, stars stay 1, 0 coins
    useGameStore.getState().startLevel(1);
    const h1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(h1);
    useGameStore.getState().dismissTutorial();

    // Make 3 extra moves before solving (1 + 3 + 1 = 5 total shifts) with 1s remaining (1 star)
    useGameStore.getState().performShift({
      axis: 'row',
      index: 2,
      direction: 'right',
      distance: 1,
    });
    useGameStore.getState().performShift({
      axis: 'row',
      index: 2,
      direction: 'left',
      distance: 1,
    });
    useGameStore.getState().performShift({
      axis: 'col',
      index: 0,
      direction: 'down',
      distance: 3, // full cycle on 3x3 -> identity move, counts as shift
    });
    useGameStore.setState({ timeRemaining: 1 });
    useGameStore.getState().performShift({
      axis: 'row',
      index: 0,
      direction: 'right',
      distance: 1,
    });

    let state = useGameStore.getState();
    expect(state.activeModal).toBe('level_complete');
    expect(state.lastRewardCoins).toBe(0);
    expect(state.coins).toBe(500);
    expect(state.isNewBestTime).toBe(false);
    expect(state.isNewLeastMoves).toBe(false);
    expect(state.levelBestTime[1]).toBe(25);
    expect(state.levelLeastMoves[1]).toBe(4);
    expect(state.levelStars[1]).toBe(1);
    expect(state.selectedLevelId).toBe(2);

    // Replay 2: Beat both time (8s < 25s) and moves (2 < 4), earning 3 stars -> upgrades stars & triggers BEST!
    const limit = useGameStore.getState().timeLimitSeconds;
    useGameStore.getState().startLevel(1);
    const r2h1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(r2h1);
    useGameStore.getState().dismissTutorial();
    useGameStore.setState({ timeRemaining: limit - 8 });
    const r2h2 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(r2h2);

    state = useGameStore.getState();
    expect(state.lastRewardCoins).toBe(0);
    expect(state.coins).toBe(500);
    expect(state.isNewBestTime).toBe(true);
    expect(state.isNewLeastMoves).toBe(true);
    expect(state.levelBestTime[1]).toBe(8);
    expect(state.levelLeastMoves[1]).toBe(2);
    expect(state.levelStars[1]).toBe(3);
    expect(state.unlockedLevel).toBe(4);
    expect(state.selectedLevelId).toBe(2);

    // Replay 3: Tie exact best time (8s === 8s) and least moves (2 === 2) -> BEST! flags stay false
    useGameStore.getState().startLevel(1);
    const r3h1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(r3h1);
    useGameStore.getState().dismissTutorial();
    useGameStore.setState({ timeRemaining: limit - 8 });
    const r3h2 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(r3h2);

    state = useGameStore.getState();
    expect(state.isNewBestTime).toBe(false);
    expect(state.isNewLeastMoves).toBe(false);
    expect(state.levelStars[1]).toBe(3);

    // Replay 4: Earn fewer stars (1 star via low remaining time) -> 3-star record is NOT downgraded
    useGameStore.getState().startLevel(1);
    const r4h1 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(r4h1);
    useGameStore.getState().dismissTutorial();
    useGameStore.setState({ timeRemaining: 1 });
    const r4h2 = useGameStore.getState().activeHint!;
    useGameStore.getState().performShift(r4h2);

    state = useGameStore.getState();
    expect(state.lastEarnedStars).toBe(1);
    expect(state.levelStars[1]).toBe(3);
    expect(state.isNewBestTime).toBe(false);
    expect(state.isNewLeastMoves).toBe(false);
  });
});
