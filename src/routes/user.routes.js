import express from 'express';
import { protect } from '../middleware/auth.js';
import { getUsers, getUser, addUser, editUser, deleteUser, resetPassword } from '../controllers/userController.js';
import { getAllDocuments, verifyDocument, downloadDocument } from '../controllers/documentController.js';

const router = express.Router();

// All routes require authentication and admin role or faculty role
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Access denied. Admin or faculty role required.' });
  }
  next();
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', getUsers);

// @route   GET /api/users/:id/:role
// @desc    Get single user by ID and role
// @access  Private (Admin only)
router.get('/:id/:role', getUser);

// @route   POST /api/users
// @desc    Add new user
// @access  Private (Admin only)
router.post('/', addUser);

// @route   POST /api/users/staff/register
// @desc    Register new staff
// @access  Private (Admin only)
router.post('/staff/register', addUser);

// @route   PUT /api/users/:id/:role
// @desc    Edit user
// @access  Private (Admin only)
router.put('/:id/:role', editUser);

// @route   DELETE /api/users/:id/:role
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id/:role', deleteUser);

// @route   PUT /api/users/reset-password/:id/:role
// @desc    Reset user password
// @access  Private (Admin only)
router.put('/reset-password/:id/:role', resetPassword);

// @route   GET /api/users/documents
// @desc    Get all student documents with optional course filter
// @access  Private (Admin only)
router.get('/documents', getAllDocuments);

// @route   PUT /api/users/documents/verify
// @desc    Verify student document
// @access  Private (Admin only)
router.put('/documents/verify', verifyDocument);

// @route   GET /api/users/documents/download/:studentId/:documentType
// @desc    Download student document
// @access  Private (Admin only)
router.get('/documents/download/:studentId/:documentType', downloadDocument);

export default router;
