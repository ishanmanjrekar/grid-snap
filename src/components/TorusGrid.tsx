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
}

export const TorusGrid: React.FC<TorusGridProps> = ({
  rows,
  cols,
  grid,
  frames,
  colorblindMode = false,
  disabled = false,
  activeHint = null,
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

  // Measure available stage container and compute optimal square cell size
  const updateCellSize = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Reserve space for the outer arcade bezel + decorative arrows (approx 52px width, 52px height)
    const availW = Math.max(120, rect.width - 54);
    const availH = Math.max(120, rect.height - 54);
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
    const relX = e.clientX - rect.left - 6;
    const relY = e.clientY - rect.top - 6;
    const col = Math.max(0, Math.min(cols - 1, Math.floor(relX / stepSizePx)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(relY / stepSizePx)));

    if (editorPaintMode) {
      isPaintingRef.current = true;
      lastPaintedCellRef.current = `${row},${col}`;
      onCellPaint?.(row, col);
      return;
    }

    if (dragRef.current?.isCommitting) {
      return;
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

    if (editorPaintMode) {
      if (!isPaintingRef.current) return;
      const tray = trayRef.current;
      if (!tray) return;
      const rect = tray.getBoundingClientRect();
      const relX = e.clientX - rect.left - 6;
      const relY = e.clientY - rect.top - 6;
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

    const dx = e.clientX - current.startX;
    const dy = e.clientY - current.startY;
    const lockThreshold = cellSize * 0.3;

    let axis = current.axis;
    let lineIndex = current.lineIndex;

    if (!axis) {
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

    const offsetPx = axis === 'row' ? dx : dy;
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

    const netCells = Math.round(current.offsetPx / stepSizePx);
    const targetOffsetPx = netCells * stepSizePx;

    const committingState: DragState = {
      ...current,
      offsetPx: targetOffsetPx,
      isCommitting: true,
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

  const renderBlockTile = (
    block: CellBlock,
    isMatched: boolean,
    key: string,
    extraStyle?: React.CSSProperties
  ) => {
    const isNeutral = block === 'neutral';
    const tileClass = isNeutral ? 'pixel-tile-neutral' : `pixel-tile-${block}`;

    return (
      <div
        key={key}
        style={{
          width: cellSize,
          height: cellSize,
          ...extraStyle,
        }}
        className={`relative flex items-center justify-center rounded-[2px] select-none ${tileClass} ${
          isMatched ? 'animate-snap-pop' : ''
        }`}
      >
        {isNeutral ? (
          <div className="w-2 h-2 bg-[#BCB199] rounded-[1px]" />
        ) : (
          <>
            {colorblindMode && (
              <ColorblindShapeIcon
                color={block}
                fill="rgba(255, 255, 255, 0.55)"
                size="42%"
              />
            )}
            {isMatched && (
              <div
                className="pointer-events-none absolute inset-0 rounded-[2px]"
                style={{
                  border: '2px solid #FFFFFF',
                  boxShadow: 'inset 0 0 0 1px rgba(44,37,35,0.4)',
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

  // Compute active line drag decomposition (base integer cell shift + fractional remainder in (-stepSizePx, +stepSizePx))
  const getActiveLineRenderData = () => {
    if (!drag || !drag.axis) return null;
    const L = drag.axis === 'row' ? cols : rows;
    const baseCells = Math.trunc(drag.offsetPx / stepSizePx);
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
            }}
            className={`relative pixel-tray-inset border-[3px] border-[#2C2523] overflow-hidden ${
              editorPaintMode ? 'cursor-crosshair' : disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            {/* Layer 1: Static Target Frames (Always Fixed in Place) */}
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const targetColor = frames[r]?.[c] ?? null;
                const currentBlock = grid[r]?.[c] ?? 'neutral';
                const isLineDragging =
                  (drag?.axis === 'row' && drag.lineIndex === r) ||
                  (drag?.axis === 'col' && drag.lineIndex === c);
                const isMatched =
                  !isLineDragging && targetColor !== null && currentBlock === targetColor;

                const left = 6 + c * stepSizePx;
                const top = 6 + r * stepSizePx;

                return (
                  <div
                    key={`frame-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: cellSize,
                      height: cellSize,
                    }}
                    className="pointer-events-none flex items-center justify-center"
                  >
                    {targetColor !== null && (
                      <div
                        className={`w-full h-full flex items-center justify-center rounded-[2px] slot-${targetColor}`}
                        style={{
                          borderStyle: isMatched ? 'solid' : 'dashed',
                          borderWidth: isMatched ? '3px' : '2.5px',
                          borderColor: COLOR_HEX_MAP[targetColor].slotBorder,
                          backgroundColor: COLOR_HEX_MAP[targetColor].slotTint,
                          zIndex: 5,
                        }}
                      >
                        {/* Center target pip when unoccupied */}
                        {!isMatched &&
                          (colorblindMode ? (
                            <ColorblindShapeIcon
                              color={targetColor}
                              fill={COLOR_HEX_MAP[targetColor].slotBorder}
                              size="34%"
                            />
                          ) : (
                            <div
                              className="w-2.5 h-2.5 rounded-[1px]"
                              style={{
                                backgroundColor: COLOR_HEX_MAP[targetColor].slotBorder,
                              }}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Layer 2A: Non-Dragging Movable Blocks */}
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
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: cellSize,
                      height: cellSize,
                      zIndex: 10,
                    }}
                  >
                    {renderBlockTile(block, isMatched, `tile-${r}-${c}`)}
                    {/* Target Frame Overlay Ring so fixed frame dashed outline stays visible over blocks */}
                    {targetColor !== null && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-[2px]"
                        style={{
                          border: isMatched
                            ? `3px solid ${COLOR_HEX_MAP[targetColor].slotBorder}`
                            : `2.5px dashed ${COLOR_HEX_MAP[targetColor].slotBorder}`,
                          boxShadow: isMatched ? '0 0 0 1.5px #FFFFFF inset' : 'none',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}

            {/* Layer 2B: Active Dragging Row or Column Strip with Wrap-Around Ghost Tiles (-1 .. L) */}
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
                        {renderBlockTile(block, false, `drag-tile-${slotIdx}`)}
                      </div>
                    );
                  }
                )}

                {/* Keep fixed target frame wireframes visible above the sliding blocks */}
                {Array.from({ length: activeLineData.L }).map((_, idx) => {
                  const r = drag.axis === 'row' ? drag.lineIndex : idx;
                  const c = drag.axis === 'row' ? idx : drag.lineIndex;
                  const targetColor = frames[r]?.[c] ?? null;
                  if (targetColor === null) return null;
                  return (
                    <div
                      key={`drag-frame-top-${idx}`}
                      className="pointer-events-none absolute rounded-[2px]"
                      style={{
                        left: 6 + c * stepSizePx,
                        top: 6 + r * stepSizePx,
                        width: cellSize,
                        height: cellSize,
                        border: `2.5px dashed ${COLOR_HEX_MAP[targetColor].slotBorder}`,
                      }}
                    />
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

