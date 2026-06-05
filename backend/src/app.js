// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import healthRouter       from './routes/health.js';
import authRouter         from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import alertsRouter       from './routes/alerts.js';
import riskRouter         from './routes/risk.js';
import eventsRouter       from './routes/events.js';
import blockchainRouter   from './routes/blockchain.js';
import customersRouter    from './routes/customers.js';
import adminsRouter       from './routes/admins.js';
import settingsRouter     from './routes/settings.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS — allow requests from the web dashboard
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/health',       healthRouter);
app.use('/api/auth',         authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/alerts',       alertsRouter);
app.use('/api/risk',         riskRouter);
app.use('/api/events',       eventsRouter);
app.use('/api/blockchain',   blockchainRouter);
app.use('/api/customers',   customersRouter);
app.use('/api/admins',      adminsRouter);
app.use('/api',             settingsRouter);  // mounts /api/ai-config and /api/settings

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Central error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
