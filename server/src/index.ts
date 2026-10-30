import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Deterministically load env from cwd, ./server/.env, and ../.env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'sketch out API',
    time: new Date().toISOString(),
  });
});

// Routes
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/ai', aiRoutes);

// Start server immediately & connect to DB in background
app.listen(PORT, () => {
  console.log(`[Sketch Out Server] Running on http://localhost:${PORT}`);
  connectDB().catch((err) => console.warn('[MongoDB] Init connection check:', err.message));
});
