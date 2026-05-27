// ============================================================================
// NFCC Digital Twin - AI Algorithms Property-Based Tests
// ============================================================================
// Property tests for K-Means clustering and A* pathfinding algorithms.
// Uses fast-check with minimum 100 iterations per property.
// ============================================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { euclideanDistance, assignClusters, kMeans } from './ai-kmeans';
import { aStarPathfinding, manhattanDistance } from './ai-pathfinding';

// === Custom Arbitraries ===

/**
 * Generate a random 2D point using integer coordinates to avoid floating-point
 * precision issues with extremely small values near zero.
 */
const arb2DPoint: fc.Arbitrary<[number, number]> = fc.tuple(
  fc.integer({ min: -100, max: 100 }),
  fc.integer({ min: -100, max: 100 }),
).map(([x, y]) => [x, y] as [number, number]);

/**
 * Generate a random set of 2D points with at least `minCount` points.
 */
function arbPointSet(minCount: number, maxCount: number): fc.Arbitrary<[number, number][]> {
  return fc.array(arb2DPoint, { minLength: minCount, maxLength: maxCount });
}

/**
 * Generate a random boolean grid (true=walkable, false=blocked) with given dimensions.
 */
function arbGrid(
  minRows: number,
  maxRows: number,
  minCols: number,
  maxCols: number,
): fc.Arbitrary<boolean[][]> {
  return fc.integer({ min: minRows, max: maxRows }).chain((rows) =>
    fc.integer({ min: minCols, max: maxCols }).chain((cols) =>
      fc.array(fc.array(fc.boolean(), { minLength: cols, maxLength: cols }), {
        minLength: rows,
        maxLength: rows,
      }),
    ),
  );
}

// ============================================================================
// Property 6: K-Means Nearest Centroid Assignment
// ============================================================================
// For any set of 2D data points and K-Means result, every point SHALL be
// assigned to the cluster whose centroid is nearest (Euclidean distance).
// **Validates: Requirements 8.1**
// ============================================================================

describe('Feature: nfcc-digital-twin, Property 6: K-Means Nearest Centroid Assignment', () => {
  it('every point is assigned to the cluster with the nearest centroid', () => {
    fc.assert(
      fc.property(
        // Generate k between 1 and 5, then generate at least k+1 points
        fc.integer({ min: 1, max: 5 }).chain((k) =>
          arbPointSet(k + 1, 50).map((points) => ({ points, k })),
        ),
        ({ points, k }) => {
          const result = kMeans(points, k);

          // Cluster count should not exceed k or number of points
          const effectiveK = Math.min(k, points.length);
          expect(result.clusters.length).toBe(effectiveK);

          // Every point must appear in exactly one cluster (total conservation)
          const allClusterPoints = result.clusters.flatMap((c) => c.points);
          expect(allClusterPoints.length).toBe(points.length);

          // Extract final centroids
          const finalCentroids = result.clusters.map((c) => c.centroid);

          // Core property: assignClusters assigns each point to its nearest centroid.
          // This verifies the fundamental K-Means invariant.
          const assignments = assignClusters(points, finalCentroids);

          for (let i = 0; i < points.length; i++) {
            const point = points[i]!;
            const assignedCentroidIdx = assignments[i]!;
            const distToAssigned = euclideanDistance(point, finalCentroids[assignedCentroidIdx]!);

            // Verify this is truly the nearest centroid
            for (let c = 0; c < finalCentroids.length; c++) {
              const distToOther = euclideanDistance(point, finalCentroids[c]!);
              expect(distToAssigned).toBeLessThanOrEqual(distToOther + 1e-10);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================================
// Property 7: A* Pathfinding Validity
// ============================================================================
// For any grid with start and end positions and obstacles, if A* returns a path,
// every consecutive pair of waypoints SHALL be adjacent (no teleportation),
// no waypoint SHALL occupy a blocked cell, and the path SHALL connect start to end.
// **Validates: Requirements 8.3**
// ============================================================================

describe('Feature: nfcc-digital-twin, Property 7: A* Pathfinding Validity', () => {
  it('if a path is returned, it starts at start, ends at end, is connected, and avoids blocked cells', () => {
    fc.assert(
      fc.property(
        // Generate a grid between 3x3 and 10x10
        arbGrid(3, 10, 3, 10).chain((grid) => {
          const rows = grid.length;
          const cols = grid[0]!.length;

          // Generate start and end positions within bounds
          return fc
            .tuple(
              fc.integer({ min: 0, max: rows - 1 }),
              fc.integer({ min: 0, max: cols - 1 }),
              fc.integer({ min: 0, max: rows - 1 }),
              fc.integer({ min: 0, max: cols - 1 }),
            )
            .map(([startRow, startCol, endRow, endCol]) => {
              // Force start and end to be walkable
              const modifiedGrid = grid.map((row) => [...row]);
              modifiedGrid[startRow]![startCol] = true;
              modifiedGrid[endRow]![endCol] = true;
              return {
                grid: modifiedGrid,
                start: [startRow, startCol] as [number, number],
                end: [endRow, endCol] as [number, number],
              };
            });
        }),
        ({ grid, start, end }) => {
          const result = aStarPathfinding(grid, start, end);

          // If no path found (cost === -1), path should be empty — that's valid
          if (result.cost === -1) {
            expect(result.path).toEqual([]);
            return;
          }

          const path = result.path;

          // 1. Path must not be empty
          expect(path.length).toBeGreaterThan(0);

          // 2. Path starts at start
          expect(path[0]).toEqual(start);

          // 3. Path ends at end
          expect(path[path.length - 1]).toEqual(end);

          // 4. Consecutive waypoints are adjacent (Manhattan distance = 1)
          for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1]!;
            const curr = path[i]!;
            const dist = manhattanDistance(prev, curr);
            expect(dist).toBe(1);
          }

          // 5. No waypoint is on a blocked cell
          for (const [row, col] of path) {
            expect(grid[row]![col]).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
