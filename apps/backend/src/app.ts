import express from 'express';
import dotenv from 'dotenv';
import { adminRouter } from './modules/admin/admin.route';
import { clientRouter } from './modules/client/client.route';
import { managerRouter } from './modules/manager/manager.route';
import { gigRouter } from './modules/gig/gig.route';
import { authRouter } from './modules/auth/auth.route';

dotenv.config();

export const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GigsForGigs Backend API',
    uptime: process.uptime()
  });
});

// Mount Module Routes
app.use('/api/admin', adminRouter);
app.use('/api/client', clientRouter);
app.use('/api/manager', managerRouter);
app.use('/api/gig', gigRouter);
app.use('/api/auth', authRouter);

// API Root Info
app.get('/api', (_req, res) => {
  res.json({
    message: 'Welcome to GigsForGigs RESTful API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: '/api/admin',
      manager: '/api/manager',
      client: '/api/client',
      gig: '/api/gig',
      auth: '/api/auth'
    }
  });
});
