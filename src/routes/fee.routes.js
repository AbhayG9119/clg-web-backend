import express from 'express';
import {
  getFeeStructures,
  getFeeStructureByCourse,
  createOrUpdateFeeStructure,
  deleteFeeStructure,
  initializeFeeStructures
} from '../controllers/feeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin or Fees Administrator
const checkFeesAccess = (req, res, next) => {
  if (req.user.role !== 'admin' && !(req.user.role === 'faculty' && req.user.designation === 'Fees Administrator')) {
    return res.status(403).json({ message: 'Access denied. Admin role or Fees Administrator designation required.' });
  }
  next();
};

// Get all fee structures
router.get('/', authenticateToken, checkFeesAccess, getFeeStructures);

// Get fee structure by course (admin/faculty or student for their own course)
router.get('/:course', authenticateToken, getFeeStructureByCourse);

// Create or update fee structure
router.post('/', authenticateToken, checkFeesAccess, createOrUpdateFeeStructure);

// Delete fee structure
router.delete('/:course', authenticateToken, checkFeesAccess, deleteFeeStructure);

// Initialize default fee structures
router.post('/initialize', authenticateToken, checkFeesAccess, initializeFeeStructures);

export default router;
