import express from 'express';
import {
  sendNotification,
  getMyNotifications,
  getUserNotifications,
  getAllNotifications,
  markAsRead,
  deleteNotification,
  sendBulkNotifications,
  getNotificationStats,
  getNotificationFilters
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send notification (admin/staff)
router.post('/', authenticateToken, sendNotification);

// Get my notifications (authenticated user)
router.get('/my', authenticateToken, getMyNotifications);

// Get notifications for a specific user (admin view)
router.get('/user/:userId', authenticateToken, getUserNotifications);

// Get all notifications (admin view)
router.get('/', authenticateToken, getAllNotifications);

// Mark notification as read
router.put('/:id/read', authenticateToken, markAsRead);

// Delete notification
router.delete('/:id', authenticateToken, deleteNotification);

// Send bulk notifications
router.post('/bulk', authenticateToken, sendBulkNotifications);

// Get notification statistics
router.get('/stats/overview', authenticateToken, getNotificationStats);

// Get notification filters
router.get('/filters', authenticateToken, getNotificationFilters);

export default router;
