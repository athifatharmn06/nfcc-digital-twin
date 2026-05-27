// ============================================================================
// NFCC Digital Twin - BrokerWorker Property-Based Tests
// ============================================================================
// Property 1: Broker Message Routing Correctness
// Property 2: Broker Message Format Invariant
// ============================================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MessageBroker, matchTopic } from './broker.worker';
import { arbWorkerSource } from '../../test/arbitraries';

// === Custom Arbitraries for Broker Tests ===

/** Arbitrary for a single topic segment (non-empty, no slashes, no wildcards) */
const arbTopicSegment: fc.Arbitrary<string> = fc.constantFrom(
  'sensor', 'zone-a', 'zone-b', 'zone-c', 'temperature', 'humidity',
  'pressure', 'co2', 'pir', 'door', 'vibration', 'smoke', 'heat',
  'command', 'alert', 'system', 'critical', 'info', 'warning',
  'electrical', 'water', 'fire', 'hvac', 'medical', 'logistics',
);

/** Arbitrary for a concrete topic (no wildcards) with 1-4 segments */
const arbConcreteTopic: fc.Arbitrary<string> = fc
  .array(arbTopicSegment, { minLength: 1, maxLength: 4 })
  .map((segments) => segments.join('/'));

/** Arbitrary for a topic filter that may contain wildcards */
const arbTopicFilter: fc.Arbitrary<string> = fc
  .array(
    fc.oneof(
      { weight: 5, arbitrary: arbTopicSegment },
      { weight: 2, arbitrary: fc.constant('*') },
    ),
    { minLength: 1, maxLength: 4 },
  )
  .chain((segments) =>
    fc.boolean().map((appendHash) => {
      if (appendHash) {
        return [...segments, '#'].join('/');
      }
      return segments.join('/');
    }),
  );

/** Arbitrary for subscriber IDs */
const arbSubscriberId: fc.Arbitrary<string> = fc.constantFrom(
  'sub-main', 'sub-physics', 'sub-ai', 'sub-ui', 'sub-broker',
  'sub-1', 'sub-2', 'sub-3', 'sub-4', 'sub-5',
  'sub-alpha', 'sub-beta', 'sub-gamma', 'sub-delta',
);

/** Arbitrary for a subscription entry (filter + subscriber ID) */
const arbSubscription = fc.record({
  filter: arbTopicFilter,
  subscriberId: arbSubscriberId,
});

/** Arbitrary for a random payload */
const arbPayload: fc.Arbitrary<unknown> = fc.oneof(
  fc.integer().map((v) => v as unknown),
  fc.string().map((v) => v as unknown),
  fc.record({
    value: fc.float({ noNaN: true }),
    unit: fc.string({ maxLength: 5 }),
  }).map((v) => v as unknown),
  fc.constant(null).map((v) => v as unknown),
  fc.array(fc.integer(), { maxLength: 5 }).map((v) => v as unknown),
);

// === Property 1: Broker Message Routing Correctness ===

describe('Feature: nfcc-digital-twin, Property 1: Broker Message Routing Correctness', () => {
  /**
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
   *
   * For any set of topic subscriptions and any published message,
   * the BrokerWorker SHALL deliver the message to exactly those subscribers
   * whose topic filter matches the message topic, and to no others.
   */
  it('routes messages to exactly those subscribers whose filter matches the topic', () => {
    fc.assert(
      fc.property(
        fc.array(arbSubscription, { minLength: 1, maxLength: 20 }),
        arbConcreteTopic,
        arbPayload,
        arbWorkerSource,
        (subscriptions, topic, payload, source) => {
          // Setup broker with subscriptions
          const broker = new MessageBroker();
          for (const sub of subscriptions) {
            broker.subscribe(sub.filter, sub.subscriberId);
          }

          // Publish a message
          const result = broker.publish(topic, payload, source);

          // Compute expected subscribers: those whose filter matches the topic
          const expectedSubscribers = new Set<string>();
          for (const sub of subscriptions) {
            if (matchTopic(sub.filter, topic)) {
              expectedSubscribers.add(sub.subscriberId);
            }
          }

          // Verify: result contains exactly the expected subscribers
          const actualSubscribers = new Set(result.subscriberIds);
          expect(actualSubscribers).toEqual(expectedSubscribers);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('delivers to no subscribers when no filters match the topic', () => {
    fc.assert(
      fc.property(
        fc.array(arbSubscription, { minLength: 1, maxLength: 10 }),
        arbConcreteTopic,
        arbWorkerSource,
        (subscriptions, topic, source) => {
          const broker = new MessageBroker();
          for (const sub of subscriptions) {
            broker.subscribe(sub.filter, sub.subscriberId);
          }

          const result = broker.publish(topic, null, source);

          // Every returned subscriber must have a matching filter
          for (const subId of result.subscriberIds) {
            const hasMatchingFilter = subscriptions.some(
              (sub) => sub.subscriberId === subId && matchTopic(sub.filter, topic),
            );
            expect(hasMatchingFilter).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not duplicate subscriber IDs in routing results', () => {
    fc.assert(
      fc.property(
        fc.array(arbSubscription, { minLength: 1, maxLength: 20 }),
        arbConcreteTopic,
        arbWorkerSource,
        (subscriptions, topic, source) => {
          const broker = new MessageBroker();
          for (const sub of subscriptions) {
            broker.subscribe(sub.filter, sub.subscriberId);
          }

          const result = broker.publish(topic, { data: 'test' }, source);

          // No duplicates in subscriber list
          const unique = new Set(result.subscriberIds);
          expect(result.subscriberIds.length).toBe(unique.size);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('discards messages with no matching subscribers without error', () => {
    fc.assert(
      fc.property(
        arbConcreteTopic,
        arbPayload,
        arbWorkerSource,
        (topic, payload, source) => {
          // Empty broker - no subscriptions
          const broker = new MessageBroker();
          const result = broker.publish(topic, payload, source);

          // Should return empty subscriber list and still produce a valid message
          expect(result.subscriberIds).toHaveLength(0);
          expect(result.message.topic).toBe(topic);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// === Property 2: Broker Message Format Invariant ===

describe('Feature: nfcc-digital-twin, Property 2: Broker Message Format Invariant', () => {
  /**
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
   *
   * For any message passing through the BrokerWorker, the output message
   * SHALL contain a valid topic (non-empty string), timestamp (positive number),
   * payload field, and source field matching a valid WorkerSource.
   */
  it('output message always contains topic, timestamp, payload, and source', () => {
    const validSources = new Set(['physics', 'ai', 'ui', 'broker']);

    fc.assert(
      fc.property(
        arbConcreteTopic,
        arbPayload,
        arbWorkerSource,
        (topic, payload, source) => {
          const broker = new MessageBroker();
          broker.subscribe('#', 'test-sub'); // Subscribe to everything

          const result = broker.publish(topic, payload, source);
          const msg = result.message;

          // topic must be a non-empty string
          expect(typeof msg.topic).toBe('string');
          expect(msg.topic.length).toBeGreaterThan(0);

          // timestamp must be a positive number
          expect(typeof msg.timestamp).toBe('number');
          expect(msg.timestamp).toBeGreaterThan(0);

          // payload field must exist (can be any value including null)
          expect('payload' in msg).toBe(true);

          // source must be a valid WorkerSource
          expect(validSources.has(msg.source)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves the original topic in the output message', () => {
    fc.assert(
      fc.property(
        arbConcreteTopic,
        arbPayload,
        arbWorkerSource,
        (topic, payload, source) => {
          const broker = new MessageBroker();
          const result = broker.publish(topic, payload, source);

          expect(result.message.topic).toBe(topic);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves the original payload in the output message', () => {
    fc.assert(
      fc.property(
        arbConcreteTopic,
        arbPayload,
        arbWorkerSource,
        (topic, payload, source) => {
          const broker = new MessageBroker();
          const result = broker.publish(topic, payload, source);

          expect(result.message.payload).toEqual(payload);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves the original source in the output message', () => {
    fc.assert(
      fc.property(
        arbConcreteTopic,
        arbWorkerSource,
        (topic, source) => {
          const broker = new MessageBroker();
          const result = broker.publish(topic, {}, source);

          expect(result.message.source).toBe(source);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('timestamp is always a recent positive number', () => {
    fc.assert(
      fc.property(
        arbConcreteTopic,
        arbPayload,
        arbWorkerSource,
        (topic, payload, source) => {
          const before = Date.now();
          const broker = new MessageBroker();
          const result = broker.publish(topic, payload, source);
          const after = Date.now();

          // Timestamp should be between before and after the call
          expect(result.message.timestamp).toBeGreaterThanOrEqual(before);
          expect(result.message.timestamp).toBeLessThanOrEqual(after);
        },
      ),
      { numRuns: 100 },
    );
  });
});
