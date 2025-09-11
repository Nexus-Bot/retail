import express from 'express';
import { login, getProfile, createUser, getUsers, updateUser, logout, logoutAll } from '../../controllers/authController';
import { authenticate, authorize, requireRole } from '../../middleware/auth';
import { Permission, UserRole } from '../../types/auth';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', getProfile);

// Logout routes
router.post('/logout', logout);
router.post('/logout/all', logoutAll);

// User management routes
router.post('/users', 
  authorize(Permission.CREATE_USERS),
  createUser
);

router.get('/users', 
  authorize(Permission.READ_USERS),
  getUsers
);

router.put('/users/:id', 
  authorize(Permission.UPDATE_USERS),
  updateUser
);

// Test route for checking permissions
router.get('/test-permissions', (req, res) => {
  res.json({
    message: 'Authenticated route working!',
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role,
      permissions: req.user?.permissions,
      agencyId: req.user?.agencyId,
    }
  });
});

// Master only routes
router.get('/master-only', 
  requireRole(UserRole.MASTER),
  (_req, res) => {
    res.json({ message: 'Master access granted!' });
  }
);

// Owner only routes
router.get('/owner-only', 
  requireRole(UserRole.OWNER),
  (_req, res) => {
    res.json({ message: 'Owner access granted!' });
  }
);

export default router;