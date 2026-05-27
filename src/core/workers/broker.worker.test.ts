// ============================================================================
// NFCC Digital Twin - BrokerWorker Unit Tests
// ============================================================================
// Tests the core routing logic: MessageBroker class and matchTopic function.
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { MessageBroker, matchTopic } from './broker.worker';

// === matchTopic function tests ===

describe('matchTopic', () => {
  describe('exact matching', () => {
    it('matches identical topics', () => {
      expect(matchTopic('sensor/zone-a/temperature', 'sensor/zone-a/temperature')).toBe(true);
    });

    it('does not match different topics', () => {
      expect(matchTopic('sensor/zone-a/temperature', 'sensor/zone-b/temperature')).toBe(false);
    });

    it('does not match topics with different segment counts', () => {
      expect(matchTopic('sensor/zone-a', 'sensor/zone-a/temperature')).toBe(false);
    });

    it('does not match when topic is shorter than filter', () => {
      expect(matchTopic('sensor/zone-a/temperature', 'sensor/zone-a')).toBe(false);
    });

    it('matches single-segment topics', () => {
      expect(matchTopic('system', 'system')).toBe(true);
    });

    it('does not match empty filter against non-empty topic', () => {
      expect(matchTopic('', 'sensor')).toBe(false);
    });

    it('matches empty filter against empty topic', () => {
      expect(matchTopic('', '')).toBe(true);
    });
  });

  describe('single-level wildcard (*)', () => {
    it('matches * against any single segment', () => {
      expect(matchTopic('sensor/*/temperature', 'sensor/zone-a/temperature')).toBe(true);
    });

    it('matches * against different single segments', () => {
      expect(matchTopic('sensor/*/temperature', 'sensor/zone-b/temperature')).toBe(true);
    });

    it('does not match * against multiple segments', () => {
      expect(matchTopic('sensor/*', 'sensor/zone-a/temperature')).toBe(false);
    });

    it('matches multiple * wildcards', () => {
      expect(matchTopic('*/*/temperature', 'sensor/zone-a/temperature')).toBe(true);
    });

    it('matches * at the beginning', () => {
      expect(matchTopic('*/zone-a/temperature', 'sensor/zone-a/temperature')).toBe(true);
    });

    it('matches * at the end', () => {
      expect(matchTopic('sensor/zone-a/*', 'sensor/zone-a/temperature')).toBe(true);
    });
  });

  describe('multi-level wildcard (#)', () => {
    it('matches # against zero remaining segments', () => {
      expect(matchTopic('sensor/#', 'sensor')).toBe(true);
    });

    it('matches # against one remaining segment', () => {
      expect(matchTopic('sensor/#', 'sensor/zone-a')).toBe(true);
    });

    it('matches # against multiple remaining segments', () => {
      expect(matchTopic('sensor/#', 'sensor/zone-a/temperature')).toBe(true);
    });

    it('matches # as the only segment (matches everything)', () => {
      expect(matchTopic('#', 'sensor/zone-a/temperature')).toBe(true);
    });

    it('matches # as the only segment against single segment', () => {
      expect(matchTopic('#', 'system')).toBe(true);
    });

    it('matches # after specific prefix', () => {
      expect(matchTopic('alert/critical/#', 'alert/critical/fire/zone-a')).toBe(true);
    });
  });

  describe('combined wildcards', () => {
    it('matches * followed by #', () => {
      expect(matchTopic('sensor/*/#', 'sensor/zone-a/temperature/reading')).toBe(true);
    });

    it('matches * followed by # with zero trailing', () => {
      expect(matchTopic('sensor/*/#', 'sensor/zone-a')).toBe(true);
    });
  });
});

// === MessageBroker class tests ===

describe('MessageBroker', () => {
  let broker: MessageBroker;

  beforeEach(() => {
    broker = new MessageBroker();
  });

  describe('subscribe', () => {
    it('registers a subscriber for a topic', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      const subs = broker.getSubscriptions();
      expect(subs.get('sensor/zone-a/temperature')?.has('sub-1')).toBe(true);
    });

    it('allows multiple subscribers for the same topic', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      broker.subscribe('sensor/zone-a/temperature', 'sub-2');
      const subs = broker.getSubscriptions();
      expect(subs.get('sensor/zone-a/temperature')?.size).toBe(2);
    });

    it('allows the same subscriber to subscribe to multiple topics', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      broker.subscribe('sensor/zone-b/humidity', 'sub-1');
      const subs = broker.getSubscriptions();
      expect(subs.get('sensor/zone-a/temperature')?.has('sub-1')).toBe(true);
      expect(subs.get('sensor/zone-b/humidity')?.has('sub-1')).toBe(true);
    });

    it('does not duplicate subscriber on repeated subscribe', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      const subs = broker.getSubscriptions();
      expect(subs.get('sensor/zone-a/temperature')?.size).toBe(1);
    });
  });

  describe('unsubscribe', () => {
    it('removes a subscriber from a topic', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      broker.unsubscribe('sensor/zone-a/temperature', 'sub-1');
      const subs = broker.getSubscriptions();
      expect(subs.has('sensor/zone-a/temperature')).toBe(false);
    });

    it('does not error when unsubscribing from non-existent topic', () => {
      expect(() => broker.unsubscribe('nonexistent', 'sub-1')).not.toThrow();
    });

    it('does not error when unsubscribing non-existent subscriber', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      expect(() => broker.unsubscribe('sensor/zone-a/temperature', 'sub-2')).not.toThrow();
    });

    it('keeps other subscribers when one unsubscribes', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      broker.subscribe('sensor/zone-a/temperature', 'sub-2');
      broker.unsubscribe('sensor/zone-a/temperature', 'sub-1');
      const subs = broker.getSubscriptions();
      expect(subs.get('sensor/zone-a/temperature')?.has('sub-2')).toBe(true);
      expect(subs.get('sensor/zone-a/temperature')?.has('sub-1')).toBe(false);
    });
  });

  describe('publish', () => {
    it('returns matching subscribers for exact topic match', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      const result = broker.publish('sensor/zone-a/temperature', { value: 25 }, 'physics');
      expect(result.subscriberIds).toContain('sub-1');
    });

    it('returns empty array when no subscribers match', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-1');
      const result = broker.publish('sensor/zone-b/humidity', { value: 60 }, 'physics');
      expect(result.subscriberIds).toHaveLength(0);
    });

    it('formats message as BrokerMessage with all required fields', () => {
      broker.subscribe('sensor/#', 'sub-1');
      const result = broker.publish('sensor/zone-a/temperature', { value: 25 }, 'physics');
      expect(result.message).toMatchObject({
        topic: 'sensor/zone-a/temperature',
        payload: { value: 25 },
        source: 'physics',
      });
      expect(result.message.timestamp).toBeGreaterThan(0);
    });

    it('routes to wildcard subscribers', () => {
      broker.subscribe('sensor/*', 'sub-1');
      const result = broker.publish('sensor/zone-a', { value: 25 }, 'physics');
      expect(result.subscriberIds).toContain('sub-1');
    });

    it('routes to multi-level wildcard subscribers', () => {
      broker.subscribe('sensor/#', 'sub-1');
      const result = broker.publish('sensor/zone-a/temperature', { value: 25 }, 'physics');
      expect(result.subscriberIds).toContain('sub-1');
    });

    it('routes to multiple matching subscribers across different filters', () => {
      broker.subscribe('sensor/zone-a/temperature', 'sub-exact');
      broker.subscribe('sensor/#', 'sub-wildcard');
      broker.subscribe('sensor/*/temperature', 'sub-single');
      const result = broker.publish('sensor/zone-a/temperature', { value: 25 }, 'physics');
      expect(result.subscriberIds).toContain('sub-exact');
      expect(result.subscriberIds).toContain('sub-wildcard');
      expect(result.subscriberIds).toContain('sub-single');
    });

    it('does not duplicate subscriber IDs when matching multiple filters', () => {
      broker.subscribe('sensor/#', 'sub-1');
      broker.subscribe('sensor/zone-a/#', 'sub-1');
      const result = broker.publish('sensor/zone-a/temperature', { value: 25 }, 'physics');
      const count = result.subscriberIds.filter(id => id === 'sub-1').length;
      expect(count).toBe(1);
    });

    it('silently discards messages with no matching subscribers', () => {
      const result = broker.publish('nonexistent/topic', { value: 0 }, 'ui');
      expect(result.subscriberIds).toHaveLength(0);
      expect(result.message.topic).toBe('nonexistent/topic');
    });

    it('handles messages from different sources', () => {
      broker.subscribe('command/#', 'sub-1');

      const fromUI = broker.publish('command/hvac/setpoint', { temp: 22 }, 'ui');
      expect(fromUI.message.source).toBe('ui');

      const fromPhysics = broker.publish('command/status', { running: true }, 'physics');
      expect(fromPhysics.message.source).toBe('physics');

      const fromAI = broker.publish('command/alert', { anomaly: true }, 'ai');
      expect(fromAI.message.source).toBe('ai');
    });
  });

  describe('getMatchingSubscribers', () => {
    it('returns all subscribers matching a topic', () => {
      broker.subscribe('sensor/#', 'sub-1');
      broker.subscribe('sensor/zone-a/*', 'sub-2');
      broker.subscribe('alert/#', 'sub-3');

      const matched = broker.getMatchingSubscribers('sensor/zone-a/temperature');
      expect(matched).toContain('sub-1');
      expect(matched).toContain('sub-2');
      expect(matched).not.toContain('sub-3');
    });

    it('returns empty array for unmatched topic', () => {
      broker.subscribe('sensor/#', 'sub-1');
      const matched = broker.getMatchingSubscribers('alert/critical/fire');
      expect(matched).toHaveLength(0);
    });
  });

  describe('integration scenarios', () => {
    it('handles PhysicsWorker publishing sensor data to UI subscriber', () => {
      broker.subscribe('sensor/#', 'main-thread');
      const result = broker.publish('sensor/zone-e/temperature', { value: 23.5, nodeId: 'node-001' }, 'physics');
      expect(result.subscriberIds).toContain('main-thread');
      expect(result.message.source).toBe('physics');
    });

    it('handles UI publishing commands to PhysicsWorker subscriber', () => {
      broker.subscribe('command/hvac/#', 'physics-worker');
      const result = broker.publish('command/hvac/setpoint', { kp: 1.2, ki: 0.5, kd: 0.1 }, 'ui');
      expect(result.subscriberIds).toContain('physics-worker');
      expect(result.message.source).toBe('ui');
    });

    it('handles AIWorker publishing alerts to UI subscriber', () => {
      broker.subscribe('alert/#', 'main-thread');
      const result = broker.publish('alert/anomaly/zone-b', { confidence: 0.92, centroid: [10, 20] }, 'ai');
      expect(result.subscriberIds).toContain('main-thread');
      expect(result.message.source).toBe('ai');
    });

    it('handles broker routing PIR data to AIWorker', () => {
      broker.subscribe('sensor/*/pir', 'ai-worker');
      const result = broker.publish('sensor/zone-b/pir', { motionDetected: true, x: 5, y: 10 }, 'physics');
      expect(result.subscriberIds).toContain('ai-worker');
    });

    it('handles emergency state transitions broadcast', () => {
      broker.subscribe('system/#', 'main-thread');
      broker.subscribe('system/#', 'physics-worker');
      broker.subscribe('system/#', 'ai-worker');
      const result = broker.publish('system/emergency/lockdown', { state: 'LOCKDOWN' }, 'broker');
      expect(result.subscriberIds).toHaveLength(3);
      expect(result.subscriberIds).toContain('main-thread');
      expect(result.subscriberIds).toContain('physics-worker');
      expect(result.subscriberIds).toContain('ai-worker');
    });
  });
});
