import Attendance from '../models/Attendance.js';
import studentModel from '../models/studentModel.js'; // Assuming general student model

// Mark attendance for a class
const markAttendance = async (req, res) => {
  try {
    const { class: className, subject, date, students } = req.body;
    const staffId = req.user.id;

    // Validate students array
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required' });
    }

    // Fetch students to validate
    const validStudents = await studentModel.find({ class: className });
    const studentIds = validStudents.map(s => s._id.toString());

    const invalidStudents = students.filter(s => !studentIds.includes(s.studentId));
    if (invalidStudents.length > 0) {
      return res.status(400).json({ message: 'Invalid student IDs provided' });
    }

    const attendanceData = {
      staffId,
      class: className,
      subject,
      date: new Date(date),
      students: students.map(s => ({
        studentId: s.studentId,
        status: s.status
      }))
    };

    let attendance = await Attendance.findOne({ staffId, class: className, subject, date: attendanceData.date });
    if (attendance) {
      // Update existing
      attendance.students = attendanceData.students;
      attendance = await attendance.save();
    } else {
      // Create new
      attendance = new Attendance(attendanceData);
      await attendance.save();
    }

    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get daily attendance report
const getDailyReport = async (req, res) => {
  try {
    const { date, class: className } = req.query;
    const staffId = req.user.id;

    const attendances = await Attendance.find({
      staffId,
      class: className,
      date: new Date(date)
    }).populate('students.studentId', 'name rollNo');

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get monthly attendance report
const getMonthlyReport = async (req, res) => {
  try {
    const { month, class: className } = req.query; // month: "2024-10"
    const staffId = req.user.id;

    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const attendances = await Attendance.find({
      staffId,
      class: className,
      date: { $gte: startDate, $lt: endDate }
    }).populate('students.studentId', 'name rollNo');

    // Calculate summary (e.g., total present days per student)
    const summary = {};
    attendances.forEach(att => {
      att.students.forEach(s => {
        if (!summary[s.studentId._id]) {
          summary[s.studentId._id] = { name: s.studentId.name, present: 0, total: 0 };
        }
        summary[s.studentId._id].total += 1;
        if (s.status === 'present') {
          summary[s.studentId._id].present += 1;
        }
      });
    });

    res.json({ attendances, summary: Object.values(summary) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { markAttendance, getDailyReport, getMonthlyReport };
