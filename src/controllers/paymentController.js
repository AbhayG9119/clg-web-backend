// Import required models
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import FeePayment from '../models/FeePayment.js';
import FeeStructure from '../models/FeeStructure.js';
import Concession from '../models/Concession.js';

// Get student payments
export const getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all payments for this student
    const payments = await FeePayment.find({ studentId }).sort({ paymentDate: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student payments', error: error.message });
  }
};

// Get student details
export const getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find student to get details
    let student = await StudentBAS.findOne({ studentId });
    if (!student) {
      student = await StudentBSc.findOne({ studentId });
    }
    if (!student) {
      student = await StudentBEd.findOne({ studentId });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Return basic student details
    res.status(200).json({
      studentId: student.studentId,
      name: student.name,
      department: student.department,
      year: student.year,
      semester: student.semester,
      email: student.email,
      phone: student.phone
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student details', error: error.message });
  }
};

// Get all payments (for admin)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await FeePayment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all payments', error: error.message });
  }
};

// Get student's own payments
export const getMyPayments = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const payments = await FeePayment.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student payments', error: error.message });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await FeePayment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
};

// Initiate payment
export const initiatePayment = async (req, res) => {
  try {
    const { studentId, course, year, semester, paymentType, amount, paymentMethod, remarks, status, paymentDate } = req.body;

    const newPayment = new FeePayment({
      studentId,
      course,
      year,
      semester,
      paymentType,
      amount,
      paymentMethod,
      remarks,
      status: status || 'Pending',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
    });

    const savedPayment = await newPayment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Error initiating payment', error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await FeePayment.findByIdAndUpdate(
      id,
      { status, paymentDate: status === 'Paid' ? new Date() : undefined },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

// Calculate student fee balance
export const calculateStudentFeeBalance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find student to get course
    let student = await StudentBAS.findOne({ studentId });
    if (!student) {
      student = await StudentBSc.findOne({ studentId });
    }
    if (!student) {
      student = await StudentBEd.findOne({ studentId });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const course = student.department;
    const year = student.year;
    const semester = student.semester;

    // Get fee structure
    const feeStructure = await FeeStructure.findOne({ course });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Get all payments for this student
    const payments = await FeePayment.find({
      studentId,
      status: 'Paid'
    }).sort({ paymentDate: -1 });

    // Get active concessions
    const concessions = await Concession.find({
      studentId,
      course,
      academicYear: year,
      semester,
      status: 'active'
    });

    // Calculate total concessions
    let totalConcessions = 0;
    concessions.forEach(concession => {
      if (concession.isPercentage) {
        totalConcessions += (concession.percentage / 100) * feeStructure.totalFee;
      } else {
        totalConcessions += concession.amount || 0;
      }
    });

    // Calculate paid amounts per fee head (simplified - distribute payments proportionally)
    const feeHeads = Object.keys(feeStructure.feeComponents);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const adjustedTotalFee = feeStructure.totalFee - totalConcessions;

    // Calculate balance for each fee head
    const feeBalances = feeHeads.map(head => {
      const headAmount = feeStructure.feeComponents[head];
      const headProportion = headAmount / feeStructure.totalFee;
      const paidForHead = totalPaid * headProportion;
      const balance = Math.max(0, headAmount - paidForHead);

      return {
        head: head.charAt(0).toUpperCase() + head.slice(1).replace('Fee', ' Fee'),
        total: headAmount,
        paid: Math.min(headAmount, paidForHead),
        balance: balance
      };
    });

    const totalBalance = feeBalances.reduce((sum, fee) => sum + fee.balance, 0);

    res.status(200).json({
      studentId,
      course,
      year,
      semester,
      feeBalances,
      totalPaid,
      totalConcessions,
      totalBalance,
      payments: payments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating fee balance', error: error.message });
  }
};
