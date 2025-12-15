import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';
import studentModel from '../models/studentModel.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }

      // Fetch user details based on role
      let user = null;
      if (decoded.role === 'admin') {
        user = await Admin.findById(decoded.id).select('-password');
      } else if (decoded.role === 'faculty' || decoded.role === 'staff') {
        user = await Faculty.findById(decoded.id).select('-password');
      } else if (decoded.role === 'student') {
        // Query all department collections for students
        user = await StudentBAS.findById(decoded.id).select('-password') ||
               await StudentBSc.findById(decoded.id).select('-password') ||
               await StudentBEd.findById(decoded.id).select('-password');
      } else {
        return res.status(400).json({ message: 'Invalid user role' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

export const protect = authenticateToken; // Alias for backward compatibility

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
