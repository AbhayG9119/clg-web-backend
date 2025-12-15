import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js'; // Assuming auth middleware exists

// Staff Controller
import { getProfile, updateProfile, getAssignedClasses, uploadProfilePicture, upload } from '../controllers/staffController.js';

// Attendance Controller
import { markAttendance, getDailyReport, getMonthlyReport } from '../controllers/attendanceController.js';

// Leave Controller
import { applyLeave, getMyLeaves, updateLeaveStatus } from '../controllers/leaveController.js';

// Timetable Controller
import { getTimetable, updateTimetable } from '../controllers/timetableController.js';

// Work Assignment Controller
import { createAssignment, getAssignments, getSubmissions, updateSubmission } from '../controllers/workAssignmentController.js';

// Message Controller
import { sendMessage, getInbox, getSent, markAsRead } from '../controllers/messageController.js';

// Payroll Controller
import { getPayroll, generatePayslip } from '../controllers/payrollController.js';

// Document Controller
import { getDocumentsByCourse, verifyDocument, downloadDocument } from '../controllers/documentController.js';

// Circular Controller
import { getStaffCirculars } from '../controllers/circularController.js';

// Designation Controller
import { getDesignations, addDesignation } from '../controllers/designationController.js';

// All routes protected by auth
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile-picture', upload.single('profilePicture'), uploadProfilePicture);
router.get('/assigned-classes', getAssignedClasses);

// Attendance routes
router.post('/attendance/mark', markAttendance);
router.get('/attendance/daily', getDailyReport);
router.get('/attendance/monthly', getMonthlyReport);

// Leave routes
router.post('/leave/apply', applyLeave);
router.get('/leaves', getMyLeaves);
router.put('/leave/:id/status', updateLeaveStatus);

// Timetable routes
router.get('/timetable', getTimetable);
router.put('/timetable/:id', updateTimetable);

// Work Assignment routes
router.post('/work/assign', createAssignment);
router.get('/work/assignments', getAssignments);
router.get('/work/:id/submissions', getSubmissions);
router.put('/work/:id/submission', updateSubmission);

// Message routes
router.post('/messages/send', sendMessage);
router.get('/messages/inbox', getInbox);
router.get('/messages/sent', getSent);
router.put('/messages/:id/read', markAsRead);

// Payroll routes
router.get('/payroll', getPayroll);
router.post('/payroll/generate', generatePayslip);

// Document routes
router.get('/documents/course', getDocumentsByCourse);
router.put('/documents/verify', verifyDocument);
router.get('/documents/download/:studentId/:documentType', downloadDocument);

// Circular routes
router.get('/circulars', getStaffCirculars);

// Designation routes
router.get('/designations', getDesignations);
router.post('/designations', addDesignation);

export default router;
