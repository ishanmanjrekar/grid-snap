import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLOR_HEX_MAP,
  type BlockColor,
  type CellBlock,
  type ShiftAction,
} from '../engine/types';
import { ColorblindShapeIcon, GhostHandIcon } from './PixelIcons';

export interface TorusGridProps {
  rows: number;
  cols: number;
  grid: CellBlock[][];
  frames: (BlockColor | null)[][];
  colorblindMode?: boolean;
  disabled?: boolean;
  activeHint?: ShiftAction | null;
  restrictedHint?: ShiftAction | null;
  onInvalidInteraction?: () => void;
  onCommitShift?: (action: ShiftAction) => void;
  onDragTick?: () => void;
  /** Optional Level Editor Paint Mode */
  editorPaintMode?: boolean;
  onCellPaint?: (row: number, col: number) => void;
  /** Optional explicit max width/height override for desktop editor */
  maxCellSize?: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startRow: number;
  startCol: number;
  axis: 'row' | 'col' | null;
  lineIndex: number;
  offsetPx: number;
  lastTickSlot: number;
  isCommitting: boolean;
  commitBaseCells?: number;
}

export const TorusGrid: React.FC<TorusGridProps> = ({
  rows,
  cols,
  grid,
  frames,
  colorblindMode = false,
  disabled = false,
  activeHint = null,
  restrictedHint = null,
  onInvalidInteraction,
  onCommitShift,
  onDragTick,
  editorPaintMode = false,
  onCellPaint,
  maxCellSize = 76,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState<number>(56);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const bufferedActionsRef = useRef<ShiftAction[]>([]);
  const commitTimeoutRef = useRef<number | null>(null);
  const isPaintingRef = useRef<boolean>(false);
  const lastPaintedCellRef = useRef<string | null>(null);
  const [invalidWiggle, setInvalidWiggle] = useState<boolean>(false);
  const invalidWiggleTimeoutRef = useRef<number | null>(null);
  const lastInvalidAudioRef = useRef<number>(0);

  const triggerInvalidFeedback = useCallback(() => {
    const now = Date.now();
    if (now - lastInvalidAudioRef.current > 300) {
      lastInvalidAudioRef.current = now;
      onInvalidInteraction?.();
      setInvalidWiggle(true);
      if (invalidWiggleTimeoutRef.current !== null) {
        window.clearTimeout(invalidWiggleTimeoutRef.current);
      }
      invalidWiggleTimeoutRef.current = window.setTimeout(() => {
        setInvalidWiggle(false);
      }, 320);
    }
  }, [onInvalidInteraction]);

  // Measure available stage container and compute optimal square cell size
  const updateCellSize = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const clientW = el.clientWidth;
    const clientH = el.clientHeight;
    const rect = el.getBoundingClientRect();
    const w = clientW > 0 ? clientW : rect.width;
    const h = clientH > 0 ? clientH : rect.height;
    if (w === 0 || h === 0) return;

    // Reserve space for the outer arcade bezel + decorative arrows (approx 52px width, 52px height)
    const availW = Math.max(120, w - 54);
    const availH = Math.max(120, h - 54);
    const gapTotalW = (cols - 1) * 5 + 12;
    const gapTotalH = (rows - 1) * 5 + 12;

    const sizeByW = Math.floor((availW - gapTotalW) / cols);
    const sizeByH = Math.floor((availH - gapTotalH) / rows);
    const computed = Math.max(30, Math.min(maxCellSize, sizeByW, sizeByH));
    setCellSize(computed);
  }, [cols, rows, maxCellSize]);

  useEffect(() => {
    updateCellSize();
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => updateCellSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateCellSize]);

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current !== null) {
        window.clearTimeout(commitTimeoutRef.current);
      }
      if (invalidWiggleTimeoutRef.current !== null) {
        window.clearTimeout(invalidWiggleTimeoutRef.current);
      }
    };
  }, []);

  const stepSizePx = cellSize + 5; // cellSize + 5px gap

  const finalizeShift = useCallback(
    (axis: 'row' | 'col', lineIndex: number, netCells: number) => {
      const L = axis === 'row' ? cols : rows;
      const mod = ((netCells % L) + L) % L;
      if (mod !== 0 && onCommitShift) {
        let action: ShiftAction;
        if (axis === 'row') {
          // Positive netCells = dragged right; negative = dragged left
          if (netCells > 0) {
            action = { axis: 'row', index: lineIndex, direction: 'right', distance: mod };
          } else {
            const leftDist = (( -netCells % L ) + L) % L;
            action = { axis: 'row', index: lineIndex, direction: 'left', distance: leftDist };
          }
        } else {
          if (netCells > 0) {
            action = { axis: 'col', index: lineIndex, direction: 'down', distance: mod };
          } else {
            const upDist = (( -netCells % L ) + L) % L;
            action = { axis: 'col', index: lineIndex, direction: 'up', distance: upDist };
          }
        }
        onCommitShift(action);
      }

      dragRef.current = null;
      setDrag(null);

      // Drain buffered action if present
      if (bufferedActionsRef.current.length > 0 && onCommitShift) {
        const nextAction = bufferedActionsRef.current.shift()!;
        onCommitShift(nextAction);
      }
    },
    [cols, rows, onCommitShift]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const tray = trayRef.current;
    if (!tray) return;

    const rect = tray.getBoundingClientRect();
    const scaleX = rect.width > 0 && trayWidth > 0 ? rect.width / trayWidth : 1;
    const scaleY = rect.height > 0 && trayHeight > 0 ? rect.height / trayHeight : 1;

    // 1. Direct Hit-Testing: check if target is inside an actual cell tile
    const cellEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cell-row]');
    let row: number;
    let col: number;

    if (
      cellEl &&
      cellEl.dataset.cellRow !== undefined &&
      cellEl.dataset.cellCol !== undefined
    ) {
      row = parseInt(cellEl.dataset.cellRow, 10);
      col = parseInt(cellEl.dataset.cellCol, 10);
    } else {
      // 2. Scale-Aware Coordinate Math: for clicks in the 5px gap or padding between tiles
      const localX = (e.clientX - rect.left) / scaleX;
      const localY = (e.clientY - rect.top) / scaleY;
      // Tray has 3px outer border + 6px inner padding offset = 9px to (row 0, col 0)
      const relX = localX - 9;
      const relY = localY - 9;
      col = Math.max(0, Math.min(cols - 1, Math.floor(relX / stepSizePx)));
      row = Math.max(0, Math.min(rows - 1, Math.floor(relY / stepSizePx)));
    }

    if (editorPaintMode) {
      isPaintingRef.current = true;
      lastPaintedCellRef.current = `${row},${col}`;
      onCellPaint?.(row, col);
      return;
    }

    if (dragRef.current?.isCommitting) {
      return;
    }

    if (restrictedHint) {
      const isTargetLine =
        restrictedHint.axis === 'row'
          ? row === restrictedHint.index
          : col === restrictedHint.index;

      if (!isTargetLine) {
        triggerInvalidFeedback();
        return;
      }
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const nextDrag: DragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startRow: row,
      startCol: col,
      axis: null,
      lineIndex: -1,
      offsetPx: 0,
      lastTickSlot: 0,
      isCommitting: false,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    const tray = trayRef.current;
    if (!tray) return;

    const rect = tray.getBoundingClientRect();
    const scaleX = rect.width > 0 && trayWidth > 0 ? rect.width / trayWidth : 1;
    const scaleY = rect.height > 0 && trayHeight > 0 ? rect.height / trayHeight : 1;

    if (editorPaintMode) {
      if (!isPaintingRef.current) return;
      const localX = (e.clientX - rect.left) / scaleX;
      const localY = (e.clientY - rect.top) / scaleY;
      const relX = localX - 9;
      const relY = localY - 9;
      const col = Math.floor(relX / stepSizePx);
      const row = Math.floor(relY / stepSizePx);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const key = `${row},${col}`;
        if (lastPaintedCellRef.current !== key) {
          lastPaintedCellRef.current = key;
          onCellPaint?.(row, col);
        }
      }
      return;
    }

    const current = dragRef.current;
    if (!current || current.isCommitting || current.pointerId !== e.pointerId) return;

    const dx = (e.clientX - current.startX) / scaleX;
    const dy = (e.clientY - current.startY) / scaleY;
    const lockThreshold = cellSize * 0.3;

    let axis = current.axis;
    let lineIndex = current.lineIndex;

    if (!axis) {
      if (restrictedHint) {
        const isHoriz = Math.abs(dx) >= Math.abs(dy);
        if (restrictedHint.axis === 'row') {
          if (!isHoriz && Math.abs(dy) > lockThreshold) {
            triggerInvalidFeedback();
            return;
          }
          if (Math.abs(dx) >= lockThreshold) {
            axis = 'row';
            lineIndex = restrictedHint.index;
          } else {
            return;
          }
        } else {
          if (isHoriz && Math.abs(dx) > lockThreshold) {
            triggerInvalidFeedback();
            return;
          }
          if (Math.abs(dy) >= lockThreshold) {
            axis = 'col';
            lineIndex = restrictedHint.index;
          } else {
            return;
          }
        }
      } else {
        if (Math.abs(dx) < lockThreshold && Math.abs(dy) < lockThreshold) {
          return;
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
          axis = 'row';
          lineIndex = current.startRow;
        } else {
          axis = 'col';
          lineIndex = current.startCol;
        }
      }
    }

    let offsetPx = axis === 'row' ? dx : dy;

    if (restrictedHint) {
      const expectedPositive =
        restrictedHint.direction === 'right' || restrictedHint.direction === 'down';

      if (expectedPositive) {
        if (offsetPx < -8) {
          triggerInvalidFeedback();
          offsetPx = 0;
        } else {
          const maxAllowed = restrictedHint.distance * stepSizePx + 8;
          offsetPx = Math.max(0, Math.min(maxAllowed, offsetPx));
        }
      } else {
        if (offsetPx > 8) {
          triggerInvalidFeedback();
          offsetPx = 0;
        } else {
          const minAllowed = -restrictedHint.distance * stepSizePx - 8;
          offsetPx = Math.min(0, Math.max(minAllowed, offsetPx));
        }
      }
    }

    const currentTickSlot = Math.round(offsetPx / stepSizePx);

    if (currentTickSlot !== current.lastTickSlot) {
      onDragTick?.();
    }

    const updated: DragState = {
      ...current,
      axis,
      lineIndex,
      offsetPx,
      lastTickSlot: currentTickSlot,
    };
    dragRef.current = updated;
    setDrag(updated);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editorPaintMode) {
      isPaintingRef.current = false;
      lastPaintedCellRef.current = null;
      return;
    }

    const current = dragRef.current;
    if (!current || current.isCommitting || current.pointerId !== e.pointerId) return;

    if (!current.axis) {
      dragRef.current = null;
      setDrag(null);
      return;
    }

    let netCells = Math.round(current.offsetPx / stepSizePx);

    if (restrictedHint) {
      const expectedPositive =
        restrictedHint.direction === 'right' || restrictedHint.direction === 'down';
      if (expectedPositive && netCells <= 0) {
        netCells = 0;
      } else if (!expectedPositive && netCells >= 0) {
        netCells = 0;
      }
    }

    if (netCells === 0) {
      dragRef.current = null;
      setDrag(null);
      return;
    }

    const preCommitBaseCells = Math.trunc(current.offsetPx / stepSizePx);
    const targetOffsetPx = netCells * stepSizePx;

    const committingState: DragState = {
      ...current,
      offsetPx: targetOffsetPx,
      isCommitting: true,
      commitBaseCells: preCommitBaseCells,
    };
    dragRef.current = committingState;
    setDrag(committingState);

    const axis = current.axis;
    const lineIndex = current.lineIndex;

    commitTimeoutRef.current = window.setTimeout(() => {
      commitTimeoutRef.current = null;
      finalizeShift(axis, lineIndex, netCells);
    }, 110);
  };

  const renderCenterPip = (targetColor: BlockColor, sizePx: number) => {
    if (colorblindMode) {
      return (
        <ColorblindShapeIcon
          color={targetColor}
          fill={COLOR_HEX_MAP[targetColor].pipBorder}
          size={Math.max(12, Math.round(sizePx * 0.3))}
        />
      );
    }
    const pipSize = Math.max(6, Math.round(sizePx * 0.13));
    return (
      <span
        style={{
          width: pipSize,
          height: pipSize,
          backgroundColor: COLOR_HEX_MAP[targetColor].pipFill,
          border: `1.5px solid ${COLOR_HEX_MAP[targetColor].pipBorder}`,
        }}
        className="block shrink-0"
      />
    );
  };

  const renderTileFace = (
    block: CellBlock,
    targetColor: BlockColor | null,
    isMatched: boolean
  ) => {
    const isNeutral = block === 'neutral';
    const tileClass = isNeutral ? 'pixel-tile-neutral' : `pixel-tile-${block}`;
    const neutralDotSize = Math.max(5, Math.round(cellSize * 0.1));

    return (
      <div
        className={`w-full h-full relative flex items-center justify-center select-none ${tileClass}`}
      >
        {isNeutral ? (
          targetColor !== null ? (
            renderCenterPip(targetColor, cellSize)
          ) : (
            <span
              style={{ width: neutralDotSize, height: neutralDotSize }}
              className="block bg-[#BCB199]"
            />
          )
        ) : (
          <>
            {colorblindMode && (
              <ColorblindShapeIcon
                color={block}
                fill="rgba(255, 255, 255, 0.85)"
                size={Math.max(16, Math.round(cellSize * 0.46))}
                className="drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]"
              />
            )}
            {!isMatched && targetColor !== null && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {renderCenterPip(targetColor, cellSize)}
              </div>
            )}
            {isMatched && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow: 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.85)',
                }}
              >
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white" />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderCell = (
    block: CellBlock,
    targetColor: BlockColor | null,
    isMatched: boolean,
    key: string,
    extraStyle?: React.CSSProperties
  ) => {
    const frameInsetPx = Math.max(2, Math.round(cellSize * 0.05));

    if (targetColor !== null) {
      return (
        <div
          key={key}
          style={{
            width: cellSize,
            height: cellSize,
            padding: frameInsetPx,
            borderStyle: isMatched ? 'solid' : 'dashed',
            borderWidth: isMatched ? '2.5px' : '2px',
            borderColor: COLOR_HEX_MAP[targetColor].slotBorder,
            backgroundColor: COLOR_HEX_MAP[targetColor].slotTint,
            ...extraStyle,
          }}
          className={`relative flex items-center justify-center select-none slot-${targetColor} ${
            isMatched ? 'animate-snap-pop' : ''
          }`}
        >
          {renderTileFace(block, targetColor, isMatched)}
        </div>
      );
    }

    return (
      <div
        key={key}
        style={{
          width: cellSize,
          height: cellSize,
          ...extraStyle,
        }}
        className="relative flex items-center justify-center select-none"
      >
        {renderTileFace(block, null, false)}
      </div>
    );
  };

  // Compute active line drag decomposition (base integer cell shift + fractional remainder in (-stepSizePx, +stepSizePx))
  const getActiveLineRenderData = () => {
    if (!drag || !drag.axis) return null;
    const L = drag.axis === 'row' ? cols : rows;
    const baseCells =
      drag.commitBaseCells ?? Math.trunc(drag.offsetPx / stepSizePx);
    const remainderPx = drag.offsetPx - baseCells * stepSizePx;

    const getShiftedBlockAt = (slotIdx: number): CellBlock => {
      const srcIdx = (((slotIdx - baseCells) % L) + L) % L;
      return drag.axis === 'row'
        ? grid[drag.lineIndex][srcIdx]
        : grid[srcIdx][drag.lineIndex];
    };

    return { L, remainderPx, getShiftedBlockAt };
  };

  const activeLineData = getActiveLineRenderData();

  const trayWidth = cols * cellSize + (cols - 1) * 5 + 12;
  const trayHeight = rows * cellSize + (rows - 1) * 5 + 12;

  return (
    <div
      ref={stageRef}
      className="w-full h-full flex items-center justify-center select-none overflow-hidden"
    >
      <style>{`
        @keyframes ftueWiggle {
          0%, 100% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(-4px, 0, 0); }
          40% { transform: translate3d(4px, 0, 0); }
          60% { transform: translate3d(-3px, 0, 0); }
          80% { transform: translate3d(3px, 0, 0); }
        }
      `}</style>
      {/* Handheld Console Outer Bezel Frame */}
      <div
        className="relative bg-[#EAE2CA] border-[4px] border-[#2C2523] shadow-[5px_5px_0_0_#2C2523] p-5 flex flex-col items-center justify-center"
        style={{ borderRadius: '4px' }}
      >
        {/* Corner Screw Details */}
        <div className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#C4BA9D] border border-[#2C2523]" />
        <div className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C4BA9D] border border-[#2C2523]" />
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-[#C4BA9D] border border-[#2C2523]" />
        <div className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C4BA9D] border border-[#2C2523]" />

        {/* Decorative Top Bezel Arrows (pointer-events: none) */}
        <div
          className="pointer-events-none flex items-center justify-between mb-1.5"
          style={{ width: trayWidth - 12 }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={`top-arrow-${c}`}
              style={{ width: cellSize }}
              className="flex items-center justify-center"
            >
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '7px solid #2C2523',
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center">
          {/* Decorative Left Bezel Arrows (pointer-events: none) */}
          <div
            className="pointer-events-none flex flex-col items-center justify-between mr-1.5"
            style={{ height: trayHeight - 12 }}
          >
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={`left-arrow-${r}`}
                style={{ height: cellSize }}
                className="flex items-center justify-center"
              >
                <div
                  className="w-0 h-0"
                  style={{
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '7px solid #2C2523',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Recessed Matrix Tray */}
          <div
            ref={trayRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            style={{
              width: trayWidth,
              height: trayHeight,
              touchAction: 'none',
              animation: invalidWiggle ? 'ftueWiggle 320ms ease-in-out' : undefined,
            }}
            className={`relative pixel-tray-inset border-[3px] border-[#2C2523] overflow-hidden ${
              editorPaintMode ? 'cursor-crosshair' : disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            {/* Layer 1: Non-Dragging Cells (Normal Squares & Framed Smaller-Square Targets) */}
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const isLineDragging =
                  (drag?.axis === 'row' && drag.lineIndex === r) ||
                  (drag?.axis === 'col' && drag.lineIndex === c);
                if (isLineDragging) return null;

                const block = grid[r]?.[c] ?? 'neutral';
                const targetColor = frames[r]?.[c] ?? null;
                const isMatched = targetColor !== null && block === targetColor;
                const left = 6 + c * stepSizePx;
                const top = 6 + r * stepSizePx;

                return (
                  <div
                    key={`cell-${r}-${c}`}
                    data-cell-row={r}
                    data-cell-col={c}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: cellSize,
                      height: cellSize,
                      zIndex: 10,
                    }}
                  >
                    {renderCell(block, targetColor, isMatched, `tile-${r}-${c}`)}
                  </div>
                );
              })
            )}

            {/* Layer 2: Active Dragging Row or Column Strip with Wrap-Around Ghost Tiles (-1 .. L) */}
            {drag && drag.axis && activeLineData && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
              >
                {Array.from({ length: activeLineData.L + 2 }, (_, k) => k - 1).map(
                  (slotIdx) => {
                    const block = activeLineData.getShiftedBlockAt(slotIdx);
                    const baseLeft =
                      drag.axis === 'row'
                        ? 6 + slotIdx * stepSizePx
                        : 6 + drag.lineIndex * stepSizePx;
                    const baseTop =
                      drag.axis === 'col'
                        ? 6 + slotIdx * stepSizePx
                        : 6 + drag.lineIndex * stepSizePx;

                    const translateX =
                      drag.axis === 'row' ? activeLineData.remainderPx : 0;
                    const translateY =
                      drag.axis === 'col' ? activeLineData.remainderPx : 0;

                    return (
                      <div
                        key={`drag-ghost-${slotIdx}`}
                        style={{
                          position: 'absolute',
                          left: baseLeft,
                          top: baseTop,
                          width: cellSize,
                          height: cellSize,
                          transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
                          transition: drag.isCommitting
                            ? 'transform 110ms ease-out'
                            : 'none',
                        }}
                      >
                        {renderCell(block, null, false, `drag-tile-${slotIdx}`)}
                      </div>
                    );
                  }
                )}

                {/* Keep fixed target frame + inset inner square outline visible above the sliding blocks */}
                {Array.from({ length: activeLineData.L }).map((_, idx) => {
                  const r = drag.axis === 'row' ? drag.lineIndex : idx;
                  const c = drag.axis === 'row' ? idx : drag.lineIndex;
                  const targetColor = frames[r]?.[c] ?? null;
                  if (targetColor === null) return null;
                  const frameInsetPx = Math.max(2, Math.round(cellSize * 0.05));
                  return (
                    <div
                      key={`drag-frame-top-${idx}`}
                      className="pointer-events-none absolute flex items-center justify-center"
                      style={{
                        left: 6 + c * stepSizePx,
                        top: 6 + r * stepSizePx,
                        width: cellSize,
                        height: cellSize,
                        padding: frameInsetPx,
                        border: `2px dashed ${COLOR_HEX_MAP[targetColor].slotBorder}`,
                        boxShadow: `inset 0 0 0 ${frameInsetPx}px #D1C6A5`,
                      }}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          border: '1.5px solid #332B25',
                          boxShadow: `inset 0 0 0 999px ${COLOR_HEX_MAP[targetColor].slotTint}`,
                        }}
                      >
                        {renderCenterPip(targetColor, cellSize)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layer 3: HINT Booster Visual Overlay (Pulsing Line Outline + Sliding Ghost Hand) */}
            {activeHint && (
              <HintOverlay
                hint={activeHint}
                cellSize={cellSize}
                stepSizePx={stepSizePx}
                rows={rows}
                cols={cols}
              />
            )}
          </div>

          {/* Decorative Right Bezel Arrows (pointer-events: none) */}
          <div
            className="pointer-events-none flex flex-col items-center justify-between ml-1.5"
            style={{ height: trayHeight - 12 }}
          >
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={`right-arrow-${r}`}
                style={{ height: cellSize }}
                className="flex items-center justify-center"
              >
                <div
                  className="w-0 h-0"
                  style={{
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '7px solid #2C2523',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Bottom Bezel Arrows (pointer-events: none) */}
        <div
          className="pointer-events-none flex items-center justify-between mt-1.5"
          style={{ width: trayWidth - 12 }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={`bottom-arrow-${c}`}
              style={{ width: cellSize }}
              className="flex items-center justify-center"
            >
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '7px solid #2C2523',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HintOverlay: React.FC<{
  hint: ShiftAction;
  cellSize: number;
  stepSizePx: number;
  rows: number;
  cols: number;
}> = ({ hint, cellSize, stepSizePx, rows, cols }) => {
  const isRow = hint.axis === 'row';
  const boxLeft = isRow ? 4 : 4 + hint.index * stepSizePx;
  const boxTop = isRow ? 4 + hint.index * stepSizePx : 4;
  const boxWidth = isRow ? cols * cellSize + (cols - 1) * 5 + 4 : cellSize + 4;
  const boxHeight = isRow ? cellSize + 4 : rows * cellSize + (rows - 1) * 5 + 4;

  const slidePixels =
    hint.distance *
    stepSizePx *
    (hint.direction === 'left' || hint.direction === 'up' ? -1 : 1);

  const dirArrow =
    hint.direction === 'left'
      ? '◄'
      : hint.direction === 'right'
        ? '►'
        : hint.direction === 'up'
          ? '▲'
          : '▼';

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <style>{`
        @keyframes hintSlideAnim {
          0% { transform: translate3d(0px, 0px, 0) scale(0.95); opacity: 0.9; }
          70% { transform: translate3d(${isRow ? slidePixels : 0}px, ${!isRow ? slidePixels : 0}px, 0) scale(1.05); opacity: 1; }
          100% { transform: translate3d(${isRow ? slidePixels : 0}px, ${!isRow ? slidePixels : 0}px, 0) scale(0.95); opacity: 0; }
        }
      `}</style>
      {/* Pulsing Line Border */}
      <div
        style={{
          position: 'absolute',
          left: boxLeft,
          top: boxTop,
          width: boxWidth,
          height: boxHeight,
          border: '3px solid #FBBF24',
          boxShadow: '0 0 0 2px #2C2523, inset 0 0 10px rgba(251, 191, 36, 0.45)',
        }}
        className="animate-pulse rounded-[2px] flex items-center justify-center"
      >
        <div className="bg-[#2C2523] text-[#FBBF24] font-pixel text-[9px] px-1.5 py-0.5 border border-[#FBBF24] shadow-[2px_2px_0_#000]">
          {dirArrow} {hint.distance}
        </div>
      </div>

      {/* Sliding Ghost Hand */}
      <div
        style={{
          position: 'absolute',
          left: isRow ? 6 + Math.floor((cols - 1) / 2) * stepSizePx + cellSize * 0.25 : boxLeft + cellSize * 0.25,
          top: !isRow ? 6 + Math.floor((rows - 1) / 2) * stepSizePx + cellSize * 0.25 : boxTop + cellSize * 0.25,
          animation: 'hintSlideAnim 900ms ease-in-out infinite',
        }}
      >
        <GhostHandIcon size={Math.max(22, Math.floor(cellSize * 0.55))} />
      </div>
    </div>
  );
};

