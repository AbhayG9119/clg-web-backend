import express from 'express';
import multer from 'multer';
import { submitContact, getContacts } from '../controllers/contactController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Submit Contact
router.post('/', upload.single('attachment'), submitContact);

// Get all Contacts
router.get('/', getContacts);

export default router;
