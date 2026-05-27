// ============================================================================
// NFCC Digital Twin - A* Pathfinding Algorithm
// ============================================================================
// Pure TypeScript implementation of A* pathfinding for evacuation route planning.
// Uses Manhattan distance heuristic and 4-directional movement.
// No external libraries.
// ============================================================================

import type { PathfindingResult } from '../types/index';

interface Node {
  row: number;
  col: number;
  g: number; // cost from start
  h: number; // heuristic (Manhattan distance to end)
  f: number; // g + h
  parent: Node | null;
}

/**
 * Compute Manhattan distance between two grid positions.
 */
export function manhattanDistance(
  a: [number, number],
  b: [number, number]
): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

/**
 * Create a unique key for a grid position (for use in Sets/Maps).
 */
function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * 4-directional movement offsets: up, down, left, right.
 */
const DIRECTIONS: [number, number][] = [
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

/**
 * Reconstruct path from end node by following parent pointers.
 */
function reconstructPath(endNode: Node): [number, number][] {
  const path: [number, number][] = [];
  let current: Node | null = endNode;

  while (current !== null) {
    path.unshift([current.row, current.col]);
    current = current.parent;
  }

  return path;
}

/**
 * Find the node with the lowest f-score in the open set.
 * Uses linear scan (sufficient for grid-based pathfinding).
 */
function findLowestF(openSet: Node[]): number {
  let lowestIndex = 0;
  let lowestF = openSet[0]!.f;

  for (let i = 1; i < openSet.length; i++) {
    const f = openSet[i]!.f;
    if (f < lowestF) {
      lowestF = f;
      lowestIndex = i;
    }
  }

  return lowestIndex;
}

/**
 * Run A* pathfinding on a 2D grid.
 *
 * @param grid - 2D boolean array where true = walkable, false = blocked
 * @param start - Starting position [row, col]
 * @param end - Ending position [row, col]
 * @param blocked - Additional blocked positions (e.g., dynamic obstacles)
 * @returns PathfindingResult with path waypoints and cost
 */
export function aStarPathfinding(
  grid: boolean[][],
  start: [number, number],
  end: [number, number],
  blocked: [number, number][] = []
): PathfindingResult {
  const rows = grid.length;
  if (rows === 0) {
    return { path: [], cost: -1, blocked };
  }
  const cols = grid[0]!.length;
  if (cols === 0) {
    return { path: [], cost: -1, blocked };
  }

  // Validate start and end positions
  if (
    start[0] < 0 || start[0] >= rows ||
    start[1] < 0 || start[1] >= cols ||
    end[0] < 0 || end[0] >= rows ||
    end[1] < 0 || end[1] >= cols
  ) {
    return { path: [], cost: -1, blocked };
  }

  // Check if start or end is blocked
  if (!grid[start[0]]![start[1]] || !grid[end[0]]![end[1]]) {
    return { path: [], cost: -1, blocked };
  }

  // Build blocked set for O(1) lookup
  const blockedSet = new Set<string>(
    blocked.map(([r, c]) => posKey(r, c))
  );

  // Check if start or end is in the dynamic blocked list
  if (blockedSet.has(posKey(start[0], start[1])) || blockedSet.has(posKey(end[0], end[1]))) {
    return { path: [], cost: -1, blocked };
  }

  // Start and end are the same
  if (start[0] === end[0] && start[1] === end[1]) {
    return { path: [start], cost: 0, blocked };
  }

  const startNode: Node = {
    row: start[0],
    col: start[1],
    g: 0,
    h: manhattanDistance(start, end),
    f: manhattanDistance(start, end),
    parent: null,
  };

  const openSet: Node[] = [startNode];
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();
  gScores.set(posKey(start[0], start[1]), 0);

  while (openSet.length > 0) {
    const currentIndex = findLowestF(openSet);
    const current = openSet[currentIndex]!;

    // Check if we reached the end
    if (current.row === end[0] && current.col === end[1]) {
      const path = reconstructPath(current);
      return { path, cost: path.length - 1, blocked };
    }

    // Move current from open to closed
    openSet.splice(currentIndex, 1);
    const currentKey = posKey(current.row, current.col);
    closedSet.add(currentKey);

    // Explore neighbors
    for (const [dr, dc] of DIRECTIONS) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;

      // Bounds check
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
        continue;
      }

      const neighborKey = posKey(newRow, newCol);

      // Skip if in closed set
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Skip if not walkable
      if (!grid[newRow]![newCol]) {
        continue;
      }

      // Skip if dynamically blocked
      if (blockedSet.has(neighborKey)) {
        continue;
      }

      const tentativeG = current.g + 1;
      const existingG = gScores.get(neighborKey);

      if (existingG !== undefined && tentativeG >= existingG) {
        continue;
      }

      gScores.set(neighborKey, tentativeG);

      const h = manhattanDistance([newRow, newCol], end);
      const neighborNode: Node = {
        row: newRow,
        col: newCol,
        g: tentativeG,
        h,
        f: tentativeG + h,
        parent: current,
      };

      // Check if already in open set and update, or add new
      const existingOpenIndex = openSet.findIndex(
        (n) => n.row === newRow && n.col === newCol
      );

      if (existingOpenIndex >= 0) {
        openSet[existingOpenIndex] = neighborNode;
      } else {
        openSet.push(neighborNode);
      }
    }
  }

  // No path found
  return { path: [], cost: -1, blocked };
}
