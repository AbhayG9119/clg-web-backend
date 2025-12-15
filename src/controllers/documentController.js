import jwt from 'jsonwebtoken';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
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
const findStudentById = async (id) => {
  let student = await StudentBAS.findById(id);
  if (student) return { student, model: StudentBAS };

  student = await StudentBSc.findById(id);
  if (student) return { student, model: StudentBSc };

  student = await StudentBEd.findById(id);
  if (student) return { student, model: StudentBEd };

  return null;
};

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// Upload document
export const uploadDocument = async (req, res) => {
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
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if document type already exists
    const existingDocIndex = student.documents.findIndex(doc => doc.type === documentType);

    if (existingDocIndex !== -1) {
      // Delete old file if exists
      if (student.documents[existingDocIndex].filePath) {
        const oldFilePath = path.join(process.cwd(), 'uploads', 'documents', path.basename(student.documents[existingDocIndex].filePath));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      // Update existing document
      student.documents[existingDocIndex].filePath = req.file.filename;
      student.documents[existingDocIndex].status = 'Uploaded';
      student.documents[existingDocIndex].uploadedAt = new Date();
    } else {
      // Add new document
      student.documents.push({
        type: documentType,
        status: 'Uploaded',
        filePath: req.file.filename,
        uploadedAt: new Date()
      });
    }

    await student.save();

    res.json({
      message: 'Document uploaded successfully',
      document: {
        type: documentType,
        status: 'Uploaded',
        filePath: req.file.filename
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student's own documents
export const getStudentDocuments = async (req, res) => {
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

    res.json({
      documents: student.documents.map(doc => ({
        type: doc.type,
        status: doc.status,
        fileName: doc.filePath ? path.basename(doc.filePath) : null,
        uploadedAt: doc.uploadedAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all students' documents by course (for staff)
export const getDocumentsByCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Faculty = (await import('../models/Faculty.js')).default;
    const staff = await Faculty.findById(decoded.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    // Special handling for Fees Administrators
    if (staff.designation === 'Fees Administrator') {
      let allStudents = [];
      const models = [StudentBAS, StudentBSc, StudentBEd];

      for (const model of models) {
        const students = await model.find({}, 'firstName lastName studentId documents department');
        allStudents = allStudents.concat(students.map(student => ({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          course: student.department,
          documents: student.documents.map(doc => ({
            type: doc.type,
            status: doc.status,
            fileName: doc.filePath ? path.basename(doc.filePath) : null,
            uploadedAt: doc.uploadedAt
          }))
        })));
      }

      return res.json({ students: allStudents });
    }

    // For regular staff, check department
    if (!staff.department) {
      return res.status(400).json({ message: 'Staff department not assigned' });
    }

    // Map department to course
    const departmentToCourse = {
      'BA': 'B.A',
      'BSc': 'B.Sc',
      'BEd': 'B.Ed'
    };

    const course = departmentToCourse[staff.department] || staff.department;
    const model = getStudentModel(course);

    if (!model) {
      return res.status(400).json({ message: 'Invalid course for staff department' });
    }

    const students = await model.find({}, 'firstName lastName studentId documents department');

    const result = students.map(student => ({
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      course: student.department,
      documents: student.documents.map(doc => ({
        type: doc.type,
        status: doc.status,
        fileName: doc.filePath ? path.basename(doc.filePath) : null,
        uploadedAt: doc.uploadedAt
      }))
    }));

    res.json({ students: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all students' documents with optional course filter (for admin)
export const getAllDocuments = async (req, res) => {
  try {
    const { course } = req.query;
    let allStudents = [];

    const models = course ? [getStudentModel(course)] : [StudentBAS, StudentBSc, StudentBEd];

    for (const model of models) {
      if (model) {
        const students = await model.find({}, 'firstName lastName studentId documents department');
        allStudents = allStudents.concat(students.map(student => ({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          course: student.department,
          documents: student.documents.map(doc => ({
            type: doc.type,
            status: doc.status,
            fileName: doc.filePath ? path.basename(doc.filePath) : null,
            uploadedAt: doc.uploadedAt
          }))
        })));
      }
    }

    res.json({ students: allStudents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify or reject document (for staff/admin)
export const verifyDocument = async (req, res) => {
  try {
    const { studentId, documentType, status } = req.body;
    const studentData = await findStudentById(studentId);

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student, model } = studentData;
    const docIndex = student.documents.findIndex(doc => doc.type === documentType);

    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Verified or Rejected.' });
    }

    student.documents[docIndex].status = status;
    await student.save();

    res.json({ message: `Document ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download document
export const downloadDocument = async (req, res) => {
  try {
    const { studentId, documentType } = req.params;
    const studentData = await findStudentById(studentId);

    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { student } = studentData;
    const document = student.documents.find(doc => doc.type === documentType);

    if (!document || !document.filePath) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'documents', document.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, document.filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export multer middleware
export const uploadMiddleware = upload.single('document');
