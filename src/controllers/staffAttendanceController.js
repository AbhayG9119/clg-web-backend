import Faculty from '../models/Faculty.js';
import StaffAttendance from '../models/StaffAttendance.js';
import Leave from '../models/Leave.js';

// Get all staff members
const getStaffList = async (req, res) => {
  try {
    const staff = await Faculty.find().select('name designation department staffId');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance for a specific date
const getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const attendanceDate = new Date(date);

    const attendance = await StaffAttendance.find({ date: attendanceDate })
      .populate('staffId', 'name designation department staffId')
      .populate('markedBy', 'email');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance for staff
const markAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body; // attendanceData: [{ staffId, status }]
    const markedBy = req.user.id;

    const attendanceDate = new Date(date);
    const attendanceRecords = [];

    for (const record of attendanceData) {
      const existingRecord = await StaffAttendance.findOne({
        staffId: record.staffId,
        date: attendanceDate
      });

      if (existingRecord) {
        existingRecord.status = record.status;
        existingRecord.markedBy = markedBy;
        await existingRecord.save();
        attendanceRecords.push(existingRecord);
      } else {
        const newRecord = new StaffAttendance({
          staffId: record.staffId,
          date: attendanceDate,
          status: record.status,
          markedBy
        });
        await newRecord.save();
        attendanceRecords.push(newRecord);
      }
    }

    res.json({ message: 'Attendance marked successfully', attendance: attendanceRecords });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance records for a date range
const getAttendanceRecords = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const records = await StaffAttendance.find({
      date: { $gte: start, $lte: end }
    })
      .populate('staffId', 'name designation department staffId')
      .populate('markedBy', 'email')
      .sort({ date: 1, 'staffId.name': 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leave requests
const getLeaveRequests = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });

    // Populate staffId manually to handle both ObjectId and string cases
    const populatedLeaves = await Promise.all(leaves.map(async (leave) => {
      let staff = null;
      if (typeof leave.staffId === 'string') {
        // If staffId is string, find Faculty by staffId field
        staff = await Faculty.findOne({ staffId: leave.staffId }).select('name designation department staffId');
      } else if (leave.staffId) {
        // If ObjectId, populate normally
        staff = await Faculty.findById(leave.staffId).select('name designation department staffId');
      }
      return {
        ...leave.toObject(),
        staffId: staff
      };
    }));

    res.json(populatedLeaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update leave status
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Populate staffId manually to handle both ObjectId and string cases
    let staff = null;
    if (typeof leave.staffId === 'string') {
      staff = await Faculty.findOne({ staffId: leave.staffId }).select('name designation department staffId');
    } else if (leave.staffId) {
      staff = await Faculty.findById(leave.staffId).select('name designation department staffId');
    }
    const populatedLeave = {
      ...leave.toObject(),
      staffId: staff
    };

    res.json({ message: `Leave ${status} successfully`, leave: populatedLeave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get monthly attendance for all staff
const getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Fetch all staff
    const allStaff = await Faculty.find().select('name designation department staffId');

    // Fetch attendance records for the month
    const records = await StaffAttendance.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('staffId', 'name designation department staffId')
      .sort({ 'staffId.name': 1, date: 1 });

    // Group attendance by staff
    const attendanceMap = {};
    records.forEach(record => {
      const staffId = record.staffId._id.toString();
      if (!attendanceMap[staffId]) {
        attendanceMap[staffId] = {};
      }
      const day = record.date.getDate();
      attendanceMap[staffId][day] = record.status;
    });

    // Build monthly data for all staff
    const monthlyData = allStaff.map(staff => ({
      staff,
      attendance: attendanceMap[staff._id.toString()] || {}
    }));

    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getStaffList,
  getAttendance,
  markAttendance,
  getAttendanceRecords,
  getLeaveRequests,
  updateLeaveStatus,
  getMonthlyAttendance
};
