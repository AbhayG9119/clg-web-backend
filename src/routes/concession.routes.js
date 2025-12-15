import express from 'express';
import {
  createConcession,
  getStudentConcessions,
  getMyConcessions,
  getAllConcessions,
  updateConcession,
  deleteConcession,
  getConcessionStats
} from '../controllers/concessionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new concession (admin/staff)
router.post('/', authenticateToken, createConcession);

// Get concessions for a specific student
router.get('/student/:studentId', authenticateToken, getStudentConcessions);

// Get my concessions (authenticated student)
router.get('/my', authenticateToken, getMyConcessions);

// Get all concessions (admin view)
router.get('/', authenticateToken, getAllConcessions);

// Update concession
router.put('/:id', authenticateToken, updateConcession);

// Delete concession
router.delete('/:id', authenticateToken, deleteConcession);

// Get concession statistics
router.get('/stats/overview', authenticateToken, getConcessionStats);

export default router;
