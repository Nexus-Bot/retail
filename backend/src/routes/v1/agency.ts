import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';
import { 
  createAgency, 
  getAgencies, 
  getAgency, 
  updateAgency 
} from '../../controllers/agencyController';

const router = express.Router();

// All agency routes require authentication
router.use(authenticate);

// Create agency - requires create permission
router.post('/', authorize(Permission.CREATE_AGENCIES), createAgency);

// Get all agencies - requires read permission
router.get('/', authorize(Permission.READ_AGENCIES), getAgencies);

// Get single agency - requires read permission
router.get('/:id', authorize(Permission.READ_AGENCIES), getAgency);

// Update agency - requires update permission
router.put('/:id', authorize(Permission.UPDATE_AGENCIES), updateAgency);

export default router;