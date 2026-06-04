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

const app = express();

// Security headers
app.use(helmet());

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
