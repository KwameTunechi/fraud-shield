// backend/src/services/events/bus.js
// Tiny in-process event bus built on Node's EventEmitter.
// For a multi-server deployment this would be replaced with Redis Pub/Sub
// so every server instance receives every event.

import { EventEmitter } from 'events';

export const bus = new EventEmitter();
bus.setMaxListeners(200); // one per open SSE connection + headroom

// Publish a named event with an arbitrary payload object.
export function publish(eventName, payload) {
  bus.emit(eventName, payload);
}
