// ============================================================================
// NFCC Digital Twin - AI Worker
// ============================================================================
// Web Worker for AI-powered anomaly detection (K-Means) and evacuation
// route planning (A* pathfinding). Runs in isolated worker context.
// ============================================================================

import { kMeans, type RestrictedZone } from './ai-kmeans';
import { aStarPathfinding } from './ai-pathfinding';
import type { KMeansResult, AnomalyAlert, PathfindingResult } from '../types/index';

// === Message Types ===

interface PIRDataMessage {
  type: 'PIR_DATA';
  points: [number, number][];
}

interface ComputeEvacuationMessage {
  type: 'COMPUTE_EVACUATION';
  grid: boolean[][];
  start: [number, number];
  end: [number, number];
  blocked: [number, number][];
}

interface SetRestrictedZonesMessage {
  type: 'SET_RESTRICTED_ZONES';
  zones: RestrictedZone[];
}

type IncomingMessage = PIRDataMessage | ComputeEvacuationMessage | SetRestrictedZonesMessage;

// === Outgoing Message Types ===

interface AnomalyAlertMessage {
  type: 'ANOMALY_ALERT';
  alert: AnomalyAlert;
}

interface KMeansResultMessage {
  type: 'KMEANS_RESULT';
  result: KMeansResult;
}

interface EvacuationRouteMessage {
  type: 'EVACUATION_ROUTE';
  result: PathfindingResult;
}

type OutgoingMessage = AnomalyAlertMessage | KMeansResultMessage | EvacuationRouteMessage;

// === Worker State ===

let restrictedZones: RestrictedZone[] = [];
const DEFAULT_K = 5;

// === Message Handler ===

function handleMessage(data: IncomingMessage): void {
  switch (data.type) {
    case 'PIR_DATA': {
      handlePIRData(data.points);
      break;
    }
    case 'COMPUTE_EVACUATION': {
      handleEvacuation(data.grid, data.start, data.end, data.blocked);
      break;
    }
    case 'SET_RESTRICTED_ZONES': {
      restrictedZones = data.zones;
      break;
    }
  }
}

/**
 * Process PIR sensor data: run K-Means clustering and check for anomalies.
 */
function handlePIRData(points: [number, number][]): void {
  if (points.length === 0) {
    return;
  }

  const k = Math.min(DEFAULT_K, points.length);
  const result = kMeans(points, k, restrictedZones);

  // Post clustering result
  postOutgoing({ type: 'KMEANS_RESULT', result });

  // Post individual anomaly alerts
  for (const alert of result.anomalies) {
    postOutgoing({ type: 'ANOMALY_ALERT', alert });
  }
}

/**
 * Compute evacuation route using A* pathfinding.
 */
function handleEvacuation(
  grid: boolean[][],
  start: [number, number],
  end: [number, number],
  blocked: [number, number][]
): void {
  const result = aStarPathfinding(grid, start, end, blocked);
  postOutgoing({ type: 'EVACUATION_ROUTE', result });
}

/**
 * Post a typed message back to the main thread.
 */
function postOutgoing(message: OutgoingMessage): void {
  self.postMessage(message);
}

// === Worker Entry Point ===

self.onmessage = (event: MessageEvent<IncomingMessage>): void => {
  handleMessage(event.data);
};
