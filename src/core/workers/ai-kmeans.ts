// ============================================================================
// NFCC Digital Twin - K-Means Clustering Algorithm
// ============================================================================
// Pure TypeScript implementation of K-Means clustering for PIR anomaly detection.
// No external ML libraries.
// ============================================================================

import type { Cluster, KMeansResult, AnomalyAlert } from '../types/index';

export interface RestrictedZone {
  id: string;
  polygon: [number, number][];
}

const MAX_ITERATIONS = 50;

/**
 * Compute Euclidean distance between two 2D points.
 */
export function euclideanDistance(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is inside a polygon using the ray-casting algorithm.
 * Returns true if the point lies within the polygon boundary.
 */
export function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [px, py] = point;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Initialize centroids by randomly selecting k distinct points from the input.
 * Uses Fisher-Yates partial shuffle for unbiased selection.
 */
export function initializeCentroids(
  points: [number, number][],
  k: number
): [number, number][] {
  const indices = points.map((_, i) => i);
  const centroids: [number, number][] = [];

  for (let i = 0; i < k && i < points.length; i++) {
    const randomIndex = i + Math.floor(Math.random() * (indices.length - i));
    const temp = indices[randomIndex]!;
    indices[randomIndex] = indices[i]!;
    indices[i] = temp;
    const point = points[temp]!;
    centroids.push([point[0], point[1]]);
  }

  return centroids;
}

/**
 * Assign each point to the nearest centroid.
 * Returns an array of cluster indices (one per point).
 */
export function assignClusters(
  points: [number, number][],
  centroids: [number, number][]
): number[] {
  return points.map((point) => {
    let minDist = Infinity;
    let minIndex = 0;

    for (let i = 0; i < centroids.length; i++) {
      const dist = euclideanDistance(point, centroids[i]!);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }

    return minIndex;
  });
}

/**
 * Recompute centroids as the mean of all points assigned to each cluster.
 * If a cluster has no points, its centroid remains unchanged.
 */
export function recomputeCentroids(
  points: [number, number][],
  assignments: number[],
  k: number,
  previousCentroids: [number, number][]
): [number, number][] {
  const sums: [number, number][] = Array.from({ length: k }, () => [0, 0]);
  const counts: number[] = Array.from({ length: k }, () => 0);

  for (let i = 0; i < points.length; i++) {
    const cluster = assignments[i]!;
    const point = points[i]!;
    sums[cluster]![0] += point[0];
    sums[cluster]![1] += point[1];
    counts[cluster]!++;
  }

  return sums.map((sum, i): [number, number] => {
    const count = counts[i]!;
    if (count === 0) {
      return previousCentroids[i]!;
    }
    return [sum[0] / count, sum[1] / count];
  });
}

/**
 * Check if centroids have converged (no movement beyond tolerance).
 */
export function hasConverged(
  oldCentroids: [number, number][],
  newCentroids: [number, number][],
  tolerance: number = 1e-6
): boolean {
  for (let i = 0; i < oldCentroids.length; i++) {
    if (euclideanDistance(oldCentroids[i]!, newCentroids[i]!) > tolerance) {
      return false;
    }
  }
  return true;
}

/**
 * Run K-Means clustering on a set of 2D points.
 *
 * @param points - Array of 2D points [x, y]
 * @param k - Number of clusters
 * @param restrictedZones - Polygons defining restricted areas
 * @returns KMeansResult with clusters and anomaly alerts
 */
export function kMeans(
  points: [number, number][],
  k: number,
  restrictedZones: RestrictedZone[] = []
): KMeansResult {
  if (points.length === 0 || k <= 0) {
    return { clusters: [], anomalies: [] };
  }

  const effectiveK = Math.min(k, points.length);
  let centroids = initializeCentroids(points, effectiveK);
  let assignments: number[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    assignments = assignClusters(points, centroids);
    const newCentroids = recomputeCentroids(points, assignments, effectiveK, centroids);

    if (hasConverged(centroids, newCentroids)) {
      centroids = newCentroids;
      break;
    }

    centroids = newCentroids;
  }

  // Build cluster objects
  const clusters: Cluster[] = centroids.map((centroid, _i): Cluster => ({
    centroid,
    points: [],
    size: 0,
  }));

  for (let i = 0; i < points.length; i++) {
    const clusterIndex = assignments[i]!;
    clusters[clusterIndex]!.points.push(points[i]!);
    clusters[clusterIndex]!.size++;
  }

  // Check for anomalies: centroids in restricted zones
  const anomalies: AnomalyAlert[] = [];

  for (const cluster of clusters) {
    for (const zone of restrictedZones) {
      if (pointInPolygon(cluster.centroid, zone.polygon)) {
        // Confidence based on cluster density (more points = higher confidence)
        const confidence = Math.min(cluster.size / points.length, 1.0);
        anomalies.push({
          zone: zone.id,
          centroid: cluster.centroid,
          confidence,
          timestamp: Date.now(),
        });
      }
    }
  }

  return { clusters, anomalies };
}
