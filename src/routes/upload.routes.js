import express from 'express';
import { uploadProfilePhoto, uploadIdProof, upload } from '../controllers/uploadController.js';

const router = express.Router();

// @route   POST /api/upload/profile-photo
// @desc    Upload profile photo
// @access  Private (should be protected with auth middleware)
router.post('/profile-photo', upload.single('profilePhoto'), uploadProfilePhoto);

// @route   POST /api/upload/id-proof
// @desc    Upload ID proof
// @access  Private (should be protected with auth middleware)
router.post('/id-proof', upload.single('idProof'), uploadIdProof);

export default router;
