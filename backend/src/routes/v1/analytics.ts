import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';
import {
  getItemTypeAnalytics
} from '../../controllers/analyticsController';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// Main Analytics - Item Type Table with Sales and Returns
// GET /analytics/item-types?startDate=2024-01-01&endDate=2024-01-31
router.get('/item-types', authorize(Permission.VIEW_REPORTS), getItemTypeAnalytics);

export default router;