import express from 'express';
import { protect } from '../middleware/auth.js';
import { getDesignations, addDesignation } from '../controllers/designationController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
});

// @route   GET /api/staff/designations
// @desc    Get all designations
// @access  Private (Admin only)
router.get('/designations', getDesignations);

// @route   POST /api/staff/designations
// @desc    Add new designation
// @access  Private (Admin only)
router.post('/designations', addDesignation);

export default router;
