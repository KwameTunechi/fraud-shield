// backend/src/routes/events.js
// Server-Sent Events stream for the admin live-transactions dashboard.
// The browser opens one long-lived GET connection; the server pushes JSON
// events down it whenever a transaction is created or an alert fires.
//
// SSE is simpler than WebSockets for this use case: it is one-directional
// (server → browser), uses plain HTTP, and works through proxies/firewalls
// without special configuration.

import { Router } from 'express';
import { bus } from '../services/events/bus.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

// Events the dashboard subscribes to
const SUBSCRIBED_EVENTS = [
  'transaction.new',
  'transaction.status_changed',
  'alert.new',
];

// GET /api/events/stream  (admin only)
router.get('/stream', authenticate, requireAdmin, (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Confirm the stream is open (some clients wait for the first byte)
  res.write(': connected\n\n');

  // Heartbeat every 30 s — prevents proxies and load-balancers from timing
  // out an idle connection
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 30_000);

  // Helper: format and send one SSE event
  function send(eventName) {
    return (payload) => {
      if (!res.writableEnded) {
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
      }
    };
  }

  // Register a handler per event type and remember them so we can clean up
  const handlers = Object.fromEntries(
    SUBSCRIBED_EVENTS.map(name => [name, send(name)])
  );
  for (const [name, handler] of Object.entries(handlers)) {
    bus.on(name, handler);
  }

  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(heartbeat);
    for (const [name, handler] of Object.entries(handlers)) {
      bus.off(name, handler);
    }
  });
});

export default router;
