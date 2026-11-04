import { solveIDAStar, type SolveResult } from './solver';
import type { BlockColor, CellBlock, ColorSlotIndex } from './types';

export interface SolverWorkerRequest {
  requestId: number;
  grid: (CellBlock | ColorSlotIndex)[][];
  frames: (BlockColor | ColorSlotIndex | null)[][];
  maxTimeMs?: number;
  maxDepth?: number;
}

export interface SolverWorkerResponse {
  requestId: number;
  result: SolveResult;
}

self.onmessage = (event: MessageEvent<SolverWorkerRequest>) => {
  const { requestId, grid, frames, maxTimeMs = 200, maxDepth = 8 } = event.data;
  const result = solveIDAStar(grid, frames, maxTimeMs, maxDepth);
  const response: SolverWorkerResponse = {
    requestId,
    result,
  };
  self.postMessage(response);
};

