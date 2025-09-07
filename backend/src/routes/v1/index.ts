import express from 'express';
import authRoutes from './auth';
import agencyRoutes from './agency';
import itemRoutes from './item';
import itemTypeRoutes from './itemType';

const router = express.Router();

router.get('/test', (_req, res) => {
  res.json({ 
    message: 'API v1 test route working!',
    status: 'success',
    version: 'v1',
    data: {
      nodejs: process.version,
      environment: process.env.NODE_ENV || 'development',
      database: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    }
  });
});

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Agency routes
router.use('/agency', agencyRoutes);

// Item Type routes
router.use('/item-type', itemTypeRoutes);

// Item routes
router.use('/item', itemRoutes);

export default router;