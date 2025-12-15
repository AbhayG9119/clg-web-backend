import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  promoteStudents,
  getPromotionEligibleStudents,
  bulkUpdateStudentAcademicDetails
} from '../controllers/promotionController.js';

const router = express.Router();

// All promotion routes require authentication
router.use(authenticateToken);

// Get students eligible for promotion
router.get('/eligible/:sessionId', getPromotionEligibleStudents);

// Promote students to next year/semester
router.post('/promote', promoteStudents);

// Bulk update student academic details
router.put('/bulk-update', bulkUpdateStudentAcademicDetails);

export default router;
