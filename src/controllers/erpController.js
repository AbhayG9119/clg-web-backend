import AcademicSession from '../models/AcademicSession.js';
import FeeStructure from '../models/FeeStructure.js';
import TransportRoute from '../models/TransportRoute.js';
import StudentTransport from '../models/StudentTransport.js';
import HostelFee from '../models/HostelFee.js';
import StudentHostel from '../models/StudentHostel.js';
import FeeDiscount from '../models/FeeDiscount.js';
import Subject from '../models/Subject.js';
import Circular from '../models/Circular.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import jwt from 'jsonwebtoken';

// Helper function to get student model
const getStudentModel = (department) => {
  switch (department) {
    case 'B.A': return StudentBAS;
    case 'B.Sc': return StudentBSc;
    case 'B.Ed': return StudentBEd;
    default: return null;
  }
};

// Helper function to find student by ID
const findStudentById = async (id) => {
  let student = await StudentBAS.findById(id);
  if (student) return { student, model: StudentBAS, department: 'B.A' };

  student = await StudentBSc.findById(id);
  if (student) return { student, model: StudentBSc, department: 'B.Sc' };

  student = await StudentBEd.findById(id);
  if (student) return { student, model: StudentBEd, department: 'B.Ed' };

  return null;
};

// Session Management
export const createSession = async (req, res) => {
  try {
    const { sessionId, startDate, endDate, description, department } = req.body;

    console.log('Received department:', department);

    // Map frontend department values to backend values
    const departmentMapping = {
      'BA': 'B.A',
      'BSc': 'B.Sc',
      'BEd': 'B.Ed'
    };

    const backendDepartment = departmentMapping[department];
    console.log('backendDepartment:', backendDepartment);

    if (!backendDepartment) {
      console.log('Invalid department received');
      return res.status(400).json({ message: 'Invalid department' });
    }

    // Define course durations
    const courseDurations = {
      'B.A': 3,
      'B.Sc': 3,
      'B.Ed': 2
    };

    // Generate batches only for the selected department
    const batches = [];
    const duration = courseDurations[backendDepartment];
    console.log('Duration for department:', backendDepartment, duration);

    if (!duration) {
      console.log('ERROR: No duration found for department:', backendDepartment);
      return res.status(400).json({ message: 'Invalid department duration' });
    }

    for (let year = 1; year <= duration; year++) {
      batches.push({
        batchId: `${sessionId}-${backendDepartment.replace('.', '')}-Year${year}`,
        year,
        department: backendDepartment,
        courseDuration: duration,
        isActive: true
      });
      console.log(`Generated batch ${year}:`, batches[batches.length - 1]);
    }

    console.log('Generated batches count:', batches.length);
    console.log('Batches array:', batches);

    const session = new AcademicSession({
      sessionId,
      startDate,
      endDate,
      description,
      department: backendDepartment,
      isActive: false,
      batches
    });

    await session.save();
    console.log('Session saved with department:', session.department);

    res.status(201).json({
      message: `Session created successfully with ${batches.length} batches generated!`,
      session,
      generatedBatches: batches.length
    });
  } catch (error) {
    console.error('Error creating session:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Session ID already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const activateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AcademicSession.findOneAndUpdate(
      { sessionId },
      { isActive: true },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session activated successfully', session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSessions = async (req, res) => {
  try {
    const { department } = req.query;
    let query = {};
    if (department) {
      query.department = department;
    }
    const sessions = await AcademicSession.find(query).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get batches for a specific session
export const getBatchesForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AcademicSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session.batches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fee Structure Management
export const createFeeStructure = async (req, res) => {
  try {
    const { sessionId, classId, feeHeads, description } = req.body;

    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const feeStructure = new FeeStructure({
      sessionId: session._id,
      classId,
      feeHeads,
      description
    });

    await feeStructure.save();
    res.status(201).json({ message: 'Fee structure created successfully', feeStructure });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFeeStructures = async (req, res) => {
  try {
    const feeStructures = await FeeStructure.find()
      .populate('sessionId', 'sessionId startDate endDate isActive')
      .sort({ createdAt: -1 });
    res.json(feeStructures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Transport Management
export const createTransportRoute = async (req, res) => {
  try {
    const { routeId, routeName, fare, description, stops } = req.body;

    const route = new TransportRoute({
      routeId,
      routeName,
      fare,
      description,
      stops
    });

    await route.save();
    res.status(201).json({ message: 'Transport route created successfully', route });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignTransportToStudent = async (req, res) => {
  try {
    const { studentId, routeId, sessionId, pickupPoint } = req.body;

    const studentData = await findStudentById(studentId);
    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const route = await TransportRoute.findOne({ routeId });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const studentTransport = new StudentTransport({
      studentId: studentData.student._id,
      studentModel: studentData.model.modelName,
      routeId: route._id,
      sessionId: session._id,
      fare: route.fare,
      pickupPoint
    });

    await studentTransport.save();
    res.status(201).json({ message: 'Transport assigned successfully', studentTransport });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Student already has transport for this session' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const getTransportRoutes = async (req, res) => {
  try {
    const routes = await TransportRoute.find({ isActive: true });
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Hostel Management
export const createHostelFee = async (req, res) => {
  try {
    const { hostelId, hostelName, roomType, feeType, amount, description } = req.body;

    const hostelFee = new HostelFee({
      hostelId,
      hostelName,
      roomType,
      feeType,
      amount,
      description
    });

    await hostelFee.save();
    res.status(201).json({ message: 'Hostel fee created successfully', hostelFee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const assignHostelToStudent = async (req, res) => {
  try {
    const { studentId, hostelId, sessionId, roomNumber } = req.body;

    const studentData = await findStudentById(studentId);
    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const hostel = await HostelFee.findOne({ hostelId });
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const studentHostel = new StudentHostel({
      studentId: studentData.student._id,
      studentModel: studentData.model.modelName,
      hostelId: hostel._id,
      sessionId: session._id,
      roomNumber,
      feeAmount: hostel.amount,
      feeType: hostel.feeType
    });

    await studentHostel.save();
    res.status(201).json({ message: 'Hostel assigned successfully', studentHostel });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Student already has hostel for this session' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const getHostelFees = async (req, res) => {
  try {
    const hostels = await HostelFee.find({ isActive: true });
    res.json(hostels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Discount Management
export const applyDiscount = async (req, res) => {
  try {
    const { studentId, sessionId, discountType, amount, reason } = req.body;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can apply discounts' });
    }

    const studentData = await findStudentById(studentId);
    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const discountId = `DISC${Date.now()}`;

    const discount = new FeeDiscount({
      studentId: studentData.student._id,
      studentModel: studentData.model.modelName,
      sessionId: session._id,
      discountId,
      discountType,
      amount,
      reason,
      approvedBy: decoded.id
    });

    await discount.save();
    res.status(201).json({ message: 'Discount applied successfully', discount });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Discount already exists for this student and type' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const getDiscounts = async (req, res) => {
  try {
    const discounts = await FeeDiscount.find()
      .populate('studentId', 'firstName lastName email studentId')
      .populate('sessionId', 'sessionId')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Subject Management
export const createSubject = async (req, res) => {
  try {
    const { subjectId, subjectName, subjectCode, classId, sessionId, department, credits, description } = req.body;

    const session = await AcademicSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const subject = new Subject({
      subjectId,
      subjectName,
      subjectCode,
      classId,
      sessionId: session._id,
      department,
      credits,
      description
    });

    await subject.save();
    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .populate('sessionId', 'sessionId startDate endDate isActive')
      .sort({ subjectName: 1 });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fee Receipt Generation
export const generateFeeReceipt = async (req, res) => {
  try {
    const { studentId, sessionId } = req.params;

    // Find student
    const studentData = await findStudentById(studentId);
    if (!studentData) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find session
    const session = await AcademicSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Find fee structure for student's class and session
    const feeStructure = await FeeStructure.findOne({
      sessionId: session._id,
      classId: `${studentData.department} Year ${studentData.student.year}`
    });

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found for this class and session' });
    }

    // Find transport assignment
    const transport = await StudentTransport.findOne({
      studentId: studentData.student._id,
      sessionId: session._id,
      isActive: true
    }).populate('routeId', 'routeName');

    // Find hostel assignment
    const hostel = await StudentHostel.findOne({
      studentId: studentData.student._id,
      sessionId: session._id,
      isActive: true
    }).populate('hostelId', 'hostelName');

    // Find discounts
    const discounts = await FeeDiscount.find({
      studentId: studentData.student._id,
      sessionId: session._id,
      isActive: true
    });

    // Calculate totals
    let baseFees = feeStructure.totalAmount;
    let transportFee = transport ? transport.fare : 0;
    let hostelFee = hostel ? hostel.feeAmount : 0;
    let totalDiscounts = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    let totalAmount = baseFees + transportFee + hostelFee - totalDiscounts;

    // Generate receipt
    const receipt = {
      receiptId: `REC${Date.now()}`,
      student: {
        studentId: studentData.student.studentId,
        name: `${studentData.student.firstName} ${studentData.student.lastName}`,
        department: studentData.student.department,
        year: studentData.student.year,
        semester: studentData.student.semester,
        email: studentData.student.email
      },
      session: {
        sessionId: session.sessionId,
        startDate: session.startDate,
        endDate: session.endDate
      },
      feeBreakdown: {
        baseFees: {
          amount: baseFees,
          details: feeStructure.feeHeads
        },
        transportFee: transport ? {
          amount: transportFee,
          route: transport.routeId.routeName,
          pickupPoint: transport.pickupPoint
        } : null,
        hostelFee: hostel ? {
          amount: hostelFee,
          hostelName: hostel.hostelId.hostelName,
          roomNumber: hostel.roomNumber,
          feeType: hostel.feeType
        } : null,
        discounts: discounts.map(d => ({
          discountId: d.discountId,
          type: d.discountType,
          amount: d.amount,
          reason: d.reason
        })),
        totalDiscounts,
        totalAmount
      },
      generatedAt: new Date()
    };

    res.json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


