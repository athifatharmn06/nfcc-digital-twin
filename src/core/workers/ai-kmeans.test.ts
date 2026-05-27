// ============================================================================
// NFCC Digital Twin - K-Means Algorithm Unit Tests
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  pointInPolygon,
  assignClusters,
  recomputeCentroids,
  hasConverged,
  kMeans,
} from './ai-kmeans';

describe('euclideanDistance', () => {
  it('returns 0 for identical points', () => {
    expect(euclideanDistance([0, 0], [0, 0])).toBe(0);
    expect(euclideanDistance([5, 3], [5, 3])).toBe(0);
  });

  it('computes correct distance for axis-aligned points', () => {
    expect(euclideanDistance([0, 0], [3, 0])).toBe(3);
    expect(euclideanDistance([0, 0], [0, 4])).toBe(4);
  });

  it('computes correct distance for diagonal points (3-4-5 triangle)', () => {
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
  });

  it('is symmetric', () => {
    const a: [number, number] = [1, 2];
    const b: [number, number] = [4, 6];
    expect(euclideanDistance(a, b)).toBe(euclideanDistance(b, a));
  });
});

describe('pointInPolygon', () => {
  const square: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];

  it('returns true for a point inside a square', () => {
    expect(pointInPolygon([5, 5], square)).toBe(true);
  });

  it('returns false for a point outside a square', () => {
    expect(pointInPolygon([15, 5], square)).toBe(false);
    expect(pointInPolygon([-1, 5], square)).toBe(false);
  });

  it('returns true for a point inside a triangle', () => {
    const triangle: [number, number][] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ];
    expect(pointInPolygon([5, 3], triangle)).toBe(true);
  });

  it('returns false for a point outside a triangle', () => {
    const triangle: [number, number][] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ];
    expect(pointInPolygon([0, 10], triangle)).toBe(false);
  });

  it('handles concave polygons', () => {
    // L-shaped polygon
    const lShape: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 5],
      [5, 5],
      [5, 10],
      [0, 10],
    ];
    expect(pointInPolygon([2, 2], lShape)).toBe(true);
    expect(pointInPolygon([2, 8], lShape)).toBe(true);
    expect(pointInPolygon([8, 8], lShape)).toBe(false);
  });
});

describe('assignClusters', () => {
  it('assigns each point to the nearest centroid', () => {
    const points: [number, number][] = [
      [0, 0],
      [1, 1],
      [10, 10],
      [11, 11],
    ];
    const centroids: [number, number][] = [
      [0, 0],
      [10, 10],
    ];

    const assignments = assignClusters(points, centroids);
    expect(assignments).toEqual([0, 0, 1, 1]);
  });

  it('handles single centroid', () => {
    const points: [number, number][] = [
      [1, 1],
      [5, 5],
      [9, 9],
    ];
    const centroids: [number, number][] = [[5, 5]];

    const assignments = assignClusters(points, centroids);
    expect(assignments).toEqual([0, 0, 0]);
  });

  it('assigns equidistant point to first centroid (tie-breaking)', () => {
    const points: [number, number][] = [[5, 0]];
    const centroids: [number, number][] = [
      [0, 0],
      [10, 0],
    ];

    const assignments = assignClusters(points, centroids);
    // Both are distance 5, first one wins
    expect(assignments).toEqual([0]);
  });
});

describe('recomputeCentroids', () => {
  it('computes mean of assigned points', () => {
    const points: [number, number][] = [
      [0, 0],
      [2, 2],
      [10, 10],
      [12, 12],
    ];
    const assignments = [0, 0, 1, 1];
    const previousCentroids: [number, number][] = [
      [0, 0],
      [10, 10],
    ];

    const newCentroids = recomputeCentroids(points, assignments, 2, previousCentroids);
    expect(newCentroids[0]).toEqual([1, 1]);
    expect(newCentroids[1]).toEqual([11, 11]);
  });

  it('keeps previous centroid for empty clusters', () => {
    const points: [number, number][] = [
      [1, 1],
      [2, 2],
    ];
    const assignments = [0, 0]; // all assigned to cluster 0
    const previousCentroids: [number, number][] = [
      [0, 0],
      [10, 10],
    ];

    const newCentroids = recomputeCentroids(points, assignments, 2, previousCentroids);
    expect(newCentroids[0]).toEqual([1.5, 1.5]);
    expect(newCentroids[1]).toEqual([10, 10]); // unchanged
  });
});

describe('hasConverged', () => {
  it('returns true when centroids are identical', () => {
    const centroids: [number, number][] = [
      [1, 2],
      [3, 4],
    ];
    expect(hasConverged(centroids, centroids)).toBe(true);
  });

  it('returns false when centroids differ significantly', () => {
    const old: [number, number][] = [[0, 0]];
    const updated: [number, number][] = [[1, 1]];
    expect(hasConverged(old, updated)).toBe(false);
  });

  it('returns true for very small differences within tolerance', () => {
    const old: [number, number][] = [[1, 1]];
    const updated: [number, number][] = [[1 + 1e-8, 1 + 1e-8]];
    expect(hasConverged(old, updated)).toBe(true);
  });
});

describe('kMeans', () => {
  it('returns empty result for empty points', () => {
    const result = kMeans([], 3);
    expect(result.clusters).toEqual([]);
    expect(result.anomalies).toEqual([]);
  });

  it('returns empty result for k=0', () => {
    const result = kMeans([[1, 1], [2, 2]], 0);
    expect(result.clusters).toEqual([]);
    expect(result.anomalies).toEqual([]);
  });

  it('creates correct number of clusters', () => {
    const points: [number, number][] = [
      [0, 0], [1, 0], [0, 1],
      [10, 10], [11, 10], [10, 11],
      [20, 20], [21, 20], [20, 21],
    ];
    const result = kMeans(points, 3);
    expect(result.clusters.length).toBe(3);
  });

  it('assigns all points to clusters', () => {
    const points: [number, number][] = [
      [0, 0], [1, 1], [2, 2],
      [10, 10], [11, 11], [12, 12],
    ];
    const result = kMeans(points, 2);
    const totalPoints = result.clusters.reduce((sum, c) => sum + c.size, 0);
    expect(totalPoints).toBe(points.length);
  });

  it('handles k larger than number of points', () => {
    const points: [number, number][] = [[1, 1], [2, 2]];
    const result = kMeans(points, 5);
    // Should cap k at number of points
    expect(result.clusters.length).toBe(2);
  });

  it('detects anomaly when centroid is in restricted zone', () => {
    // Two tight clusters: one inside restricted zone, one outside
    const points: [number, number][] = [
      [5, 5], [5.1, 5.1], [4.9, 4.9], // cluster near (5,5) - inside zone
      [50, 50], [50.1, 50.1], [49.9, 49.9], // cluster near (50,50) - outside zone
    ];
    const zones = [
      {
        id: 'restricted-a',
        polygon: [[0, 0], [10, 0], [10, 10], [0, 10]] as [number, number][],
      },
    ];

    const result = kMeans(points, 2, zones);
    expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
    expect(result.anomalies[0]!.zone).toBe('restricted-a');
  });

  it('reports no anomalies when no centroids are in restricted zones', () => {
    const points: [number, number][] = [
      [50, 50], [51, 51], [49, 49],
    ];
    const zones = [
      {
        id: 'restricted-a',
        polygon: [[0, 0], [10, 0], [10, 10], [0, 10]] as [number, number][],
      },
    ];

    const result = kMeans(points, 1, zones);
    expect(result.anomalies.length).toBe(0);
  });

  it('cluster size matches points array length', () => {
    const points: [number, number][] = [
      [0, 0], [1, 0], [0, 1], [1, 1],
      [10, 10], [11, 10], [10, 11],
    ];
    const result = kMeans(points, 2);

    for (const cluster of result.clusters) {
      expect(cluster.size).toBe(cluster.points.length);
    }
  });
});
