import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database';
import v1Routes from './routes/v1';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ 
    message: 'Retail Inventory Management API - TypeScript',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    availableVersions: ['v1'],
    endpoints: {
      v1: '/api/v1'
    }
  });
});

app.use('/api/v1', v1Routes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;