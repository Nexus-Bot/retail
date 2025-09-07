import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';
import { 
  createItems, 
  getItems, 
  getItem, 
  updateItem,
  bulkUpdateItems,
  getItemHistory,
  getMyItems
} from '../../controllers/itemController';

const router = express.Router();

// All item routes require authentication
router.use(authenticate);

// Create items - only owners can add items to inventory
router.post('/', authorize(Permission.CREATE_INVENTORY), createItems);

// Bulk update items - update multiple items at once
router.patch('/bulk', authorize(Permission.UPDATE_INVENTORY), bulkUpdateItems);

// Get all items - requires read inventory permission
router.get('/', authorize(Permission.READ_INVENTORY), getItems);

// Get items held by current employee
router.get('/my/items', authorize(Permission.READ_INVENTORY), getMyItems);

// Get single item - requires read inventory permission
router.get('/:id', authorize(Permission.READ_INVENTORY), getItem);

// Get item status history - requires read inventory permission
router.get('/:id/history', authorize(Permission.READ_INVENTORY), getItemHistory);

// Update item (details, status, etc.) - requires update inventory permission
router.put('/:id', authorize(Permission.UPDATE_INVENTORY), updateItem);

export default router;