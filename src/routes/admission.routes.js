import express from 'express';
import { submitAdmissionQuery, getAdmissionQueries, admitStudent } from '../controllers/admissionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Submit Admission Query
router.post('/', submitAdmissionQuery);

// Get all Admission Queries
router.get('/', getAdmissionQueries);

// Admit new student (admin only)
router.post('/admit', authenticateToken, admitStudent);

export default router;
