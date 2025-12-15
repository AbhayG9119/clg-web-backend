import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/studentModel.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';

const generateToken = (id, role, designation) => {
  return jwt.sign({ id, role, designation }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const login = async (req, res) => {
  const { email, password, role: requestedRole } = req.body;

  if (!email || !password || !requestedRole) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  try {
    let user;
    let role;

    if (requestedRole === 'admin') {
      user = await Admin.findOne({ email });
      role = 'admin';
    } else if (requestedRole === 'faculty') {
      user = await Faculty.findOne({ email });
      role = 'faculty';
    } else if (requestedRole === 'student') {
      // Query all department collections for students
      user = await StudentBAS.findOne({ email }) ||
             await StudentBSc.findOne({ email }) ||
             await StudentBEd.findOne({ email });
      role = 'student';
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, role, user.designation, user.department);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role,
        name: user.username || user.name || user.email,
        designation: user.designation || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


