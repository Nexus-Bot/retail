import express from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { Permission } from '../../types/auth';
import {
  getSalesAnalytics,
  getReturnsAnalytics,
  getEmployeeAnalytics,
  getCustomerAnalytics,
  getDashboardAnalytics
} from '../../controllers/analyticsController';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// Dashboard Analytics - High-level overview for agency
// GET /analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31
router.get('/dashboard', authorize(Permission.VIEW_REPORTS), getDashboardAnalytics);

// Sales Analytics - Revenue, quantity, profit analysis
// GET /analytics/sales?startDate=2024-01-01&endDate=2024-01-31&groupBy=day&employeeId=123&customerId=456&itemTypeId=789
router.get('/sales', authorize(Permission.VIEW_REPORTS), getSalesAnalytics);

// Returns Analytics - Return patterns, quantities, values
// GET /analytics/returns?startDate=2024-01-01&endDate=2024-01-31&groupBy=month&employeeId=123
router.get('/returns', authorize(Permission.VIEW_REPORTS), getReturnsAnalytics);

// Employee Performance Analytics - Individual employee metrics
// GET /analytics/employees/123?startDate=2024-01-01&endDate=2024-01-31&groupBy=week
router.get('/employees/:id', authorize(Permission.VIEW_REPORTS), getEmployeeAnalytics);

// Customer Analytics - Purchase history, return patterns for specific customer
// GET /analytics/customers/456?startDate=2024-01-01&endDate=2024-01-31&groupBy=month
router.get('/customers/:id', authorize(Permission.VIEW_REPORTS), getCustomerAnalytics);

export default router;