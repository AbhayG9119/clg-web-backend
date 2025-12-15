import Faculty from '../models/Faculty.js';
import Attendance from '../models/Attendance.js';
import Timetable from '../models/Timetable.js';
import WorkAssignment from '../models/WorkAssignment.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Get staff profile
const getProfile = async (req, res) => {
  try {
    const staffId = req.user.id; // Assuming auth middleware sets req.user
    const staff = await Faculty.findById(staffId).select('-password');
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    console.log('Staff profile retrieved:', { id: staff._id, profilePicture: staff.profilePicture, staffId: staff.staffId });
    res.json(staff);
  } catch (error) {
    console.error('Error retrieving staff profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update staff profile
const updateProfile = async (req, res) => {
  try {
    const staffId = req.user.id;
    const updates = req.body;
    const staff = await Faculty.findByIdAndUpdate(staffId, updates, { new: true }).select('-password');
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get assigned classes (from timetable or custom field in Faculty)
const getAssignedClasses = async (req, res) => {
  try {
    const staffId = req.user.id;
    const timetable = await Timetable.find({ staffId }).populate('staffId', 'name designation');
    const classes = timetable.map(t => ({ class: t.class, subject: t.subject, day: t.day }));
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-pictures';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const staffId = req.user.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${staffId}-${timestamp}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const staffId = req.user.id;
    const profilePicturePath = req.file.filename;

    // Update faculty profile with new picture path
    const staff = await Faculty.findByIdAndUpdate(
      staffId,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePicturePath,
      staff
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getProfile, updateProfile, getAssignedClasses, uploadProfilePicture, upload };
