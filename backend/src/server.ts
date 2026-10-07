import express from 'express';
import cors from 'cors';
import { config } from './config';
import chatRouter from './api/chat';
import reportRouter from './api/report';
import imageRouter from './api/image';
import hospitalsRouter from './api/hospitals';
import healthRouter from './api/health';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security & Parsing Middleware
app.use(
  cors({
    origin: '*', // Allows local development and cross-origin requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/report', reportRouter);
app.use('/api/image', imageRouter);
app.use('/api/hospitals', hospitalsRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'MediGuide AI Medical Assistant Backend is online.',
    docs: '/api/health',
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log(`🚀 MediGuide AI Backend Server running on http://localhost:${config.port}`);
  console.log(`🛡️ Configured AI Provider: ${config.aiProvider.toUpperCase()}`);
});

export default app;
