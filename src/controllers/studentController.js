import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import AcademicSession from '../models/AcademicSession.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Helper function to get student model based on department
const getStudentModel = (department) => {
  switch (department) {
    case 'B.A':
      return StudentBAS;
    case 'B.Sc':
      return StudentBSc;
    case 'B.Ed':
      return StudentBEd;
    default:
      return null;
  }
};

// Helper function to find student by ID across all collections
const findStudentById = async (id, populate = false) => {
  let student;
  if (populate) {
    student = await StudentBAS.findById(id).populate('sessionId');
    if (student) return { student, model: StudentBAS };

    student = await StudentBSc.findById(id).populate('sessionId');
    if (student) return { student, model: StudentBSc };

    student = await StudentBEd.findById(id).populate('sessionId');
    if (student) return { student, model: StudentBEd };
  } else {
    student = await StudentBAS.findById(id);
    if (student) return { student, model: StudentBAS };

    student = await StudentBSc.findById(id);
    if (student) return { student, model: StudentBSc };

    student = await StudentBEd.findById(id);
    if (student) return { student, model: StudentBEd };
  }

  return null;
};

// Get student profile
export const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentData = await findStudentById(decoded.id);

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student } = studentData;
    // Construct full name from firstName, middleName, lastName
    const name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
    res.json({
      name: name,
      email: student.email,
      department: student.department,
      year: student.year,
      semester: student.semester,
      mobileNumber: student.mobileNumber,
      profilePhoto: student.profilePhoto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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
export const uploadProfilePicture = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentData = await findStudentById(decoded.id);

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student, model } = studentData;

    // Delete old profile picture if exists
    if (student.profilePhoto) {
      const oldPhotoPath = path.join(process.cwd(), 'uploads', 'profile-pictures', path.basename(student.profilePhoto));
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update profile photo path
    student.profilePhoto = req.file.filename;
    await student.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePhoto: req.file.filename
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export multer middleware
export const uploadMiddleware = upload.single('profilePicture');

// Update student profile
export const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentData = await findStudentById(decoded.id);

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student, model } = studentData;
    const { name, mobileNumber } = req.body;

    // Update allowed fields (only name and mobileNumber)
    if (name !== undefined) {
      // Parse full name into firstName, middleName, lastName
      const nameParts = name.trim().split(' ');
      student.firstName = nameParts[0] || '';
      student.lastName = nameParts[nameParts.length - 1] || '';
      student.middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
    }
    if (mobileNumber !== undefined) student.mobileNumber = mobileNumber;

    await student.save();

    // Construct full name for response
    const updatedName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');

    res.json({
      message: 'Profile updated successfully',
      student: {
        name: updatedName,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        mobileNumber: student.mobileNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student profile by ID (for admin and student accessing own profile)
export const getStudentProfileById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { studentId, role } = req.params;

    // Validate studentId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Allow admin to access any student profile, or student to access their own profile
    if (decoded.role !== 'admin' && (decoded.role !== 'student' || decoded.id !== studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studentData = await findStudentById(studentId, true); // populate sessionId

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student } = studentData;
    // Construct full name from firstName, middleName, lastName
    const name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
res.json({
      name: name,
      email: student.email,
      department: student.department,
      year: student.year,
      semester: student.semester,
      mobileNumber: student.mobileNumber,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      address: student.address,
      guardianName: student.guardianName,
      guardianContact: student.guardianContact,
      rollNo: student.rollNo,
      studentId: student.studentId,
      section: student.section,
      sessionId: student.sessionId,
      batchId: student.batchId,
      admissionYear: student.admissionYear,
      profilePhoto: student.profilePhoto,
      documents: student.documents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update student profile by ID (for admin)
export const updateStudentProfileById = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this endpoint' });
    }

    const { studentId, role } = req.params;
    const studentData = await findStudentById(studentId);

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student, model } = studentData;
    const updateData = req.body;

    // Validation: Prevent setting required fields to empty strings
    const requiredFields = ['firstName', 'lastName', 'email', 'mobileNumber', 'rollNo', 'department', 'year', 'semester', 'sessionId', 'batchId', 'admissionYear', 'dateOfBirth', 'gender', 'bloodGroup', 'guardianName', 'guardianContact'];
    for (const field of requiredFields) {
      if (updateData[field] !== undefined && (updateData[field] === '' || updateData[field] === null)) {
        return res.status(400).json({ message: `${field} cannot be empty` });
      }
    }

    // Validate enum fields
    if (updateData.department !== undefined && !['B.A', 'B.Sc', 'B.Ed'].includes(updateData.department)) {
      return res.status(400).json({ message: 'Invalid department' });
    }
    if (updateData.gender !== undefined && !['Male', 'Female', 'Other'].includes(updateData.gender)) {
      return res.status(400).json({ message: 'Invalid gender' });
    }
    if (updateData.bloodGroup !== undefined && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(updateData.bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    // Validate sessionId if provided
    if (updateData.sessionId !== undefined && updateData.sessionId !== '') {
      if (!mongoose.Types.ObjectId.isValid(updateData.sessionId)) {
        return res.status(400).json({ message: 'Invalid sessionId' });
      }
    }

    // Update fields
    if (updateData.name !== undefined) {
      const trimmedName = updateData.name.trim();
      if (trimmedName === '') {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      const nameParts = trimmedName.split(' ');
      student.firstName = nameParts[0] || '';
      student.lastName = nameParts[nameParts.length - 1] || '';
      student.middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
    }
    if (updateData.mobileNumber !== undefined) student.mobileNumber = updateData.mobileNumber;
    if (updateData.dateOfBirth !== undefined) student.dateOfBirth = updateData.dateOfBirth;
    if (updateData.gender !== undefined) student.gender = updateData.gender;
    if (updateData.bloodGroup !== undefined) student.bloodGroup = updateData.bloodGroup;
    if (updateData.address !== undefined) student.address = updateData.address;
    if (updateData.guardianName !== undefined) student.guardianName = updateData.guardianName;
    if (updateData.guardianContact !== undefined) student.guardianContact = updateData.guardianContact;
    if (updateData.section !== undefined) student.section = updateData.section;
    if (updateData.department !== undefined) student.department = updateData.department;
    if (updateData.year !== undefined) student.year = updateData.year;
    if (updateData.semester !== undefined) student.semester = updateData.semester;
    if (updateData.rollNo !== undefined) student.rollNo = updateData.rollNo;
    if (updateData.sessionId !== undefined) student.sessionId = updateData.sessionId;
    if (updateData.batchId !== undefined) student.batchId = updateData.batchId;
    if (updateData.admissionYear !== undefined) student.admissionYear = updateData.admissionYear;
    // Handle documents field - ignore if sent as object from frontend
    // Documents are handled separately via document upload endpoints
    if (updateData.documents !== undefined) {
      // Do not update documents field from this endpoint
      delete updateData.documents;
    }

    await student.save();

    // Construct full name for response
    const updatedName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');

    res.json({
      message: 'Student profile updated successfully',
      student: {
        name: updatedName,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        mobileNumber: student.mobileNumber,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        address: student.address,
        guardianName: student.guardianName,
        guardianContact: student.guardianContact,
        rollNo: student.rollNo,
        section: student.section,
        sessionId: student.sessionId,
        batchId: student.batchId,
        admissionYear: student.admissionYear,
        documents: student.documents
      }
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
