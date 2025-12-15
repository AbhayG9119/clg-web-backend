import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import AcademicSession from '../models/AcademicSession.js';
import bcrypt from 'bcrypt';

// Get all users
export const getUsers = async (req, res) => {
  try {
    console.log('Fetching users...'); // Add logging
    const { search, role } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const admins = await Admin.find(search ? { email: { $regex: search, $options: 'i' } } : {}).select('-password');
    console.log('Admins fetched:', admins.length); // Add logging
    const faculty = await Faculty.find(search ? { name: { $regex: search, $options: 'i' }, username: { $regex: search, $options: 'i' } } : {}).select('-password');
    console.log('Faculty fetched:', faculty.length); // Add logging
    const studentsBAS = await StudentBAS.find(search ? query : {}).select('-password');
    console.log('StudentBAS fetched:', studentsBAS.length); // Add logging
    const studentsBSc = await StudentBSc.find(search ? query : {}).select('-password');
    console.log('StudentBSc fetched:', studentsBSc.length); // Add logging
    const studentsBEd = await StudentBEd.find(search ? query : {}).select('-password');
    console.log('StudentBEd fetched:', studentsBEd.length); // Add logging

    const users = [
      ...admins.map(user => ({ ...user.toObject(), role: 'admin', name: user.email, id: user._id })),
      ...faculty.map(user => ({ ...user.toObject(), role: 'faculty', name: user.name || user.username, id: user._id })),
      ...studentsBAS.map(user => ({ ...user.toObject(), role: 'student', department: user.department, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email, id: user.studentId, class: `${user.department} ${user.year}`, session: `${user.year}-${user.year + 1}` })),
      ...studentsBSc.map(user => ({ ...user.toObject(), role: 'student', department: user.department, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email, id: user.studentId, class: `${user.department} ${user.year}`, session: `${user.year}-${user.year + 1}` })),
      ...studentsBEd.map(user => ({ ...user.toObject(), role: 'student', department: user.department, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email, id: user.studentId, class: `${user.department} ${user.year}`, session: `${user.year}-${user.year + 1}` }))
    ];

    console.log('Total users:', users.length); // Add logging
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error);
    console.error('Error details:', error.message); // Add more logging
    console.error('Error stack:', error.stack); // Add stack trace
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single user by ID and role
export const getUser = async (req, res) => {
  const { id, role } = req.params;

  try {
    let user;
    let Model;

    if (role === 'admin') {
      Model = Admin;
    } else if (role === 'faculty') {
      Model = Faculty;
    } else if (role === 'student') {
      // For students, id is studentId, not _id
      user = await StudentBAS.findOne({ studentId: id }).select('-password') ||
             await StudentBSc.findOne({ studentId: id }).select('-password') ||
             await StudentBEd.findOne({ studentId: id }).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Add role and name to the user object
      const userObj = user.toObject();
      userObj.role = 'student';
      userObj.name = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || userObj.username || userObj.email;
      return res.json(userObj);
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    user = await Model.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add role and name to the user object
    const userObj = user.toObject();
    userObj.role = role;
    if (role === 'admin') {
      userObj.name = userObj.email;
    } else if (role === 'faculty') {
      userObj.name = userObj.name || userObj.username;
    }

    res.json(userObj);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new user
export const addUser = async (req, res) => {
  const { name, email, password, role, department, mobileNumber, designation, subject, subjectsTaught, qualifications, joiningDate, phone, address, sessionId, batchId, admissionYear } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  try {
    let user;

    if (role === 'admin') {
      user = new Admin({ email, password });
    } else if (role === 'faculty') {
      if (!name || !designation || !req.body.staffId) {
        return res.status(400).json({ message: 'Name, designation, and staffId are required for faculty' });
      }
      // For Fees Administrator, department and subject are not required
      if (designation !== 'Fees Administrator' && (!department || !subject)) {
        return res.status(400).json({ message: 'Department and subject are required for this designation' });
      }
      user = new Faculty({
        username: email, // Use email as username
        email,
        password,
        name,
        designation,
        department: designation === 'Fees Administrator' ? null : department,
        subject: designation === 'Fees Administrator' ? null : subject,
        subjectsTaught: subjectsTaught || [],
        qualifications,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        phone,
        address,
        staffId: req.body.staffId // Add staffId from request body
      });
    } else if (role === 'student') {
      if (!name || !department || !sessionId || !batchId || !mobileNumber) {
        return res.status(400).json({ message: 'Name, department, sessionId, batchId, and mobile number are required for students' });
      }

      // Fetch the session and batch to get year
      const session = await AcademicSession.findById(sessionId);
      if (!session) {
        return res.status(400).json({ message: 'Invalid session ID' });
      }

      const batch = session.batches.find(b => b.batchId === batchId);
      if (!batch) {
        return res.status(400).json({ message: 'Invalid batch ID for the selected department' });
      }

      const year = batch.year;
      const semester = 1; // Default semester, can be updated later

      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Generate roll number
      const rollNo = `${department.replace('.', '')}${year}${semester}${Date.now().toString().slice(-4)}`;

      // Default values for required fields
      const defaultAddress = {
        street: 'Not Provided',
        city: 'Not Provided',
        state: 'Not Provided',
        pincode: '000000'
      };

      const studentData = {
        firstName,
        lastName,
        username: email, // Use email as username
        email,
        password,
        mobileNumber,
        rollNo,
        department,
        year: parseInt(year),
        semester: parseInt(semester),
        sessionId: new mongoose.Types.ObjectId(sessionId),
        batchId,
        admissionYear: admissionYear ? parseInt(admissionYear) : new Date().getFullYear() + 1,
        dateOfBirth: new Date('2000-01-01'), // Default DOB
        gender: 'Male', // Default gender
        bloodGroup: 'O+', // Default blood group
        address: defaultAddress,
        guardianName: 'Not Provided',
        guardianContact: 'Not Provided',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Not Provided'
      };

      if (department === 'B.A') {
        user = new StudentBAS(studentData);
      } else if (department === 'B.Sc') {
        user = new StudentBSc(studentData);
      } else if (department === 'B.Ed') {
        user = new StudentBEd(studentData);
      } else {
        return res.status(400).json({ message: 'Invalid department for student' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await user.save();
    res.status(201).json({ message: 'User added successfully', user: { ...user.toObject(), role } });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'User with this email already exists' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else if (error.name === 'CastError') {
      res.status(400).json({ message: 'Invalid data provided' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Edit user
export const editUser = async (req, res) => {
  const { id, role } = req.params;
  const updates = req.body;

  // Remove password from updates if empty
  if (!updates.password) {
    delete updates.password;
  }

  try {
    let user;
    let Model;

    if (role === 'admin') {
      Model = Admin;
    } else if (role === 'faculty') {
      Model = Faculty;
    } else if (role === 'student') {
      // Find existing user across all student models
      const existingUser = await StudentBAS.findById(id) || await StudentBSc.findById(id) || await StudentBEd.findById(id);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // For students, parse the 'name' field into firstName, middleName, lastName
      if (updates.name !== undefined) {
        const nameParts = updates.name.trim().split(/\s+/);
        if (nameParts.length === 1) {
          updates.firstName = nameParts[0];
          updates.lastName = '';
          updates.middleName = '';
        } else if (nameParts.length === 2) {
          updates.firstName = nameParts[0];
          updates.lastName = nameParts[1];
          updates.middleName = '';
        } else {
          updates.firstName = nameParts[0];
          updates.lastName = nameParts[nameParts.length - 1];
          updates.middleName = nameParts.slice(1, -1).join(' ');
        }
        delete updates.name; // Remove the original name field
      }

      // Check if department is changing
      const newDepartment = updates.department || existingUser.department;
      const oldDepartment = existingUser.department;

      if (newDepartment !== oldDepartment) {
        // Department is changing, need to move user to new collection
        let NewModel;
        if (newDepartment === 'B.A') {
          NewModel = StudentBAS;
        } else if (newDepartment === 'B.Sc') {
          NewModel = StudentBSc;
        } else if (newDepartment === 'B.Ed') {
          NewModel = StudentBEd;
        } else {
          return res.status(400).json({ message: 'Invalid department' });
        }

        // Delete from old collection
        if (oldDepartment === 'B.A') {
          await StudentBAS.findByIdAndDelete(id);
        } else if (oldDepartment === 'B.Sc') {
          await StudentBSc.findByIdAndDelete(id);
        } else if (oldDepartment === 'B.Ed') {
          await StudentBEd.findByIdAndDelete(id);
        }

        // Create in new collection with updated data
        const newUserData = { ...existingUser.toObject(), ...updates };
        delete newUserData._id; // Remove _id for new document
        delete newUserData.__v; // Remove version key
        delete newUserData.studentId; // Remove studentId to regenerate
        // Regenerate rollNo for new department
        const newYear = updates.year || existingUser.year;
        const newSemester = updates.semester || existingUser.semester;
        newUserData.rollNo = `${newDepartment.replace('.', '')}${newYear}${newSemester}${Date.now().toString().slice(-4)}`;
        user = new NewModel(newUserData);
        await user.save();
      } else {
        // No department change, update in place
        if (oldDepartment === 'B.A') {
          Model = StudentBAS;
        } else if (oldDepartment === 'B.Sc') {
          Model = StudentBSc;
        } else if (oldDepartment === 'B.Ed') {
          Model = StudentBEd;
        }
        user = await Model.findByIdAndUpdate(id, updates, { new: true }).select('-password');
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // For non-student roles or when not moving, user is already set
    if (!user) {
      user = await Model.findByIdAndUpdate(id, updates, { new: true }).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    res.json({ message: 'User updated successfully', user: { ...user.toObject(), role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id, role } = req.params;

  try {
    let Model;
    let user;

    if (role === 'admin') {
      Model = Admin;
    } else if (role === 'faculty') {
      Model = Faculty;
    } else if (role === 'student') {
      user = await StudentBAS.findById(id) || await StudentBSc.findById(id) || await StudentBEd.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.department === 'B.A') {
        Model = StudentBAS;
      } else if (user.department === 'B.Sc') {
        Model = StudentBSc;
      } else if (user.department === 'B.Ed') {
        Model = StudentBEd;
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    user = await Model.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { id, role } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    let Model;
    let user;

    if (role === 'admin') {
      Model = Admin;
    } else if (role === 'faculty') {
      Model = Faculty;
    } else if (role === 'student') {
      user = await StudentBAS.findById(id) || await StudentBSc.findById(id) || await StudentBEd.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.department === 'B.A') {
        Model = StudentBAS;
      } else if (user.department === 'B.Sc') {
        Model = StudentBSc;
      } else if (user.department === 'B.Ed') {
        Model = StudentBEd;
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user = await Model.findByIdAndUpdate(id, { password: hashedPassword }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
