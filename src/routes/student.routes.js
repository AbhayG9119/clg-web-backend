import express from 'express';
import { getProfile, updateProfile, uploadProfilePicture, uploadMiddleware, getStudentProfileById, updateStudentProfileById } from '../controllers/studentController.js';
import { uploadDocument, getStudentDocuments, uploadMiddleware as docUploadMiddleware, downloadDocument } from '../controllers/documentController.js';

const router = express.Router();

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Private (Student)
router.get('/profile', getProfile);

// @route   PUT /api/student/profile
// @desc    Update student profile
// @access  Private (Student)
router.put('/profile', updateProfile);

// @route   GET /api/student/profile/:studentId/:role
// @desc    Get student profile by ID (Admin only)
// @access  Private (Admin)
router.get('/profile/:studentId/:role', getStudentProfileById);

// @route   PUT /api/student/profile/:studentId/:role
// @desc    Update student profile by ID (Admin only)
// @access  Private (Admin)
router.put('/profile/:studentId/:role', updateStudentProfileById);

// @route   POST /api/student/profile-picture
// @desc    Upload student profile picture
// @access  Private (Student)
router.post('/profile-picture', uploadMiddleware, uploadProfilePicture);

// @route   POST /api/student/documents
// @desc    Upload student document
// @access  Private (Student)
router.post('/documents', docUploadMiddleware, uploadDocument);

// @route   GET /api/student/documents
// @desc    Get student documents
// @access  Private (Student)
router.get('/documents', getStudentDocuments);

// @route   GET /api/student/documents/download/:documentType
// @desc    Download student document
// @access  Private (Student)
router.get('/documents/download/:documentType', downloadDocument);

export default router;
