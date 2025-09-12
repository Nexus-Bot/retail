import express from 'express';
import { 
  createRoute, 
  getRoutes, 
  getRoute, 
  updateRoute, 
  deleteRoute 
} from '../../controllers/routeController';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/routes - Get all routes (owners and employees can read)
router.get('/', authorize(Permission.READ_ROUTES), getRoutes);

// GET /api/v1/routes/:id - Get a specific route (owners and employees can read)
router.get('/:id', authorize(Permission.READ_ROUTES), getRoute);

// POST /api/v1/routes - Create a new route (only owners can create)
router.post('/', authorize(Permission.CREATE_ROUTES), createRoute);

// PUT /api/v1/routes/:id - Update a route (only owners can update)
router.put('/:id', authorize(Permission.UPDATE_ROUTES), updateRoute);

// DELETE /api/v1/routes/:id - Delete a route (only owners can delete)
router.delete('/:id', authorize(Permission.DELETE_ROUTES), deleteRoute);

export default router;