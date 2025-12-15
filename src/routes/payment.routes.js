import express from 'express';
import {
  calculateStudentFeeBalance,
  getStudentPayments,
  getStudentDetails,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  initiatePayment,
  updatePaymentStatus
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin or Fees Administrator
const checkFeesAccess = (req, res, next) => {
  if (req.user.role !== 'admin' && !(req.user.role === 'faculty' && req.user.designation === 'Fees Administrator')) {
    return res.status(403).json({ message: 'Access denied. Admin role or Fees Administrator designation required.' });
  }
  next();
};

// Get all payments (admin only)
router.get('/all', authenticateToken, checkFeesAccess, getAllPayments);

// Get student's own payments
router.get('/my-payments', authenticateToken, getMyPayments);

// Initiate payment
router.post('/initiate', authenticateToken, checkFeesAccess, initiatePayment);

// Update payment status
router.put('/:id/status', authenticateToken, checkFeesAccess, updatePaymentStatus);

// Calculate student fee balance
router.get('/balance/:studentId', authenticateToken, checkFeesAccess, calculateStudentFeeBalance);

// Get student payments
router.get('/student/:studentId', authenticateToken, checkFeesAccess, getStudentPayments);

// Get student details
router.get('/student-details/:studentId', authenticateToken, checkFeesAccess, getStudentDetails);

// Get payment by ID
router.get('/:id', authenticateToken, checkFeesAccess, getPaymentById);

export default router;
