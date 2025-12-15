import express from 'express';
import {
  getCollectionReports,
  getDefaulterReports,
  getPaymentStats,
  getConcessionReports,
  getReceiptReports,
  generateMarkSheet,
  getStudentMarkSheets,
  generateTransferCertificate,
  getStudentTransferCertificate,
  generateAcademicReport,
  getStudentAcademicReports
} from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get collection reports (batch/course/semester/year wise)
router.get('/collections', authenticateToken, getCollectionReports);

// Get defaulter reports
router.get('/defaulters', authenticateToken, getDefaulterReports);

// Get payment statistics
router.get('/payments/stats', authenticateToken, getPaymentStats);

// Get concession reports
router.get('/concessions', authenticateToken, getConcessionReports);

// Get receipt reports
router.get('/receipts', authenticateToken, getReceiptReports);

// Mark Sheet routes
router.post('/marksheets', authenticateToken, generateMarkSheet);
router.get('/marksheets/student/:studentId', authenticateToken, getStudentMarkSheets);

// Transfer Certificate routes
router.post('/transfer-certificates', authenticateToken, generateTransferCertificate);
router.get('/transfer-certificates/student/:studentId', authenticateToken, getStudentTransferCertificate);

// Academic Report routes
router.post('/academic-reports', authenticateToken, generateAcademicReport);
router.get('/academic-reports/student/:studentId', authenticateToken, getStudentAcademicReports);

export default router;
