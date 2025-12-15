import FeePayment from '../models/FeePayment.js';
import FeeStructure from '../models/FeeStructure.js';
import Concession from '../models/Concession.js';
import Receipt from '../models/Receipt.js';
import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import MarkSheet from '../models/MarkSheet.js';
import TransferCertificate from '../models/TransferCertificate.js';
import AcademicReport from '../models/AcademicReport.js';
import AcademicSession from '../models/AcademicSession.js';

// Get collection reports (batch/course/semester/year wise)
export const getCollectionReports = async (req, res) => {
  try {
    const { course, year, semester, batch, startDate, endDate, period } = req.query;

    let matchConditions = {};

    if (course) matchConditions.course = course;
    if (year) matchConditions.year = parseInt(year);
    if (semester) matchConditions.semester = parseInt(semester);
    if (batch) matchConditions.batch = batch;

    // Handle period-based date filtering
    if (period) {
      const now = new Date();
      let start, end;

      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // End of week
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'yearly':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          // No date filter for other periods
          break;
      }

      if (start && end) {
        matchConditions.createdAt = {
          $gte: start,
          $lt: end
        };
      }
    } else if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
      if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
    }

    const reports = await FeePayment.aggregate([
      { $match: { ...matchConditions, status: 'Paid' } },
      {
        $group: {
          _id: {
            course: '$course',
            year: '$year',
            semester: '$semester',
            paymentType: '$paymentType'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          payments: {
            $push: {
              studentId: '$studentId',
              amount: '$amount',
              paymentDate: '$createdAt'
            }
          }
        }
      },
      {
        $group: {
          _id: {
            course: '$_id.course',
            year: '$_id.year',
            semester: '$_id.semester'
          },
          paymentTypes: {
            $push: {
              type: '$_id.paymentType',
              totalAmount: '$totalAmount',
              count: '$count'
            }
          },
          totalCollection: { $sum: '$totalAmount' },
          totalPayments: { $sum: '$count' }
        }
      },
      {
        $sort: { '_id.course': 1, '_id.year': 1, '_id.semester': 1 }
      }
    ]);

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error generating collection reports', error: error.message });
  }
};

// Get defaulter reports
export const getDefaulterReports = async (req, res) => {
  try {
    const { course, year, semester, daysOverdue = 30 } = req.query;

    // Get all students for the specified course/year/semester
    let StudentModel;
    switch (course) {
      case 'B.A': StudentModel = StudentBAS; break;
      case 'B.Sc': StudentModel = StudentBSc; break;
      case 'B.Ed': StudentModel = StudentBEd; break;
      default: return res.status(400).json({ message: 'Invalid course specified' });
    }

    const students = await StudentModel.find(
      year ? { year: parseInt(year) } : {},
      'studentId firstName lastName department year semester'
    );

    // Get fee structure
    const feeStructure = await FeeStructure.findOne({ course });
    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Calculate due amounts and check payments
    const defaulters = [];

    for (const student of students) {
      // Check if student has paid for current semester
      const payment = await FeePayment.findOne({
        studentId: student.studentId,
        course,
        year: student.year,
        semester: student.semester,
        status: 'Paid'
      });

      if (!payment) {
        // Calculate due amount
        const semesterFee = feeStructure.totalFee / 2; // Assuming 2 semesters per year

        // Check for concessions
        const concessions = await Concession.find({
          studentId: student.studentId,
          course,
          academicYear: student.year,
          semester: student.semester,
          status: 'active'
        });

        const totalConcessions = concessions.reduce((sum, concession) => sum + concession.amount, 0);
        const dueAmount = semesterFee - totalConcessions;

        // Calculate days overdue (simplified - using semester start date)
        const currentDate = new Date();
        const semesterStartDate = new Date(currentDate.getFullYear(), student.semester === 1 ? 0 : 6, 1); // Jan or Jul
        const daysSinceDue = Math.floor((currentDate - semesterStartDate) / (1000 * 60 * 60 * 24));

        if (daysSinceDue > parseInt(daysOverdue)) {
          defaulters.push({
            studentId: student.studentId,
            name: `${student.firstName} ${student.lastName}`,
            course: student.department,
            year: student.year,
            semester: student.semester,
            dueAmount,
            daysOverdue: daysSinceDue,
            lastPaymentDate: null
          });
        }
      }
    }

    res.status(200).json({
      defaulters,
      totalDefaulters: defaulters.length,
      totalDueAmount: defaulters.reduce((sum, defaulter) => sum + defaulter.dueAmount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating defaulter reports', error: error.message });
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    const { course, year, semester } = req.query;

    let matchConditions = { status: 'Paid' };
    if (course) matchConditions.course = course;
    if (year) matchConditions.year = parseInt(year);
    if (semester) matchConditions.semester = parseInt(semester);

    const stats = await FeePayment.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            course: '$course',
            year: '$year',
            semester: '$semester',
            status: '$status'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            course: '$_id.course',
            year: '$_id.year',
            semester: '$_id.semester'
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Paid'] }, '$totalAmount', 0]
            }
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Paid'] }, '$count', 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Pending'] }, '$totalAmount', 0]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Pending'] }, '$count', 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Failed'] }, '$totalAmount', 0]
            }
          },
          failedCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'Failed'] }, '$count', 0]
            }
          }
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment statistics', error: error.message });
  }
};

// Get concession reports
export const getConcessionReports = async (req, res) => {
  try {
    const { course, academicYear, semester, type } = req.query;

    let matchConditions = {};
    if (course) matchConditions.course = course;
    if (academicYear) matchConditions.academicYear = parseInt(academicYear);
    if (semester) matchConditions.semester = parseInt(semester);
    if (type) matchConditions.concessionType = type;

    const reports = await Concession.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            course: '$course',
            academicYear: '$academicYear',
            semester: '$semester',
            type: '$concessionType'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          concessions: {
            $push: {
              studentId: '$studentId',
              title: '$title',
              amount: '$amount',
              approvedBy: '$approvedBy'
            }
          }
        }
      },
      {
        $sort: { '_id.course': 1, '_id.academicYear': 1, '_id.semester': 1 }
      }
    ]);

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error generating concession reports', error: error.message });
  }
};

// Get receipt reports
export const getReceiptReports = async (req, res) => {
  try {
    const { course, year, semester, startDate, endDate } = req.query;

    let matchConditions = {};
    if (course) matchConditions.course = course;
    if (year) matchConditions.year = parseInt(year);
    if (semester) matchConditions.semester = parseInt(semester);
    if (startDate || endDate) {
      matchConditions.issuedDate = {};
      if (startDate) matchConditions.issuedDate.$gte = new Date(startDate);
      if (endDate) matchConditions.issuedDate.$lte = new Date(endDate);
    }

    const reports = await Receipt.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            course: '$course',
            year: '$year',
            semester: '$semester'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          receipts: {
            $push: {
              receiptNumber: '$receiptNumber',
              studentId: '$studentId',
              amount: '$amount',
              issuedDate: '$issuedDate'
            }
          }
        }
      },
      {
        $sort: { '_id.course': 1, '_id.year': 1, '_id.semester': 1 }
      }
    ]);

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error generating receipt reports', error: error.message });
  }
};

// Helper function to get student model
const getStudentModel = (department) => {
  switch (department) {
    case 'B.A': return StudentBAS;
    case 'B.Sc': return StudentBSc;
    case 'B.Ed': return StudentBEd;
    default: return null;
  }
};

// Generate mark sheet for a student
export const generateMarkSheet = async (req, res) => {
  try {
    const { studentId, year, semester, subjects, generatedBy } = req.body;

    // Find student across all models
    let student = await StudentBAS.findById(studentId);
    let studentModel = 'StudentBAS';
    if (!student) {
      student = await StudentBSc.findById(studentId);
      studentModel = 'StudentBSc';
    }
    if (!student) {
      student = await StudentBEd.findById(studentId);
      studentModel = 'StudentBEd';
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get active session
    const session = await AcademicSession.findOne({ isActive: true });
    if (!session) {
      return res.status(400).json({ message: 'No active academic session found' });
    }

    // Check if mark sheet already exists
    const existingMarkSheet = await MarkSheet.findOne({
      studentId,
      year,
      semester,
      sessionId: session._id
    });

    if (existingMarkSheet) {
      return res.status(400).json({ message: 'Mark sheet already exists for this semester' });
    }

    // Calculate grades and status
    const processedSubjects = subjects.map(subject => {
      const totalMarks = subject.internalMarks + subject.externalMarks;
      let grade = 'F';
      let status = 'Fail';

      if (totalMarks >= 91) grade = 'A+';
      else if (totalMarks >= 81) grade = 'A';
      else if (totalMarks >= 71) grade = 'B+';
      else if (totalMarks >= 61) grade = 'B';
      else if (totalMarks >= 51) grade = 'C+';
      else if (totalMarks >= 41) grade = 'C';
      else if (totalMarks >= 33) grade = 'D';

      if (totalMarks >= 33) status = 'Pass';

      return {
        ...subject,
        totalMarks,
        grade,
        status
      };
    });

    // Calculate SGPA
    const passedSubjects = processedSubjects.filter(s => s.status === 'Pass');
    const sgpa = passedSubjects.length > 0 ?
      passedSubjects.reduce((sum, subject) => {
        const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0 };
        return sum + (gradePoints[subject.grade] * subject.credits);
      }, 0) / processedSubjects.reduce((sum, subject) => sum + subject.credits, 0) : 0;

    const markSheet = new MarkSheet({
      studentId,
      studentModel,
      sessionId: session._id,
      year,
      semester,
      subjects: processedSubjects,
      sgpa: Math.round(sgpa * 100) / 100,
      overallStatus: passedSubjects.length === processedSubjects.length ? 'Pass' : 'Fail',
      generatedBy
    });

    await markSheet.save();

    res.status(201).json({
      message: 'Mark sheet generated successfully',
      markSheet
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating mark sheet', error: error.message });
  }
};

// Get mark sheets for a student
export const getStudentMarkSheets = async (req, res) => {
  try {
    const { studentId } = req.params;

    const markSheets = await MarkSheet.find({ studentId })
      .populate('sessionId', 'sessionId academicYear')
      .sort({ year: 1, semester: 1 });

    res.json(markSheets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching mark sheets', error: error.message });
  }
};

// Generate transfer certificate
export const generateTransferCertificate = async (req, res) => {
  try {
    const {
      studentId,
      reasonForLeaving,
      lastDateOfAttendance,
      courseCompleted,
      issuedBy,
      authorizedBy,
      remarks
    } = req.body;

    // Find student across all models
    let student = await StudentBAS.findById(studentId);
    let studentModel = 'StudentBAS';
    if (!student) {
      student = await StudentBSc.findById(studentId);
      studentModel = 'StudentBSc';
    }
    if (!student) {
      student = await StudentBEd.findById(studentId);
      studentModel = 'StudentBEd';
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get active session
    const session = await AcademicSession.findOne({ isActive: true });
    if (!session) {
      return res.status(400).json({ message: 'No active academic session found' });
    }

    // Check if TC already exists
    const existingTC = await TransferCertificate.findOne({ studentId });
    if (existingTC) {
      return res.status(400).json({ message: 'Transfer certificate already exists for this student' });
    }

    // Get final academic details
    const finalYear = student.year;
    const finalSemester = student.semester;

    // Calculate CGPA from all mark sheets
    const markSheets = await MarkSheet.find({ studentId });
    const cgpa = markSheets.length > 0 ?
      markSheets.reduce((sum, ms) => sum + ms.sgpa, 0) / markSheets.length : 0;

    const overallGrade = cgpa >= 9 ? 'A+' : cgpa >= 8 ? 'A' : cgpa >= 7 ? 'B+' : cgpa >= 6 ? 'B' : 'C';

    const tc = new TransferCertificate({
      studentId,
      studentModel,
      sessionId: session._id,
      reasonForLeaving,
      academicDetails: {
        admissionDate: student.admissionYear ? new Date(student.admissionYear, 0, 1) : new Date(),
        lastDateOfAttendance: new Date(lastDateOfAttendance),
        courseCompleted,
        finalYear,
        finalSemester,
        overallGrade,
        cgpa: Math.round(cgpa * 100) / 100
      },
      issuedBy,
      authorizedBy,
      remarks
    });

    await tc.save();

    res.status(201).json({
      message: 'Transfer certificate generated successfully',
      transferCertificate: tc
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating transfer certificate', error: error.message });
  }
};

// Get transfer certificate for a student
export const getStudentTransferCertificate = async (req, res) => {
  try {
    const { studentId } = req.params;

    const tc = await TransferCertificate.findOne({ studentId })
      .populate('sessionId', 'sessionId academicYear')
      .populate('issuedBy', 'name')
      .populate('authorizedBy', 'name');

    if (!tc) {
      return res.status(404).json({ message: 'Transfer certificate not found' });
    }

    res.json(tc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transfer certificate', error: error.message });
  }
};

// Generate academic report
export const generateAcademicReport = async (req, res) => {
  try {
    const {
      studentId,
      reportType,
      period,
      academicPerformance,
      attendance,
      coCurricularActivities,
      disciplinaryRecord,
      recommendations,
      nextSteps,
      generatedBy
    } = req.body;

    // Find student across all models
    let student = await StudentBAS.findById(studentId);
    let studentModel = 'StudentBAS';
    if (!student) {
      student = await StudentBSc.findById(studentId);
      studentModel = 'StudentBSc';
    }
    if (!student) {
      student = await StudentBEd.findById(studentId);
      studentModel = 'StudentBEd';
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get active session
    const session = await AcademicSession.findOne({ isActive: true });
    if (!session) {
      return res.status(400).json({ message: 'No active academic session found' });
    }

    const report = new AcademicReport({
      studentId,
      studentModel,
      sessionId: session._id,
      reportType,
      period,
      academicPerformance,
      attendance,
      coCurricularActivities,
      disciplinaryRecord,
      recommendations,
      nextSteps,
      generatedBy
    });

    await report.save();

    res.status(201).json({
      message: 'Academic report generated successfully',
      report
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating academic report', error: error.message });
  }
};

// Get academic reports for a student
export const getStudentAcademicReports = async (req, res) => {
  try {
    const { studentId } = req.params;

    const reports = await AcademicReport.find({ studentId })
      .populate('sessionId', 'sessionId academicYear')
      .sort({ 'period.fromDate': -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching academic reports', error: error.message });
  }
};
