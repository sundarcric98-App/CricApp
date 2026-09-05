import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import http from 'http';
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import playerRoutes from './routes/playerRoutes';
import scoringRoutes from './routes/scoringRoutes';
import teamRoutes from './routes/teamRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { initSocket } from './socket/socketHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io integration
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CricLiveX Express Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CricLiveX Backend Server running on port ${PORT}`);
  console.log(`⚡ WebSocket / Socket.io ready on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

export default app;
