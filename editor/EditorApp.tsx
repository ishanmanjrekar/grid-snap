import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TorusGrid } from '../src/components/TorusGrid';
import {
  applyShiftAction,
  cloneGrid,
  getSnapProgress,
  hydrateEditorColors,
  normalizeEditorColors,
} from '../src/engine/grid';
import { computeSuggestedTime, solveParMoves } from '../src/engine/solver';
import {
  ALL_BLOCK_COLORS,
  COLOR_HEX_MAP,
  type BlockColor,
  type CellBlock,
  type DifficultyTier,
  type LevelConfig,
  type ShiftAction,
} from '../src/engine/types';
import { autoUnsolve } from '../src/engine/unsolve';

type EditorMode = 'paint' | 'unsolve' | 'playtest';

interface PaintSnapshot {
  frames: (BlockColor | null)[][];
  grid: CellBlock[][];
}

function createEmptyMatrices(rows: number, cols: number): PaintSnapshot {
  return {
    frames: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)),
    grid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'neutral')),
  };
}

export const EditorApp: React.FC = () => {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [loadedSourceId, setLoadedSourceId] = useState<number | null>(null);
  const [targetLevelId, setTargetLevelId] = useState<number>(1);
  const [cols, setCols] = useState<3 | 4>(3);
  const [rows, setRows] = useState<3 | 4 | 5 | 6 | 7 | 8>(3);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(35);
  const [difficulty, setDifficulty] = useState<DifficultyTier>('normal');

  const [mode, setMode] = useState<EditorMode>('paint');
  const [selectedBrush, setSelectedBrush] = useState<BlockColor | 'eraser'>('ruby');
  const [colorblindPreview, setColorblindPreview] = useState<boolean>(false);

  const [frames, setFrames] = useState<(BlockColor | null)[][]>(() =>
    createEmptyMatrices(3, 3).frames
  );
  const [grid, setGrid] = useState<CellBlock[][]>(() => createEmptyMatrices(3, 3).grid);

  const [paintUndoStack, setPaintUndoStack] = useState<PaintSnapshot[]>([]);
  const [unsolveUndoStack, setUnsolveUndoStack] = useState<CellBlock[][][]>([]);

  const [unsolveStepsInput, setUnsolveStepsInput] = useState<number>(3);
  const [scrambleSeedInput, setScrambleSeedInput] = useState<string>('');
  const [lastUsedSeed, setLastUsedSeed] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>('Ready.');

  // Playtest state
  const [playtestGrid, setPlaytestGrid] = useState<CellBlock[][]>([]);
  const [playtestTimeLeft, setPlaytestTimeLeft] = useState<number>(35);
  const [playtestShifts, setPlaytestShifts] = useState<number>(0);
  const [playtestHint, setPlaytestHint] = useState<ShiftAction | null>(null);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await fetch('/api/levels');
      const data = await res.json();
      if (Array.isArray(data.levels)) {
        setLevels(data.levels);
        return data.levels as LevelConfig[];
      }
    } catch (err) {
      console.error('Failed to load levels:', err);
    }
    return [];
  }, []);

  const loadLevelIntoEditor = useCallback((lvl: LevelConfig) => {
    setLoadedSourceId(lvl.id);
    setTargetLevelId(lvl.id);
    setCols(lvl.cols);
    setRows(lvl.rows);
    setTimeLimitSeconds(lvl.timeLimitSeconds);
    setDifficulty(lvl.difficulty);
    const hydrated = hydrateEditorColors(lvl);
    setFrames(hydrated.frames);
    setGrid(hydrated.grid);
    setPaintUndoStack([]);
    setUnsolveUndoStack([]);
    setLastUsedSeed(lvl.scrambleSeed);
    setScrambleSeedInput(lvl.scrambleSeed !== undefined ? String(lvl.scrambleSeed) : '');
    setMode('unsolve');
    setStatusMessage(`Loaded Level #${lvl.id} (${lvl.cols}×${lvl.rows}).`);
  }, []);

  useEffect(() => {
    void fetchLevels().then((list) => {
      if (list.length > 0) {
        loadLevelIntoEditor(list[0]);
      } else {
        setTargetLevelId(1);
      }
    });
  }, [fetchLevels, loadLevelIntoEditor]);

  // Resize board while preserving existing cell placements
  const handleResizeGrid = (newCols: 3 | 4, newRows: 3 | 4 | 5 | 6 | 7 | 8) => {
    setPaintUndoStack((prev) => [...prev, { frames: cloneGrid(frames), grid: cloneGrid(grid) }]);
    const nextFrames: (BlockColor | null)[][] = Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (__, c) => frames[r]?.[c] ?? null)
    );
    const nextGrid: CellBlock[][] = Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (__, c) => {
        const f = nextFrames[r][c];
        return mode === 'paint' ? (f ?? 'neutral') : (grid[r]?.[c] ?? 'neutral');
      })
    );
    setCols(newCols);
    setRows(newRows);
    setFrames(nextFrames);
    setGrid(nextGrid);
    setUnsolveUndoStack([]);
  };

  // Switch between Paint, Unsolve, and Playtest modes
  const handleSwitchMode = (nextMode: EditorMode) => {
    if (nextMode === 'paint') {
      // In Paint Mode, snap blocks back onto their fixed frames so designer edits the solved state
      const solvedGrid: CellBlock[][] = frames.map((row) =>
        row.map((f) => (f === null ? 'neutral' : f))
      );
      setGrid(solvedGrid);
    } else if (nextMode === 'playtest') {
      setPlaytestGrid(cloneGrid(grid));
      setPlaytestTimeLeft(timeLimitSeconds);
      setPlaytestShifts(0);
      setPlaytestHint(null);
    }
    setMode(nextMode);
  };

  // Playtest live countdown timer
  useEffect(() => {
    if (mode !== 'playtest') return;
    const progress = getSnapProgress(playtestGrid, frames);
    if (progress.isSolved || playtestTimeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setPlaytestTimeLeft((prev) => Math.max(0, Number((prev - 0.1).toFixed(1))));
    }, 100);
    return () => window.clearInterval(timer);
  }, [mode, playtestGrid, frames, playtestTimeLeft]);

  // Paint cell in Mode 1
  const handleCellPaint = (r: number, c: number) => {
    if (mode !== 'paint') return;
    setPaintUndoStack((prev) => [
      ...prev.slice(-29),
      { frames: cloneGrid(frames), grid: cloneGrid(grid) },
    ]);

    const nextFrames = cloneGrid(frames);
    const nextGrid = cloneGrid(grid);

    if (selectedBrush === 'eraser' || nextFrames[r][c] === selectedBrush) {
      nextFrames[r][c] = null;
      nextGrid[r][c] = 'neutral';
    } else {
      nextFrames[r][c] = selectedBrush;
      nextGrid[r][c] = selectedBrush;
    }

    setFrames(nextFrames);
    setGrid(nextGrid);
  };

  const handleUndoPaint = () => {
    if (paintUndoStack.length === 0) return;
    const last = paintUndoStack[paintUndoStack.length - 1];
    setFrames(last.frames);
    setGrid(last.grid);
    setPaintUndoStack((prev) => prev.slice(0, -1));
  };

  const handleClearBoard = () => {
    setPaintUndoStack((prev) => [...prev, { frames: cloneGrid(frames), grid: cloneGrid(grid) }]);
    const empty = createEmptyMatrices(rows, cols);
    setFrames(empty.frames);
    setGrid(empty.grid);
    setUnsolveUndoStack([]);
    setStatusMessage('Cleared board.');
  };

  // Unsolve Mode Drag-Snap commit
  const handleUnsolveShift = (action: ShiftAction) => {
    setUnsolveUndoStack((prev) => [...prev.slice(-29), cloneGrid(grid)]);
    setGrid((prev) => applyShiftAction(prev, action));
  };

  const handleUndoUnsolve = () => {
    if (unsolveUndoStack.length === 0) return;
    const last = unsolveUndoStack[unsolveUndoStack.length - 1];
    setGrid(last);
    setUnsolveUndoStack((prev) => prev.slice(0, -1));
  };

  const handleResetToSolved = () => {
    setUnsolveUndoStack((prev) => [...prev, cloneGrid(grid)]);
    const solved: CellBlock[][] = frames.map((row) =>
      row.map((f) => (f === null ? 'neutral' : f))
    );
    setGrid(solved);
    setStatusMessage('Reset blocks to solved positions.');
  };

  const handleAutoUnsolve = () => {
    const snap = getSnapProgress(grid, frames);
    if (snap.totalSlots === 0) {
      setStatusMessage('Place at least 1 colored block/frame in Paint Mode first!');
      return;
    }
    setUnsolveUndoStack((prev) => [...prev, cloneGrid(grid)]);
    const parsedSeed =
      scrambleSeedInput.trim() !== '' && !Number.isNaN(Number(scrambleSeedInput))
        ? Number(scrambleSeedInput)
        : Math.floor(Math.random() * 900000) + 100000;

    const result = autoUnsolve(frames, unsolveStepsInput, parsedSeed, 'neutral' as CellBlock);
    setGrid(result.grid);
    setLastUsedSeed(result.seed);
    setStatusMessage(
      `Auto-Unsolved in ${unsolveStepsInput} steps (Seed: ${result.seed} | Par: ${result.parMoves} moves | Pre-matched: ${result.matchedSlots}/${result.totalSlots}).`
    );
  };

  // Compute live Solver Par & Snap Progress
  const snapProgress = useMemo(() => getSnapProgress(grid, frames), [grid, frames]);
  const solverReadout = useMemo(() => {
    if (snapProgress.totalSlots === 0 || snapProgress.isSolved) {
      return { parMoves: 0, suggestedTime: computeSuggestedTime(1, rows, cols), actions: [] };
    }
    const res = solveParMoves(grid, frames, 350, 7);
    const par = res.parMoves;
    return {
      parMoves: par,
      suggestedTime: computeSuggestedTime(par, rows, cols),
      actions: res.actions,
    };
  }, [grid, frames, rows, cols, snapProgress.totalSlots, snapProgress.isSolved]);

  const distinctColorsUsed = useMemo(() => {
    const s = new Set<BlockColor>();
    for (const row of frames) {
      for (const f of row) {
        if (f !== null) s.add(f);
      }
    }
    return s.size;
  }, [frames]);

  // CRUD Actions
  const handleNewLevel = () => {
    const maxId = levels.reduce((m, l) => Math.max(m, l.id), 0);
    const nextId = maxId + 1;
    const empty = createEmptyMatrices(cols, cols === 3 ? 3 : 4);
    setLoadedSourceId(null);
    setTargetLevelId(nextId);
    setRows(cols === 3 ? 3 : 4);
    setFrames(empty.frames);
    setGrid(empty.grid);
    setPaintUndoStack([]);
    setUnsolveUndoStack([]);
    setMode('paint');
    setStatusMessage(`Initialized new blank draft for Level #${nextId}.`);
  };

  const handleDuplicateLevel = () => {
    const maxId = levels.reduce((m, l) => Math.max(m, l.id), 0);
    const nextId = maxId + 1;
    setLoadedSourceId(null);
    setTargetLevelId(nextId);
    setStatusMessage(`Duplicated current board into draft Level #${nextId}.`);
  };

  const handleDeleteLevel = async () => {
    if (loadedSourceId === null) return;
    if (!window.confirm(`Delete Level #${loadedSourceId} and re-index remaining levels?`)) {
      return;
    }
    const res = await fetch(`/api/level/${loadedSourceId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok && Array.isArray(data.levels)) {
      setLevels(data.levels);
      if (data.levels.length > 0) {
        loadLevelIntoEditor(data.levels[Math.min(loadedSourceId - 1, data.levels.length - 1)]);
      } else {
        handleNewLevel();
      }
      setStatusMessage(`Deleted Level #${loadedSourceId}.`);
    }
  };

  const buildPayload = (): LevelConfig | null => {
    if (snapProgress.totalSlots === 0) {
      window.alert('Cannot save an empty board! Place at least 1 colored block/frame first.');
      return null;
    }
    if (snapProgress.isSolved) {
      window.alert(
        'The board is currently in a SOLVED state! Switch to "2. UNSOLVE / SCRAMBLE" and shift blocks away from their frames before saving.'
      );
      return null;
    }
    const norm = normalizeEditorColors(frames, grid);
    return {
      id: Math.max(1, Math.floor(targetLevelId)),
      cols,
      rows,
      difficulty,
      timeLimitSeconds: Math.max(10, Math.floor(timeLimitSeconds)),
      colorCount: norm.colorCount,
      frames: norm.normalizedFrames,
      initialGrid: norm.normalizedGrid,
      parMoves: solverReadout.parMoves,
      scrambleSeed: lastUsedSeed,
    };
  };

  const handleSaveLevel = async () => {
    const payload = buildPayload();
    if (!payload) return;

    const existing = levels.find((l) => l.id === payload.id);
    if (existing && loadedSourceId !== payload.id) {
      const ok = window.confirm(
        `Level #${payload.id} already exists in levels.json. Overwrite Level #${payload.id}?`
      );
      if (!ok) return;
    }

    const res = await fetch('/api/save-level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.ok) {
      setLevels(data.levels);
      setLoadedSourceId(payload.id);
      setStatusMessage(`Saved Level #${payload.id} to src/config/levels.json!`);
    }
  };

  const handleInsertLevel = async () => {
    const payload = buildPayload();
    if (!payload) return;

    const res = await fetch('/api/insert-level', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.ok) {
      setLevels(data.levels);
      setLoadedSourceId(payload.id);
      setStatusMessage(
        `Inserted at Level #${payload.id} and shifted subsequent levels +1 in src/config/levels.json!`
      );
    }
  };

  const playtestProgress = useMemo(
    () => getSnapProgress(playtestGrid, frames),
    [playtestGrid, frames]
  );

  return (
    <div className="w-screen h-screen flex flex-col bg-[#F4EFE6] text-[#2C2523] overflow-hidden select-none">
      {/* Top Bar */}
      <header className="flex-none h-14 bg-[#2C2523] text-[#FFFDF8] px-6 flex items-center justify-between border-b-4 border-[#1E1B18]">
        <div className="flex items-center gap-4">
          <span className="font-pixel text-sm text-[#FBBF24]">GRID SNAP // LEVEL EDITOR</span>
          <span className="text-xs bg-[#1E1B18] text-[#5EEAD4] px-2.5 py-1 border border-[#5EEAD4]">
            Total Levels in JSON: {levels.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={colorblindPreview}
              onChange={(e) => setColorblindPreview(e.target.checked)}
              className="w-4 h-4 accent-[#22C55E]"
            />
            <span>COLORBLIND SYMBOLS</span>
          </label>
          <span className="text-xs text-[#FBBF24]">{statusMessage}</span>
        </div>
      </header>

      {/* Main 3-Column Desktop Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar: Panel 1 (Level CRUD & Metadata) */}
        <aside className="w-80 flex-none bg-[#FFFDF8] border-r-4 border-[#2C2523] p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h2 className="font-pixel text-xs mb-2 text-[#2C2523]">1. LEVEL SELECT & CRUD</h2>
            <select
              value={loadedSourceId ?? ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const found = levels.find((l) => l.id === id);
                if (found) loadLevelIntoEditor(found);
              }}
              className="w-full p-2 bg-[#F4EFE6] border-2 border-[#2C2523] font-retro text-xs mb-2"
            >
              <option value="" disabled>
                -- Select Existing Level --
              </option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  Level #{lvl.id} ({lvl.cols}×{lvl.rows} · {lvl.difficulty.toUpperCase()} ·{' '}
                  {lvl.timeLimitSeconds}s)
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={handleNewLevel}
                className="pixel-btn bg-[#22C55E] text-white font-pixel text-[9px] py-2"
              >
                + NEW
              </button>
              <button
                onClick={handleDuplicateLevel}
                className="pixel-btn bg-[#FBBF24] text-[#2C2523] font-pixel text-[9px] py-2"
              >
                DUPLICATE
              </button>
              <button
                onClick={handleDeleteLevel}
                disabled={loadedSourceId === null}
                className="pixel-btn bg-[#EF4444] text-white font-pixel text-[9px] py-2 disabled:opacity-40"
              >
                DELETE
              </button>
            </div>
          </div>

          <hr className="border-t-2 border-dashed border-[#D1C6A5]" />

          {/* Target Level ID & Grid Dimensions */}
          <div className="flex flex-col gap-3">
            <h2 className="font-pixel text-xs text-[#2C2523]">2. STAGE METADATA</h2>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">TARGET LEVEL #:</span>
              <input
                type="number"
                min={1}
                value={targetLevelId}
                onChange={(e) => setTargetLevelId(Math.max(1, Number(e.target.value)))}
                className="w-24 p-1.5 bg-[#F4EFE6] border-2 border-[#2C2523] text-center font-pixel text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">COLUMNS (3–4):</span>
              <div className="flex gap-1.5">
                {([3, 4] as const).map((cVal) => (
                  <button
                    key={cVal}
                    onClick={() => handleResizeGrid(cVal, rows)}
                    className={`px-3 py-1 border-2 border-[#2C2523] font-pixel text-xs ${
                      cols === cVal ? 'bg-[#2C2523] text-[#FBBF24]' : 'bg-[#F4EFE6]'
                    }`}
                  >
                    {cVal}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold">ROWS (3–8):</span>
              <div className="grid grid-cols-6 gap-1">
                {([3, 4, 5, 6, 7, 8] as const).map((rVal) => (
                  <button
                    key={rVal}
                    onClick={() => handleResizeGrid(cols, rVal)}
                    className={`py-1.5 border-2 border-[#2C2523] font-pixel text-xs ${
                      rows === rVal ? 'bg-[#2C2523] text-[#FBBF24]' : 'bg-[#F4EFE6]'
                    }`}
                  >
                    {rVal}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">TIMER (SEC):</span>
                <input
                  type="number"
                  min={10}
                  max={300}
                  step={5}
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(Math.max(10, Number(e.target.value)))}
                  className="w-24 p-1.5 bg-[#F4EFE6] border-2 border-[#2C2523] text-center font-pixel text-xs"
                />
              </div>
              <button
                onClick={() => setTimeLimitSeconds(solverReadout.suggestedTime)}
                className="w-full py-1.5 bg-[#EAE2CA] border-2 border-[#2C2523] text-[10px] font-bold hover:bg-[#D1C6A5]"
              >
                APPLY SUGGESTED TIME ({solverReadout.suggestedTime}s)
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold">DIFFICULTY BADGE:</span>
              <div className="grid grid-cols-3 gap-1">
                {(['normal', 'hard', 'super_hard'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setDifficulty(tier)}
                    className={`py-1.5 border-2 border-[#2C2523] font-pixel text-[8px] ${
                      difficulty === tier
                        ? tier === 'super_hard'
                          ? 'bg-[#9333EA] text-white'
                          : tier === 'hard'
                            ? 'bg-[#EF4444] text-white'
                            : 'bg-[#2C2523] text-white'
                        : 'bg-[#F4EFE6]'
                    }`}
                  >
                    {tier.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-t-2 border-dashed border-[#D1C6A5]" />

          {/* Save & Insert Panel */}
          <div className="mt-auto flex flex-col gap-2">
            <button
              onClick={handleSaveLevel}
              className="pixel-btn w-full py-3 bg-[#22C55E] text-white font-pixel text-xs"
            >
              SAVE AS LEVEL #{targetLevelId}
            </button>
            <button
              onClick={handleInsertLevel}
              className="pixel-btn w-full py-2.5 bg-[#FBBF24] text-[#2C2523] font-pixel text-[10px]"
            >
              INSERT AT #{targetLevelId} (SHIFT +1)
            </button>
          </div>
        </aside>

        {/* Center Stage: Mode Switcher + Shared TorusGrid */}
        <main className="flex-1 min-w-0 flex flex-col p-4 overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex-none flex gap-2 mb-3">
            <button
              onClick={() => handleSwitchMode('paint')}
              className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] ${
                mode === 'paint' ? 'bg-[#FBBF24] text-[#2C2523]' : 'bg-[#FFFDF8]'
              }`}
            >
              1. PAINT SOLVED STATE
            </button>
            <button
              onClick={() => handleSwitchMode('unsolve')}
              className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] ${
                mode === 'unsolve' ? 'bg-[#5EEAD4] text-[#2C2523]' : 'bg-[#FFFDF8]'
              }`}
            >
              2. UNSOLVE / SCRAMBLE
            </button>
            <button
              onClick={() => handleSwitchMode('playtest')}
              className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] ${
                mode === 'playtest' ? 'bg-[#22C55E] text-white' : 'bg-[#FFFDF8]'
              }`}
            >
              3. PLAYTEST LEVEL
            </button>
          </div>

          {/* Mode-Specific Toolbar */}
          {mode === 'paint' && (
            <div className="flex-none bg-[#FFFDF8] border-3 border-[#2C2523] p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {ALL_BLOCK_COLORS.map((c, idx) => (
                  <button
                    key={c}
                    onClick={() => setSelectedBrush(c)}
                    className={`px-2.5 py-1.5 border-2 border-[#2C2523] font-pixel text-[9px] text-white flex items-center gap-1.5 ${
                      selectedBrush === c ? 'ring-3 ring-[#2C2523] scale-105' : 'opacity-85'
                    }`}
                    style={{ backgroundColor: COLOR_HEX_MAP[c].base }}
                  >
                    <span>#{idx + 1}</span>
                    <span>{c.toUpperCase()}</span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedBrush('eraser')}
                  className={`px-3 py-1.5 border-2 border-[#2C2523] font-pixel text-[9px] ${
                    selectedBrush === 'eraser'
                      ? 'bg-[#2C2523] text-white'
                      : 'bg-[#F4EFE6] text-[#2C2523]'
                  }`}
                >
                  ERASER
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-1 bg-[#F4EFE6] border border-[#2C2523]">
                  Colors: {distinctColorsUsed} | Target Blocks: {snapProgress.totalSlots}
                </span>
                <button
                  onClick={handleUndoPaint}
                  disabled={paintUndoStack.length === 0}
                  className="px-3 py-1.5 bg-[#EAE2CA] border-2 border-[#2C2523] font-pixel text-[9px] disabled:opacity-40"
                >
                  UNDO ({paintUndoStack.length})
                </button>
                <button
                  onClick={handleClearBoard}
                  className="px-3 py-1.5 bg-[#EF4444] text-white border-2 border-[#2C2523] font-pixel text-[9px]"
                >
                  CLEAR
                </button>
              </div>
            </div>
          )}

          {mode === 'unsolve' && (
            <div className="flex-none bg-[#FFFDF8] border-3 border-[#2C2523] p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">AUTO UNSOLVE STEPS:</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={unsolveStepsInput}
                  onChange={(e) =>
                    setUnsolveStepsInput(Math.max(1, Math.min(8, Number(e.target.value))))
                  }
                  className="w-14 p-1 bg-[#F4EFE6] border-2 border-[#2C2523] text-center font-pixel text-xs"
                />
                <span className="text-xs font-bold ml-2">SEED (OPT):</span>
                <input
                  type="text"
                  placeholder="Random"
                  value={scrambleSeedInput}
                  onChange={(e) => setScrambleSeedInput(e.target.value)}
                  className="w-24 p-1 bg-[#F4EFE6] border-2 border-[#2C2523] text-center text-xs"
                />
                <button
                  onClick={handleAutoUnsolve}
                  className="pixel-btn px-3 py-1.5 bg-[#5EEAD4] text-[#2C2523] font-pixel text-[9px]"
                >
                  AUTO UNSOLVE
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndoUnsolve}
                  disabled={unsolveUndoStack.length === 0}
                  className="px-3 py-1.5 bg-[#EAE2CA] border-2 border-[#2C2523] font-pixel text-[9px] disabled:opacity-40"
                >
                  UNDO ({unsolveUndoStack.length})
                </button>
                <button
                  onClick={handleResetToSolved}
                  className="px-3 py-1.5 bg-[#FBBF24] text-[#2C2523] border-2 border-[#2C2523] font-pixel text-[9px]"
                >
                  RESET TO SOLVED
                </button>
              </div>
            </div>
          )}

          {mode === 'playtest' && (
            <div className="flex-none bg-[#FFFDF8] border-3 border-[#2C2523] p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-pixel text-xs px-3 py-1.5 bg-[#FFECA8] border-2 border-[#2C2523]">
                  ⏳ {playtestTimeLeft.toFixed(1)}s / {timeLimitSeconds}s
                </span>
                <span className="font-pixel text-xs">SHIFTS: {playtestShifts}</span>
                {playtestProgress.isSolved && (
                  <span className="font-pixel text-xs bg-[#22C55E] text-white px-3 py-1.5 border-2 border-[#2C2523]">
                    ★ STAGE SOLVED! ★
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const res = solveParMoves(playtestGrid, frames, 250, 7);
                    setPlaytestHint(res.actions[0] ?? null);
                  }}
                  className="pixel-btn px-3 py-1.5 bg-[#93C5FD] text-[#2C2523] font-pixel text-[9px]"
                >
                  TEST HINT
                </button>
                <button
                  onClick={() => handleSwitchMode('playtest')}
                  className="pixel-btn px-3 py-1.5 bg-[#FBBF24] text-[#2C2523] font-pixel text-[9px]"
                >
                  RESTART PLAYTEST
                </button>
              </div>
            </div>
          )}

          {/* Live Board Readout Strip */}
          <div className="flex-none flex items-center justify-between px-3 py-2 bg-[#EAE2CA] border-2 border-[#2C2523] mb-2 text-xs font-bold">
            <div>
              Matched Frames:{' '}
              <span
                className={
                  snapProgress.isSolved
                    ? 'text-[#EF4444]'
                    : snapProgress.matchedSlots === 0
                      ? 'text-[#15803D]'
                      : 'text-[#D97706]'
                }
              >
                {snapProgress.matchedSlots} / {snapProgress.totalSlots}{' '}
                {snapProgress.isSolved
                  ? '(CURRENTLY SOLVED - SCRAMBLE BEFORE SAVING)'
                  : snapProgress.matchedSlots === 0
                    ? '(0 PRE-MATCHED — CLEAN!)'
                    : '(PARTIAL OVERLAP — SAVABLE)'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                IDA* Solver Par: <strong className="font-pixel">{solverReadout.parMoves}</strong>{' '}
                Moves
              </span>
              <span>
                Suggested Timer:{' '}
                <strong className="font-pixel">{solverReadout.suggestedTime}s</strong>
              </span>
            </div>
          </div>

          {/* Center Elastic TorusGrid Canvas */}
          <div className="flex-1 min-h-0 bg-[#F4EFE6] border-2 border-dashed border-[#D1C6A5] flex items-center justify-center p-2">
            <TorusGrid
              rows={rows}
              cols={cols}
              grid={mode === 'playtest' ? playtestGrid : grid}
              frames={frames}
              colorblindMode={colorblindPreview}
              editorPaintMode={mode === 'paint'}
              onCellPaint={handleCellPaint}
              activeHint={mode === 'playtest' ? playtestHint : null}
              onCommitShift={(action) => {
                if (mode === 'unsolve') {
                  handleUnsolveShift(action);
                } else if (mode === 'playtest') {
                  setPlaytestHint(null);
                  setPlaytestShifts((s) => s + 1);
                  setPlaytestGrid((prev) => applyShiftAction(prev, action));
                }
              }}
              maxCellSize={68}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

