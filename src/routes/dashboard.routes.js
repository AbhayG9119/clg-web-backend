import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAlerts,
  getRecentActivities
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, getDashboardStats);

// @route   GET /api/dashboard/alerts
// @desc    Get alerts/notifications
// @access  Private (Admin only)
router.get('/alerts', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, getAlerts);

// @route   GET /api/dashboard/activities
// @desc    Get recent activities
// @access  Private (Admin only)
router.get('/activities', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}, getRecentActivities);

export default router;
