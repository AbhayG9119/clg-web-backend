import StudentBAS from '../models/StudentBAS.js';
import StudentBSc from '../models/StudentBSc.js';
import StudentBEd from '../models/StudentBEd.js';
import Faculty from '../models/Faculty.js';
import FeePayment from '../models/FeePayment.js';
import Enquiry from '../models/Enquiry.js';
import AcademicSession from '../models/AcademicSession.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total students across all departments
    const [basCount, bscCount, bedCount] = await Promise.all([
      StudentBAS.countDocuments({ isActive: true }),
      StudentBSc.countDocuments({ isActive: true }),
      StudentBEd.countDocuments({ isActive: true })
    ]);

    const totalStudents = basCount + bscCount + bedCount;

    // Get total staff
    const totalStaff = await Faculty.countDocuments({ isActive: true });

    // Get pending fees (total outstanding amount)
    const pendingFeesResult = await FeePayment.aggregate([
      { $match: { status: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
    ]);

    const pendingFees = pendingFeesResult.length > 0 ? pendingFeesResult[0].total : 0;

    // Get today's attendance (mock for now - would need attendance model)
    // For now, return a percentage based on total students
    const todayAttendance = totalStudents > 0 ? Math.floor((Math.random() * 10 + 85)) : 0; // 85-95%

    // Get upcoming exams (mock - would need exam model)
    const upcomingExams = Math.floor(Math.random() * 5) + 1; // 1-5 exams

    // Get active enquiries
    const activeEnquiries = await Enquiry.countDocuments({
      status: { $in: ['new', 'in-progress'] }
    });

    // Get current active session
    const activeSession = await AcademicSession.findOne({ isActive: true });

    const stats = {
      totalStudents,
      totalStaff,
      pendingFees,
      todayAttendance,
      upcomingExams,
      activeEnquiries,
      activeSession: activeSession ? {
        sessionId: activeSession.sessionId,
        startDate: activeSession.startDate,
        endDate: activeSession.endDate
      } : null
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get alerts/notifications
export const getAlerts = async (req, res) => {
  try {
    // Mock alerts - in real implementation, this would come from a notifications model
    const alerts = [
      {
        _id: '1',
        message: 'System maintenance scheduled for tonight at 11 PM',
        type: 'warning',
        createdAt: new Date()
      },
      {
        _id: '2',
        message: 'New academic session starts next week',
        type: 'info',
        createdAt: new Date()
      }
    ];

    // Check for overdue fees
    const overdueFees = await FeePayment.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $in: ['pending', 'partial'] }
    });

    if (overdueFees > 0) {
      alerts.push({
        _id: '3',
        message: `${overdueFees} students have overdue fees`,
        type: 'error',
        createdAt: new Date()
      });
    }

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    // Mock recent activities - would need activity log model
    const activities = [
      {
        _id: '1',
        action: 'Fee payment received',
        details: '₹5000 received from student ID: STU001',
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        _id: '2',
        action: 'New student admission',
        details: 'Student John Doe admitted to B.Sc program',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        _id: '3',
        action: 'Staff attendance marked',
        details: 'Attendance marked for 45 staff members',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
      }
    ];

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
