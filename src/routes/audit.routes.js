import express from 'express';
import { protect } from '../middleware/auth.js';
import { getAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

// All audit routes require authentication
router.use(protect);

// Get all audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
