import express from 'express';
import { 
  createCustomer, 
  getCustomers, 
  getCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../../controllers/customerController';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/customers - Get all customers (owners and employees can read)
router.get('/', authorize(Permission.READ_CUSTOMERS), getCustomers);

// GET /api/v1/customers/:id - Get a specific customer (owners and employees can read)
router.get('/:id', authorize(Permission.READ_CUSTOMERS), getCustomer);

// POST /api/v1/customers - Create a new customer (owners and employees can create)
router.post('/', authorize(Permission.CREATE_CUSTOMERS), createCustomer);

// PUT /api/v1/customers/:id - Update a customer (owners and employees can update)
router.put('/:id', authorize(Permission.UPDATE_CUSTOMERS), updateCustomer);

// DELETE /api/v1/customers/:id - Delete a customer (owners and employees can delete)
router.delete('/:id', authorize(Permission.DELETE_CUSTOMERS), deleteCustomer);

export default router;