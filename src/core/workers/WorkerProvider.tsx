// ============================================================================
// NFCC Digital Twin - WorkerProvider
// ============================================================================
// React component that instantiates all 3 Web Workers on mount, sets up
// onmessage handlers to route data (sensor → Float32Array, historian, alerts),
// provides a publishCommand function for UI actions, and handles worker errors
// with restart logic. Cleans up workers on unmount.
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';

import type {
  SensorNode,
  BrokerMessage,
  WorkerSource,
  TimeSeriesRecord,
  AnomalyAlert,
  DivisionId,
  Notification,
} from '../types/index';

import { updateSensorBuffer } from '../../three/SensorNodes';
import { writeBatch } from '../store/historian';
import { useNFCCStore } from '../store/useNFCCStore';

// === Worker Message Types (incoming from workers) ===

/** Message from PhysicsWorker containing updated sensor data */
interface PhysicsSensorUpdateMessage {
  type: 'SENSOR_UPDATE';
  data: SensorNode[];
}

/** Message from BrokerWorker delivering a routed message */
interface BrokerOutgoingMessage {
  type: 'MESSAGE';
  subscriberId: string;
  message: BrokerMessage;
}

/** Message from AIWorker: anomaly alert */
interface AIAnomalyAlertMessage {
  type: 'ANOMALY_ALERT';
  alert: AnomalyAlert;
}

/** Message from AIWorker: K-Means result */
interface AIKMeansResultMessage {
  type: 'KMEANS_RESULT';
  result: unknown;
}

/** Message from AIWorker: evacuation route */
interface AIEvacuationRouteMessage {
  type: 'EVACUATION_ROUTE';
  result: unknown;
}

type PhysicsWorkerMessage = PhysicsSensorUpdateMessage;
type BrokerWorkerMessage = BrokerOutgoingMessage;
type AIWorkerMessage = AIAnomalyAlertMessage | AIKMeansResultMessage | AIEvacuationRouteMessage;

// === Context Interface ===

export interface WorkerContextValue {
  /** Publish a command through the BrokerWorker to target workers */
  publishCommand: (topic: string, payload: unknown) => void;
  /** Send a message directly to the PhysicsWorker */
  postToPhysics: (message: unknown) => void;
  /** Send a message directly to the AIWorker */
  postToAI: (message: unknown) => void;
}

const WorkerContext = createContext<WorkerContextValue | null>(null);

// === Constants ===

const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY_MS = 1000;
const HISTORIAN_BATCH_INTERVAL_MS = 2000;
const HISTORIAN_BATCH_SIZE = 500;

// === Helper: Create a worker with error handling ===

type WorkerFactory = () => Worker;

// === WorkerProvider Component ===

interface WorkerProviderProps {
  children: ReactNode;
}

export function WorkerProvider({ children }: WorkerProviderProps): React.JSX.Element {
  const brokerRef = useRef<Worker | null>(null);
  const physicsRef = useRef<Worker | null>(null);
  const aiRef = useRef<Worker | null>(null);

  // Restart attempt counters
  const brokerRestarts = useRef(0);
  const physicsRestarts = useRef(0);
  const aiRestarts = useRef(0);

  // Historian batch buffer
  const historianBuffer = useRef<TimeSeriesRecord[]>([]);
  const historianTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get Zustand action (stable reference)
  const addNotification = useNFCCStore.getState().addNotification;

  // === Historian Batching ===

  const flushHistorianBuffer = useCallback((): void => {
    if (historianBuffer.current.length === 0) return;

    const batch = historianBuffer.current.splice(0, HISTORIAN_BATCH_SIZE);
    void writeBatch(batch);
  }, []);

  const enqueueHistorianRecords = useCallback((nodes: SensorNode[]): void => {
    const now = Date.now();
    // Sample a subset of nodes to avoid overwhelming IndexedDB
    // Write every 10th node to keep batch sizes manageable (500 records per flush)
    const step = Math.max(1, Math.floor(nodes.length / 50));

    for (let i = 0; i < nodes.length; i += step) {
      const node = nodes[i];
      if (!node) continue;

      const record: TimeSeriesRecord = {
        nodeId: node.id,
        zone: node.zone,
        value: node.presentValue,
        timestamp: now,
        type: node.objectType,
      };
      historianBuffer.current.push(record);
    }
  }, []);

  // === Worker Factory Functions ===

  const createBrokerWorker: WorkerFactory = useCallback((): Worker => {
    return new Worker(
      new URL('./broker.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }, []);

  const createPhysicsWorker: WorkerFactory = useCallback((): Worker => {
    return new Worker(
      new URL('./physics.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }, []);

  const createAIWorker: WorkerFactory = useCallback((): Worker => {
    return new Worker(
      new URL('./ai.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }, []);

  // === Message Handlers ===

  const handlePhysicsMessage = useCallback((event: MessageEvent<PhysicsWorkerMessage>): void => {
    const msg = event.data;

    if (msg.type === 'SENSOR_UPDATE') {
      // 1. Route sensor data to Float32Array buffers for 3D rendering
      updateSensorBuffer(msg.data);

      // 2. Enqueue sensor data for IndexedDB historian batch write
      enqueueHistorianRecords(msg.data);

      // 3. Forward sensor data to BrokerWorker for topic-based routing
      const broker = brokerRef.current;
      if (broker) {
        broker.postMessage({
          type: 'PUBLISH',
          topic: 'sensor/update',
          payload: msg.data,
          source: 'physics' as WorkerSource,
        });
      }
    }
  }, [enqueueHistorianRecords]);

  const handleBrokerMessage = useCallback((event: MessageEvent<BrokerWorkerMessage>): void => {
    const msg = event.data;

    if (msg.type === 'MESSAGE') {
      // Route broker messages based on topic
      const { topic, payload } = msg.message;

      if (topic.startsWith('alert/')) {
        // Convert alert to notification and push to Zustand store
        const alert = payload as AnomalyAlert;
        const notification: Notification = {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'WARNING',
          title: 'Anomaly Detected',
          message: `Anomaly in ${alert.zone} (confidence: ${(alert.confidence * 100).toFixed(0)}%)`,
          division: 2 as DivisionId,
          timestamp: alert.timestamp,
        };
        addNotification(notification);
      }
    }
  }, [addNotification]);

  const handleAIMessage = useCallback((event: MessageEvent<AIWorkerMessage>): void => {
    const msg = event.data;

    switch (msg.type) {
      case 'ANOMALY_ALERT': {
        // Push anomaly alert as notification to Zustand store
        const alert = msg.alert;
        const notification: Notification = {
          id: `anomaly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'CRITICAL',
          title: 'AI Anomaly Alert',
          message: `Anomalous movement detected in ${alert.zone} (confidence: ${(alert.confidence * 100).toFixed(0)}%)`,
          division: 2 as DivisionId,
          timestamp: alert.timestamp,
        };
        addNotification(notification);

        // Also forward to BrokerWorker for other subscribers
        const broker = brokerRef.current;
        if (broker) {
          broker.postMessage({
            type: 'PUBLISH',
            topic: `alert/anomaly/${alert.zone}`,
            payload: alert,
            source: 'ai' as WorkerSource,
          });
        }
        break;
      }

      case 'KMEANS_RESULT': {
        // Forward K-Means results through broker for subscribers
        const broker = brokerRef.current;
        if (broker) {
          broker.postMessage({
            type: 'PUBLISH',
            topic: 'ai/kmeans/result',
            payload: msg.result,
            source: 'ai' as WorkerSource,
          });
        }
        break;
      }

      case 'EVACUATION_ROUTE': {
        // Forward evacuation route through broker for 3D visualization
        const broker = brokerRef.current;
        if (broker) {
          broker.postMessage({
            type: 'PUBLISH',
            topic: 'ai/evacuation/route',
            payload: msg.result,
            source: 'ai' as WorkerSource,
          });
        }
        break;
      }
    }
  }, [addNotification]);

  // === Error Handlers with Restart Logic ===

  const restartWorker = useCallback((
    name: string,
    factory: WorkerFactory,
    ref: React.MutableRefObject<Worker | null>,
    restartCount: React.MutableRefObject<number>,
    setupHandler: (worker: Worker) => void
  ): void => {
    if (restartCount.current >= MAX_RESTART_ATTEMPTS) {
      console.error(`[WorkerProvider] ${name} exceeded max restart attempts (${String(MAX_RESTART_ATTEMPTS)}). Giving up.`);

      const notification: Notification = {
        id: `worker-fail-${name}-${Date.now()}`,
        type: 'CRITICAL',
        title: `${name} Failed`,
        message: `${name} crashed and could not be restarted after ${String(MAX_RESTART_ATTEMPTS)} attempts.`,
        division: 1 as DivisionId,
        timestamp: Date.now(),
      };
      addNotification(notification);
      return;
    }

    restartCount.current += 1;
    console.warn(`[WorkerProvider] Restarting ${name} (attempt ${String(restartCount.current)}/${String(MAX_RESTART_ATTEMPTS)})...`);

    setTimeout(() => {
      try {
        const newWorker = factory();
        ref.current = newWorker;
        setupHandler(newWorker);
      } catch (err) {
        console.error(`[WorkerProvider] Failed to restart ${name}:`, err);
      }
    }, RESTART_DELAY_MS);
  }, [addNotification]);

  // === Setup Functions ===

  const setupBrokerWorker = useCallback((worker: Worker): void => {
    worker.onmessage = handleBrokerMessage;
    worker.onerror = (error: ErrorEvent): void => {
      console.error('[WorkerProvider] BrokerWorker error:', error.message);
      restartWorker('BrokerWorker', createBrokerWorker, brokerRef, brokerRestarts, setupBrokerWorker);
    };
  }, [handleBrokerMessage, restartWorker, createBrokerWorker]);

  const setupPhysicsWorker = useCallback((worker: Worker): void => {
    worker.onmessage = handlePhysicsMessage;
    worker.onerror = (error: ErrorEvent): void => {
      console.error('[WorkerProvider] PhysicsWorker error:', error.message);
      restartWorker('PhysicsWorker', createPhysicsWorker, physicsRef, physicsRestarts, setupPhysicsWorker);
    };
  }, [handlePhysicsMessage, restartWorker, createPhysicsWorker]);

  const setupAIWorker = useCallback((worker: Worker): void => {
    worker.onmessage = handleAIMessage;
    worker.onerror = (error: ErrorEvent): void => {
      console.error('[WorkerProvider] AIWorker error:', error.message);
      restartWorker('AIWorker', createAIWorker, aiRef, aiRestarts, setupAIWorker);
    };
  }, [handleAIMessage, restartWorker, createAIWorker]);

  // === Lifecycle: Mount and Cleanup ===

  useEffect(() => {
    // Instantiate all 3 workers
    const broker = createBrokerWorker();
    const physics = createPhysicsWorker();
    const ai = createAIWorker();

    brokerRef.current = broker;
    physicsRef.current = physics;
    aiRef.current = ai;

    // Set up message and error handlers
    setupBrokerWorker(broker);
    setupPhysicsWorker(physics);
    setupAIWorker(ai);

    // Start the physics simulation
    physics.postMessage({ type: 'START', interval: 500 });

    // Start historian batch flush timer
    historianTimerRef.current = setInterval(flushHistorianBuffer, HISTORIAN_BATCH_INTERVAL_MS);

    // Cleanup on unmount
    return (): void => {
      // Stop historian timer
      if (historianTimerRef.current !== null) {
        clearInterval(historianTimerRef.current);
        historianTimerRef.current = null;
      }

      // Flush remaining historian buffer
      flushHistorianBuffer();

      // Terminate all workers
      broker.terminate();
      physics.terminate();
      ai.terminate();

      brokerRef.current = null;
      physicsRef.current = null;
      aiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Public API ===

  const publishCommand = useCallback((topic: string, payload: unknown): void => {
    const broker = brokerRef.current;
    if (!broker) {
      console.warn('[WorkerProvider] Cannot publish command: BrokerWorker not available');
      return;
    }

    broker.postMessage({
      type: 'PUBLISH',
      topic,
      payload,
      source: 'ui' as WorkerSource,
    });
  }, []);

  const postToPhysics = useCallback((message: unknown): void => {
    const physics = physicsRef.current;
    if (!physics) {
      console.warn('[WorkerProvider] Cannot post to PhysicsWorker: not available');
      return;
    }
    physics.postMessage(message);
  }, []);

  const postToAI = useCallback((message: unknown): void => {
    const ai = aiRef.current;
    if (!ai) {
      console.warn('[WorkerProvider] Cannot post to AIWorker: not available');
      return;
    }
    ai.postMessage(message);
  }, []);

  const contextValue: WorkerContextValue = {
    publishCommand,
    postToPhysics,
    postToAI,
  };

  return (
    <WorkerContext.Provider value={contextValue}>
      {children}
    </WorkerContext.Provider>
  );
}

// === Hook ===

/**
 * Access the WorkerProvider context to publish commands and communicate with workers.
 * Must be used within a WorkerProvider.
 */
export function useWorkers(): WorkerContextValue {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorkers must be used within a WorkerProvider');
  }
  return context;
}

export default WorkerProvider;
