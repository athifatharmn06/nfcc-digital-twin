// ============================================================================
// NFCC Digital Twin - BrokerWorker
// ============================================================================
// Topic-based pub/sub message router running in a Web Worker context.
// Supports MQTT-style wildcard matching:
//   * matches exactly one segment
//   # matches zero or more segments
// ============================================================================

import type { BrokerMessage, WorkerSource } from '../types/index';

// === Incoming message types from main thread / other workers ===

interface SubscribeMessage {
  type: 'SUBSCRIBE';
  topic: string;
  subscriberId: string;
}

interface UnsubscribeMessage {
  type: 'UNSUBSCRIBE';
  topic: string;
  subscriberId: string;
}

interface PublishMessage {
  type: 'PUBLISH';
  topic: string;
  payload: unknown;
  source: WorkerSource;
}

type IncomingMessage = SubscribeMessage | UnsubscribeMessage | PublishMessage;

// === Outgoing message type posted back to main thread ===

interface OutgoingMessage {
  type: 'MESSAGE';
  subscriberId: string;
  message: BrokerMessage;
}

// === Core Broker Logic (exported for testing) ===

export interface Subscriber {
  id: string;
  topicFilter: string;
}

/**
 * Matches a concrete topic against a topic filter with MQTT-style wildcards.
 * - `*` matches exactly one path segment
 * - `#` matches zero or more trailing segments (must be last segment)
 *
 * @param filter - The subscription filter (may contain wildcards)
 * @param topic - The concrete topic being published to
 * @returns true if the topic matches the filter
 */
export function matchTopic(filter: string, topic: string): boolean {
  const filterSegments = filter.split('/');
  const topicSegments = topic.split('/');

  let fi = 0;
  let ti = 0;

  while (fi < filterSegments.length && ti < topicSegments.length) {
    const filterSeg = filterSegments[fi];

    if (filterSeg === '#') {
      // # matches zero or more remaining segments
      return true;
    }

    if (filterSeg === '*') {
      // * matches exactly one segment
      fi++;
      ti++;
      continue;
    }

    if (filterSeg !== topicSegments[ti]) {
      return false;
    }

    fi++;
    ti++;
  }

  // If filter has a trailing #, it matches even if topic has no more segments
  if (fi < filterSegments.length && filterSegments[fi] === '#') {
    return true;
  }

  // Both must be fully consumed for an exact match
  return fi === filterSegments.length && ti === topicSegments.length;
}

/**
 * MessageBroker handles topic-based pub/sub routing.
 * Extracted as a class for testability outside the worker context.
 */
export class MessageBroker {
  private subscriptions: Map<string, Set<string>> = new Map();

  /**
   * Register a subscriber for a topic filter.
   */
  subscribe(topicFilter: string, subscriberId: string): void {
    const existing = this.subscriptions.get(topicFilter);
    if (existing) {
      existing.add(subscriberId);
    } else {
      this.subscriptions.set(topicFilter, new Set([subscriberId]));
    }
  }

  /**
   * Remove a subscriber from a topic filter.
   */
  unsubscribe(topicFilter: string, subscriberId: string): void {
    const existing = this.subscriptions.get(topicFilter);
    if (existing) {
      existing.delete(subscriberId);
      if (existing.size === 0) {
        this.subscriptions.delete(topicFilter);
      }
    }
  }

  /**
   * Publish a message and return the set of subscriber IDs that should receive it.
   * Messages to topics with no matching subscribers are silently discarded.
   */
  publish(topic: string, payload: unknown, source: WorkerSource): { subscriberIds: string[]; message: BrokerMessage } {
    const message: BrokerMessage = {
      topic,
      timestamp: Date.now(),
      payload,
      source,
    };

    const matchedSubscribers = new Set<string>();

    for (const [filter, subscribers] of this.subscriptions) {
      if (matchTopic(filter, topic)) {
        for (const sub of subscribers) {
          matchedSubscribers.add(sub);
        }
      }
    }

    return {
      subscriberIds: Array.from(matchedSubscribers),
      message,
    };
  }

  /**
   * Get all active subscriptions (for debugging/testing).
   */
  getSubscriptions(): Map<string, Set<string>> {
    return this.subscriptions;
  }

  /**
   * Get all subscriber IDs that match a given topic.
   */
  getMatchingSubscribers(topic: string): string[] {
    const matched = new Set<string>();
    for (const [filter, subscribers] of this.subscriptions) {
      if (matchTopic(filter, topic)) {
        for (const sub of subscribers) {
          matched.add(sub);
        }
      }
    }
    return Array.from(matched);
  }
}

// === Worker Context Setup ===

const broker = new MessageBroker();

/**
 * Handle incoming messages from main thread and other workers.
 */
self.onmessage = (event: MessageEvent<IncomingMessage>): void => {
  const data = event.data;

  switch (data.type) {
    case 'SUBSCRIBE': {
      broker.subscribe(data.topic, data.subscriberId);
      break;
    }

    case 'UNSUBSCRIBE': {
      broker.unsubscribe(data.topic, data.subscriberId);
      break;
    }

    case 'PUBLISH': {
      const { subscriberIds, message } = broker.publish(
        data.topic,
        data.payload,
        data.source
      );

      // Post message back to main thread for each matching subscriber
      for (const subscriberId of subscriberIds) {
        const outgoing: OutgoingMessage = {
          type: 'MESSAGE',
          subscriberId,
          message,
        };
        self.postMessage(outgoing);
      }
      break;
    }
  }
};
