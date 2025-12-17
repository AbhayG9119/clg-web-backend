import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createSession,
  activateSession,
  getSessions,
  getBatchesForSession,
  createFeeStructure,
  getFeeStructures,
  createTransportRoute,
  assignTransportToStudent,
  getTransportRoutes,
  createHostelFee,
  assignHostelToStudent,
  getHostelFees,
  getHostels,
  getHostelAssignments,
  getStudents,
  getFeeHeads,
  applyDiscount,
  getDiscounts,
  createSubject,
  getSubjects,
  generateFeeReceipt
} from '../controllers/erpController.js';

import {
  getStaffList,
  getAttendance,
  markAttendance,
  getAttendanceRecords,
  getLeaveRequests,
  updateLeaveStatus,
  getMonthlyAttendance
} from '../controllers/staffAttendanceController.js';

const router = express.Router();

// Session routes
router.post('/session', protect, createSession);
router.put('/session/:sessionId/activate', protect, activateSession);
router.get('/sessions', protect, getSessions);
router.get('/session/:sessionId/batches', protect, getBatchesForSession);

// Fee structure routes
router.post('/fee/structure', createFeeStructure);
router.get('/fee/structures', getFeeStructures);
router.get('/fee/heads', getFeeHeads);

// Transport routes
router.post('/transport', createTransportRoute);
router.post('/transport/assign', assignTransportToStudent);
router.get('/transport/routes', getTransportRoutes);

// Hostel routes
router.post('/hostel/fee', createHostelFee);
router.post('/hostel/assign', assignHostelToStudent);
router.get('/hostel/fees', getHostelFees);

// Discount routes
router.post('/discount', applyDiscount);
router.get('/discounts', getDiscounts);

// Subject routes
router.post('/subject', createSubject);
router.get('/subjects', getSubjects);

// Fee receipt routes
router.get('/fee/receipt/:studentId/:sessionId', generateFeeReceipt);

// Staff Attendance routes
router.get('/staff/list', protect, getStaffList);
router.get('/staff/attendance', protect, getAttendance);
router.post('/staff/attendance', protect, markAttendance);
router.get('/staff/attendance/records', protect, getAttendanceRecords);
router.get('/staff/attendance/monthly', protect, getMonthlyAttendance);
router.get('/staff/leaves', protect, getLeaveRequests);
router.put('/staff/leave/:id/status', protect, updateLeaveStatus);

export default router;
