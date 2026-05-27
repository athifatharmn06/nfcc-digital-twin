// ============================================================================
// NFCC Digital Twin - A* Pathfinding Algorithm Unit Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import { manhattanDistance, aStarPathfinding } from './ai-pathfinding';

describe('manhattanDistance', () => {
  it('returns 0 for identical points', () => {
    expect(manhattanDistance([0, 0], [0, 0])).toBe(0);
    expect(manhattanDistance([5, 3], [5, 3])).toBe(0);
  });

  it('computes correct distance for axis-aligned points', () => {
    expect(manhattanDistance([0, 0], [3, 0])).toBe(3);
    expect(manhattanDistance([0, 0], [0, 4])).toBe(4);
  });

  it('computes correct distance for diagonal points', () => {
    expect(manhattanDistance([0, 0], [3, 4])).toBe(7);
  });

  it('is symmetric', () => {
    expect(manhattanDistance([1, 2], [4, 6])).toBe(manhattanDistance([4, 6], [1, 2]));
  });
});

describe('aStarPathfinding', () => {
  it('returns path of length 0 when start equals end', () => {
    const grid = [[true, true], [true, true]];
    const result = aStarPathfinding(grid, [0, 0], [0, 0]);
    expect(result.path).toEqual([[0, 0]]);
    expect(result.cost).toBe(0);
  });

  it('finds direct path in open grid', () => {
    const grid = [
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ];
    const result = aStarPathfinding(grid, [0, 0], [2, 2]);
    expect(result.cost).toBe(4); // Manhattan distance
    expect(result.path.length).toBe(5);
    expect(result.path[0]).toEqual([0, 0]);
    expect(result.path[result.path.length - 1]).toEqual([2, 2]);
  });

  it('navigates around obstacles', () => {
    const grid = [
      [true, true, true],
      [false, false, true],
      [true, true, true],
    ];
    const result = aStarPathfinding(grid, [0, 0], [2, 0]);
    expect(result.cost).toBeGreaterThan(-1);
    expect(result.path[0]).toEqual([0, 0]);
    expect(result.path[result.path.length - 1]).toEqual([2, 0]);

    // Verify no waypoint is on a blocked cell
    for (const [row, col] of result.path) {
      expect(grid[row]![col]).toBe(true);
    }
  });

  it('returns cost -1 when no path exists', () => {
    const grid = [
      [true, false, true],
      [true, false, true],
      [true, false, true],
    ];
    const result = aStarPathfinding(grid, [0, 0], [0, 2]);
    expect(result.path).toEqual([]);
    expect(result.cost).toBe(-1);
  });

  it('returns cost -1 when start is blocked', () => {
    const grid = [
      [false, true],
      [true, true],
    ];
    const result = aStarPathfinding(grid, [0, 0], [1, 1]);
    expect(result.cost).toBe(-1);
  });

  it('returns cost -1 when end is blocked', () => {
    const grid = [
      [true, true],
      [true, false],
    ];
    const result = aStarPathfinding(grid, [0, 0], [1, 1]);
    expect(result.cost).toBe(-1);
  });

  it('returns cost -1 for empty grid', () => {
    const result = aStarPathfinding([], [0, 0], [0, 0]);
    expect(result.cost).toBe(-1);
  });

  it('returns cost -1 for out-of-bounds start', () => {
    const grid = [[true, true], [true, true]];
    const result = aStarPathfinding(grid, [-1, 0], [1, 1]);
    expect(result.cost).toBe(-1);
  });

  it('returns cost -1 for out-of-bounds end', () => {
    const grid = [[true, true], [true, true]];
    const result = aStarPathfinding(grid, [0, 0], [5, 5]);
    expect(result.cost).toBe(-1);
  });

  it('respects dynamically blocked cells', () => {
    const grid = [
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ];
    // Block the middle row dynamically
    const blocked: [number, number][] = [[1, 0], [1, 1], [1, 2]];
    const result = aStarPathfinding(grid, [0, 0], [2, 0], blocked);
    expect(result.cost).toBe(-1);
  });

  it('path has consecutive adjacent waypoints (no teleportation)', () => {
    const grid = [
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
      [true, false, false, false, true],
      [true, true, true, true, true],
    ];
    const result = aStarPathfinding(grid, [0, 0], [4, 4]);
    expect(result.cost).toBeGreaterThan(-1);

    // Verify adjacency
    for (let i = 1; i < result.path.length; i++) {
      const prev = result.path[i - 1]!;
      const curr = result.path[i]!;
      const rowDiff = Math.abs(curr[0] - prev[0]);
      const colDiff = Math.abs(curr[1] - prev[1]);
      // Must be exactly 1 step in one direction
      expect(rowDiff + colDiff).toBe(1);
    }
  });

  it('finds optimal path in a corridor', () => {
    // Long corridor
    const grid = [
      [true, true, true, true, true, true, true, true, true, true],
    ];
    const result = aStarPathfinding(grid, [0, 0], [0, 9]);
    expect(result.cost).toBe(9);
    expect(result.path.length).toBe(10);
  });

  it('handles single-cell grid', () => {
    const grid = [[true]];
    const result = aStarPathfinding(grid, [0, 0], [0, 0]);
    expect(result.path).toEqual([[0, 0]]);
    expect(result.cost).toBe(0);
  });

  it('returns blocked positions in result', () => {
    const grid = [[true, true], [true, true]];
    const blocked: [number, number][] = [[0, 1]];
    const result = aStarPathfinding(grid, [0, 0], [1, 1], blocked);
    expect(result.blocked).toEqual(blocked);
  });
});
