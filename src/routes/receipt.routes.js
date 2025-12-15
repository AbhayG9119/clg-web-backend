import express from 'express';
import {
  generateReceipt,
  getReceipt,
  getStudentReceipts,
  getMyReceipts,
  getAllReceipts,
  cancelReceipt,
  duplicateReceipt,
  downloadReceipt,
  getDuplicateReceipts
} from '../controllers/receiptController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin or Fees Administrator
const checkFeesAccess = (req, res, next) => {
  if (req.user.role !== 'admin' && !(req.user.role === 'faculty' && req.user.designation === 'Fees Administrator')) {
    return res.status(403).json({ message: 'Access denied. Admin role or Fees Administrator designation required.' });
  }
  next();
};

// Middleware to check if user is student
const checkStudentAccess = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Student role required.' });
  }
  next();
};

// Generate receipt for payment
router.post('/generate', authenticateToken, checkFeesAccess, generateReceipt);

// Get receipt by ID
router.get('/:id', authenticateToken, checkFeesAccess, getReceipt);

// Get receipts for a specific student
router.get('/student/:studentId', authenticateToken, checkFeesAccess, getStudentReceipts);

// Get my receipts (authenticated student)
router.get('/my', authenticateToken, checkStudentAccess, getMyReceipts);

// Get all receipts (admin view) or student receipts (student view)
router.get('/', authenticateToken, getAllReceipts);

// Cancel receipt
router.put('/:id/cancel', authenticateToken, checkFeesAccess, cancelReceipt);

// Duplicate receipt
router.post('/:id/duplicate', authenticateToken, checkFeesAccess, duplicateReceipt);

// Download receipt PDF
router.get('/:id/download', authenticateToken, downloadReceipt);

// Get duplicate receipts (admin view)
router.get('/duplicates/all', authenticateToken, checkFeesAccess, getDuplicateReceipts);

export default router;
