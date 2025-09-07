import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';
import { 
  createItemType, 
  getItemTypes, 
  getItemType, 
  updateItemType 
} from '../../controllers/itemTypeController';

const router = express.Router();

// All item type routes require authentication
router.use(authenticate);

// Create item type - only owners can create product definitions
router.post('/', authorize(Permission.CREATE_INVENTORY), createItemType);

// Get all item types - requires read inventory permission
router.get('/', authorize(Permission.READ_INVENTORY), getItemTypes);

// Get single item type - requires read inventory permission
router.get('/:id', authorize(Permission.READ_INVENTORY), getItemType);

// Update item type - requires update inventory permission
router.put('/:id', authorize(Permission.UPDATE_INVENTORY), updateItemType);

export default router;