import Receipt from '../models/Receipt.js';
import FeePayment from '../models/FeePayment.js';
import FeeStructure from '../models/FeeStructure.js';
import Concession from '../models/Concession.js';
import AuditLog from '../models/AuditLog.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import AcademicSession from '../models/AcademicSession.js';
import pdfkit from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate receipt PDF
export const generateReceiptPDF = async (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const receiptsDir = path.join(__dirname, '..', '..', 'uploads', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const pdfPath = path.join(receiptsDir, `${receipt.receiptNumber}.pdf`);
      const doc = new pdfkit();

      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // PDF Content
      doc.fontSize(20).text('College Fee Receipt', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Receipt Number: ${receipt.receiptNumber}`);
      doc.text(`Date: ${receipt.issuedDate.toLocaleDateString()}`);
      doc.moveDown();

      doc.text(`Student ID: ${receipt.studentId}`);
      doc.text(`Student Name: ${receipt.studentName}`);
      doc.text(`Course: ${receipt.course}`);
      doc.text(`Year: ${receipt.year}, Semester: ${receipt.semester}`);
      doc.moveDown();

      doc.text(`Payment Type: ${receipt.paymentType}`);
      doc.text(`Payment Method: ${receipt.paymentMethod}`);
      if (receipt.transactionId) {
        doc.text(`Transaction ID: ${receipt.transactionId}`);
      }
      doc.moveDown();

      // Fee Breakdown
      doc.fontSize(14).text('Fee Breakdown:', { underline: true });
      doc.fontSize(12);
      const breakdown = receipt.feeBreakdown;
      if (breakdown) {
        doc.text(`Tuition Fee: ₹${breakdown.tuitionFee || 0}`);
        doc.text(`Library Fee: ₹${breakdown.libraryFee || 0}`);
        doc.text(`Laboratory Fee: ₹${breakdown.laboratoryFee || 0}`);
        doc.text(`Examination Fee: ₹${breakdown.examinationFee || 0}`);
        doc.text(`Sports Fee: ₹${breakdown.sportsFee || 0}`);
        doc.text(`Development Fee: ₹${breakdown.developmentFee || 0}`);
        doc.text(`Miscellaneous Fee: ₹${breakdown.miscellaneousFee || 0}`);
        if (breakdown.concessions > 0) {
          doc.text(`Concessions: -₹${breakdown.concessions}`);
        }
        doc.moveDown();
        doc.fontSize(14).text(`Total Amount: ₹${receipt.amount}`, { bold: true });
      }

      doc.moveDown();
      doc.fontSize(10).text(`Issued By: ${receipt.issuedBy}`);
      doc.text('This is a computer generated receipt.', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/receipts/${receipt.receiptNumber}.pdf`);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Generate receipt for payment
export const generateReceipt = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    const payment = await FeePayment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'Paid') {
      return res.status(400).json({ message: 'Receipt can only be generated for successful payments' });
    }

    // Get fee structure
    const feeStructure = await FeeStructure.findOne({ course: payment.course });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Get active concessions for the student
    const concessions = await Concession.find({
      studentId: payment.studentId,
      course: payment.course,
      academicYear: payment.year,
      semester: payment.semester,
      status: 'active'
    });

    let totalConcessions = 0;
    concessions.forEach(concession => {
      let concessionAmount = 0;
      if (concession.isPercentage) {
        const percentage = parseFloat(concession.percentage) || 0;
        concessionAmount = (percentage / 100) * (parseFloat(feeStructure.totalFee) || 0);
      } else {
        concessionAmount = parseFloat(concession.amount) || 0;
      }
      if (isNaN(concessionAmount)) concessionAmount = 0;
      totalConcessions += concessionAmount;
    });
    if (isNaN(totalConcessions)) totalConcessions = 0;

    // Get student name from student model
    let student = await StudentBAS.findOne({ studentId: payment.studentId });
    if (!student) {
      student = await StudentBSc.findOne({ studentId: payment.studentId });
    }
    if (!student) {
      student = await StudentBEd.findOne({ studentId: payment.studentId });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();

    const receipt = new Receipt({
      paymentId: payment._id,
      studentId: payment.studentId,
      studentName,
      course: payment.course,
      year: payment.year,
      semester: payment.semester,
      paymentType: payment.paymentType,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      paymentDate: payment.paymentDate || payment.createdAt,
      feeBreakdown: {
        ...feeStructure.feeComponents,
        concessions: totalConcessions,
        totalFee: feeStructure.totalFee
      },
      issuedBy: req.user.id,
      sessionId: student.sessionId
    });

    // Validate receipt data before saving
    if (isNaN(receipt.amount) || receipt.amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    await receipt.save();

    // Generate PDF for original receipt
    try {
      const pdfPath = await generateReceiptPDF(receipt);
      receipt.pdfPath = pdfPath;
      await receipt.save();
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError.message);
      // Continue without PDF, receipt is still valid
    }

    // Automatically generate duplicate receipt
    let duplicateReceipt = null;
    try {
      duplicateReceipt = new Receipt({
        paymentId: receipt.paymentId,
        studentId: receipt.studentId,
        studentName: receipt.studentName,
        course: receipt.course,
        year: receipt.year,
        semester: receipt.semester,
        paymentType: receipt.paymentType,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        transactionId: receipt.transactionId,
        paymentDate: receipt.paymentDate,
        feeBreakdown: receipt.feeBreakdown,
        issuedBy: req.user.id,
        remarks: 'Automatic duplicate receipt',
        isDuplicate: true,
        originalReceiptId: receipt._id
      });

      await duplicateReceipt.save();

      // Generate PDF for duplicate receipt
      try {
        const duplicatePdfPath = await generateReceiptPDF(duplicateReceipt);
        duplicateReceipt.pdfPath = duplicatePdfPath;
        await duplicateReceipt.save();
      } catch (duplicatePdfError) {
        console.error('Error generating PDF for duplicate:', duplicatePdfError.message);
      }
    } catch (duplicateError) {
      console.error('Error creating duplicate receipt:', duplicateError.message);
      // Continue, duplicate is not critical
    }

    // Log audit for original receipt
    try {
      await AuditLog.create({
        action: 'receipt_generated',
        entityType: 'receipt',
        entityId: receipt._id,
        userId: req.user.id,
        userRole: req.user.role,
        details: { paymentId, receiptNumber: receipt.receiptNumber },
        newValues: receipt.toObject(),
        course: payment.course,
        academicYear: payment.year,
        semester: payment.semester
      });
    } catch (auditError) {
      console.error('Error logging audit:', auditError.message);
      // Continue, audit is not critical
    }

    // Log audit for duplicate receipt if created
    if (duplicateReceipt) {
      try {
        await AuditLog.create({
          action: 'duplicate_receipt_generated',
          entityType: 'receipt',
          entityId: duplicateReceipt._id,
          userId: req.user.id,
          userRole: req.user.role,
          details: {
            originalReceiptId: receipt._id,
            duplicateReceiptNumber: duplicateReceipt.receiptNumber
          },
          newValues: duplicateReceipt.toObject(),
          course: payment.course,
          academicYear: payment.year,
          semester: payment.semester
        });
      } catch (duplicateAuditError) {
        console.error('Error logging audit for duplicate:', duplicateAuditError.message);
      }
    }

    res.status(201).json({
      message: 'Receipt generated successfully',
      receipt,
      duplicateReceipt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating receipt', error: error.message });
  }
};

// Get receipt by ID
export const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id);

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receipt', error: error.message });
  }
};

// Get receipts for a student
export const getStudentReceipts = async (req, res) => {
  try {
    const { studentId } = req.params;
    const receipts = await Receipt.find({ studentId, status: 'active' }).sort({ issuedDate: -1 });
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receipts', error: error.message });
  }
};

// Get my receipts (for authenticated student)
export const getMyReceipts = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const receipts = await Receipt.find({ studentId }).sort({ issuedDate: -1 });
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receipts', error: error.message });
  }
};

// Get all receipts (admin view) or student receipts (student view)
export const getAllReceipts = async (req, res) => {
  try {
    const { course, year, semester, status, sessionId } = req.query;
    let query = { isDuplicate: false }; // Exclude duplicate receipts

    if (course) query.course = course;
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (sessionId) query.sessionId = sessionId;

    // If user is student, filter receipts by their studentId
    if (req.user.role === 'student') {
      // Find student record to get studentId
      let student = await StudentBAS.findById(req.user.id);
      if (!student) {
        student = await StudentBSc.findById(req.user.id);
      }
      if (!student) {
        student = await StudentBEd.findById(req.user.id);
      }

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      query.studentId = student.studentId;
    }

    const receipts = await Receipt.find(query)
      .populate('sessionId', 'sessionId startDate endDate')
      .sort({ issuedDate: -1 });
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receipts', error: error.message });
  }
};

// Cancel receipt
export const cancelReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const receipt = await Receipt.findByIdAndUpdate(
      id,
      { status: 'cancelled', remarks: reason },
      { new: true }
    );

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Log audit
    await AuditLog.create({
      action: 'receipt_cancelled',
      entityType: 'receipt',
      entityId: id,
      userId: req.user.id,
      userRole: req.user.role,
      details: { receiptNumber: receipt.receiptNumber, reason },
      oldValues: { status: 'active' },
      newValues: { status: 'cancelled', remarks: reason },
      course: receipt.course,
      academicYear: receipt.year,
      semester: receipt.semester
    });

    res.status(200).json({
      message: 'Receipt cancelled successfully',
      receipt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling receipt', error: error.message });
  }
};

// Duplicate receipt
export const duplicateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const originalReceipt = await Receipt.findById(id);

    if (!originalReceipt) {
      return res.status(404).json({ message: 'Original receipt not found' });
    }

    if (originalReceipt.status !== 'active') {
      return res.status(400).json({ message: 'Can only duplicate active receipts' });
    }

    // Get student to fetch current sessionId (same as in manage receipts)
    let student = await StudentBAS.findOne({ studentId: originalReceipt.studentId });
    if (!student) {
      student = await StudentBSc.findOne({ studentId: originalReceipt.studentId });
    }
    if (!student) {
      student = await StudentBEd.findOne({ studentId: originalReceipt.studentId });
    }

    // Create duplicate receipt with new receipt number
    const duplicateReceipt = new Receipt({
      paymentId: originalReceipt.paymentId,
      studentId: originalReceipt.studentId,
      studentName: originalReceipt.studentName,
      course: originalReceipt.course,
      year: originalReceipt.year,
      semester: originalReceipt.semester,
      paymentType: originalReceipt.paymentType,
      amount: originalReceipt.amount,
      paymentMethod: originalReceipt.paymentMethod,
      transactionId: originalReceipt.transactionId,
      paymentDate: originalReceipt.paymentDate,
      feeBreakdown: originalReceipt.feeBreakdown,
      issuedBy: req.user.id,
      remarks: 'Duplicate receipt',
      isDuplicate: true,
      originalReceiptId: originalReceipt._id,
      sessionId: student ? student.sessionId : originalReceipt.sessionId
    });

    await duplicateReceipt.save();

    // Generate PDF for duplicate
    try {
      const pdfPath = await generateReceiptPDF(duplicateReceipt);
      duplicateReceipt.pdfPath = pdfPath;
      await duplicateReceipt.save();
    } catch (pdfError) {
      console.error('Error generating PDF for duplicate:', pdfError.message);
    }

    // Log audit
    try {
      await AuditLog.create({
        action: 'receipt_duplicated',
        entityType: 'receipt',
        entityId: duplicateReceipt._id,
        userId: req.user.id,
        userRole: req.user.role,
        details: { originalReceiptId: id, duplicateReceiptNumber: duplicateReceipt.receiptNumber },
        newValues: duplicateReceipt.toObject(),
        course: originalReceipt.course,
        academicYear: originalReceipt.year,
        semester: originalReceipt.semester
      });
    } catch (auditError) {
      console.error('Error logging audit for duplicate:', auditError.message);
    }

    res.status(201).json({
      message: 'Duplicate receipt generated successfully',
      receipt: duplicateReceipt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error duplicating receipt', error: error.message });
  }
};

// Download receipt PDF
export const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id);

    if (!receipt || !receipt.pdfPath) {
      return res.status(404).json({ message: 'Receipt PDF not found' });
    }

    // Check if user is student and if the receipt belongs to them
    if (req.user.role === 'student') {
      // Find student record using the authenticated user's _id to get the correct studentId
      let student = await StudentBAS.findById(req.user.id);
      if (!student) {
        student = await StudentBSc.findById(req.user.id);
      }
      if (!student) {
        student = await StudentBEd.findById(req.user.id);
      }

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const studentId = student.studentId;
      if (receipt.studentId !== studentId) {
        return res.status(403).json({ message: 'Access denied. You can only download your own receipts.' });
      }
    }

    const pdfPath = path.join(__dirname, '..', '..', receipt.pdfPath);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'Receipt file not found' });
    }

    res.download(pdfPath, `${receipt.receiptNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading receipt', error: error.message });
  }
};

// Get duplicate receipts (admin view)
export const getDuplicateReceipts = async (req, res) => {
  try {
    const { course, year, semester, status, sessionId } = req.query;
    let query = { isDuplicate: true };

    if (course) query.course = course;
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;
    if (sessionId) query.sessionId = sessionId;

    const duplicateReceipts = await Receipt.find(query)
      .populate('originalReceiptId', 'receiptNumber studentName')
      .populate('sessionId', 'sessionId startDate endDate')
      .sort({ issuedDate: -1 });

    res.status(200).json(duplicateReceipts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching duplicate receipts', error: error.message });
  }
};
